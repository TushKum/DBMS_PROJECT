import { query } from "@/server/db";
import type { AvailabilityEntry, Product } from "@/server/types";

// Fields shared across every dashboard row, including the embedded
// per-platform availability JSON used by the hover card.
const PRODUCT_WITH_AVAILABILITY_FIELDS = `
  p.id, p.sku, p.name, p.description, p.category_id, p.base_price,
  p.brand, p.poster_url, p.broll_url, p.is_hyped, p.created_at, p.updated_at,
  COALESCE(SUM(i.current_quantity), 0) AS total_on_hand,
  MAX(i.is_low_stock) AS is_low_stock,
  COUNT(DISTINCT CASE WHEN i.current_quantity > 0 THEN i.platform_id END) AS platforms_in_stock,
  MIN(CASE WHEN i.current_quantity > 0 THEN i.platform_price END) AS min_price,
  COALESCE(
    JSON_ARRAYAGG(
      CASE WHEN i.id IS NOT NULL THEN
        JSON_OBJECT(
          'platform_slug', pl.slug,
          'platform_name', pl.name,
          'kind', pl.kind,
          'brand_color', pl.brand_color,
          'size', i.size,
          'color', i.color,
          'in_stock', i.current_quantity > 0,
          'qty', i.current_quantity,
          'price', i.platform_price,
          'url', i.product_url
        )
      END
    ),
    JSON_ARRAY()
  ) AS availability
`;

const FROM_PRODUCT_INVENTORY = `
  FROM products p
  LEFT JOIN inventory_nodes i ON i.product_id = p.id
  LEFT JOIN platforms pl ON pl.id = i.platform_id
`;

type RawProductRow = Omit<Product, "availability"> & {
  availability: string | AvailabilityEntry[] | null;
};

function normalize(rows: RawProductRow[]): Product[] {
  return rows.map((r) => ({
    ...r,
    availability:
      typeof r.availability === "string"
        ? (JSON.parse(r.availability) as AvailabilityEntry[])
        : (r.availability ?? []),
  }));
}

export async function getDashboardRows() {
  const [highVelocity, lowStock, recentlyRestocked, byCategory] = await Promise.all([
    query<RawProductRow>(
      `SELECT
         ${PRODUCT_WITH_AVAILABILITY_FIELDS},
         ROUND(COALESCE(s.units_sold, 0) / 7, 2) AS daily_velocity
       ${FROM_PRODUCT_INVENTORY}
       LEFT JOIN (
         SELECT product_id, SUM(quantity) AS units_sold
         FROM movements
         WHERE action_type = 'SALE'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY product_id
       ) s ON s.product_id = p.id
       GROUP BY p.id
       HAVING daily_velocity > 0
       ORDER BY daily_velocity DESC
       LIMIT 20`,
    ),
    query<RawProductRow>(
      // Filter via EXISTS on inventory_nodes so the JOIN above still includes
      // every platform's availability for the product (not just the low-stock variants).
      `SELECT ${PRODUCT_WITH_AVAILABILITY_FIELDS}
       ${FROM_PRODUCT_INVENTORY}
       WHERE p.id IN (SELECT product_id FROM inventory_nodes WHERE is_low_stock = TRUE)
       GROUP BY p.id
       ORDER BY total_on_hand ASC
       LIMIT 20`,
    ),
    query<RawProductRow>(
      `SELECT
         ${PRODUCT_WITH_AVAILABILITY_FIELDS},
         (SELECT MAX(created_at)
          FROM movements
          WHERE product_id = p.id AND action_type = 'RESTOCK') AS last_restocked_at
       ${FROM_PRODUCT_INVENTORY}
       WHERE p.id IN (
         SELECT product_id FROM movements
         WHERE action_type = 'RESTOCK'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       )
       GROUP BY p.id
       ORDER BY last_restocked_at DESC
       LIMIT 20`,
    ),
    query<RawProductRow>(
      `SELECT
         ${PRODUCT_WITH_AVAILABILITY_FIELDS},
         c.name AS category_name
       ${FROM_PRODUCT_INVENTORY}
       LEFT JOIN categories c ON c.id = p.category_id
       GROUP BY p.id
       ORDER BY p.is_hyped DESC, p.category_id, p.name
       LIMIT 40`,
    ),
  ]);

  return {
    highVelocity: normalize(highVelocity),
    lowStock: normalize(lowStock),
    recentlyRestocked: normalize(recentlyRestocked),
    byCategory: normalize(byCategory),
  };
}

export async function getProductAvailability(productId: number): Promise<AvailabilityEntry[]> {
  const rows = await query<{
    platform_slug: string;
    platform_name: string;
    kind: "MARKETPLACE" | "BRAND_DTC";
    brand_color: string | null;
    size: string;
    color: string;
    qty: number;
    price: number | null;
    url: string | null;
  }>(
    `SELECT
       pl.slug  AS platform_slug,
       pl.name  AS platform_name,
       pl.kind  AS kind,
       pl.brand_color,
       i.size,
       i.color,
       i.current_quantity AS qty,
       i.platform_price   AS price,
       i.product_url      AS url
     FROM inventory_nodes i
     JOIN platforms pl ON pl.id = i.platform_id
     WHERE i.product_id = ?
     ORDER BY pl.kind, pl.name, i.size`,
    [productId],
  );
  return rows.map((r) => ({
    platform_slug: r.platform_slug,
    platform_name: r.platform_name,
    kind: r.kind,
    brand_color: r.brand_color,
    size: r.size,
    color: r.color,
    in_stock: r.qty > 0,
    qty: r.qty,
    price: r.price ?? 0,
    url: r.url,
  }));
}

export async function getProductDetail(productId: number) {
  const product = await query<Product & { category_name: string | null }>(
    `SELECT p.*, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [productId],
  );
  if (!product[0]) return null;
  const availability = await getProductAvailability(productId);
  return { ...product[0], availability };
}

export async function getSuppliers() {
  return query<{
    id: number;
    name: string;
    lead_time_days: number;
    reliability_score: number;
    contact_email: string | null;
    products_supplied: number;
  }>(
    `SELECT
       s.id, s.name, s.lead_time_days, s.reliability_score, s.contact_email,
       COUNT(ps.product_id) AS products_supplied
     FROM suppliers s
     LEFT JOIN product_sourcing ps ON ps.supplier_id = s.id
     GROUP BY s.id
     ORDER BY products_supplied DESC, s.name`,
  );
}

export async function getPlatforms() {
  return query<{
    id: number;
    slug: string;
    name: string;
    kind: "MARKETPLACE" | "BRAND_DTC";
    url: string | null;
    brand_color: string | null;
    products_listed: number;
    in_stock_variants: number;
  }>(
    `SELECT
       pl.id, pl.slug, pl.name, pl.kind, pl.url, pl.brand_color,
       COUNT(DISTINCT i.product_id) AS products_listed,
       SUM(CASE WHEN i.current_quantity > 0 THEN 1 ELSE 0 END) AS in_stock_variants
     FROM platforms pl
     LEFT JOIN inventory_nodes i ON i.platform_id = pl.id
     GROUP BY pl.id
     ORDER BY pl.kind, pl.name`,
  );
}
