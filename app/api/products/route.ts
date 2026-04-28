import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/server/db";
import type { Product } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const categoryId = searchParams.get("category_id");

  const sql = `
    SELECT
      p.id, p.sku, p.name, p.description, p.category_id, p.base_price,
      p.brand, p.poster_url, p.broll_url, p.is_hyped, p.created_at, p.updated_at,
      c.name AS category_name,
      COALESCE(SUM(i.current_quantity), 0) AS total_on_hand,
      MAX(i.is_low_stock) AS is_low_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory_nodes i ON i.product_id = p.id
    ${categoryId ? "WHERE p.category_id = ?" : ""}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const params = categoryId
    ? [Number(categoryId), limit, offset]
    : [limit, offset];

  const products = await query<Product>(sql, params);
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { sku, name, description, category_id, base_price, brand, poster_url, broll_url, is_hyped } = body as {
    sku?: string;
    name?: string;
    description?: string | null;
    category_id?: number | null;
    base_price?: number;
    brand?: string | null;
    poster_url?: string | null;
    broll_url?: string | null;
    is_hyped?: boolean;
  };

  if (!sku || !name || base_price == null) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", required: ["sku", "name", "base_price"] },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      `INSERT INTO products
        (sku, name, description, category_id, base_price, brand, poster_url, broll_url, is_hyped)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku,
        name,
        description ?? null,
        category_id ?? null,
        base_price,
        brand ?? null,
        poster_url ?? null,
        broll_url ?? null,
        is_hyped ?? false,
      ],
    );
    return NextResponse.json({ id: result.insertId, sku }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB_ERROR";
    if (message.includes("Duplicate entry")) {
      return NextResponse.json({ error: "SKU_ALREADY_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
