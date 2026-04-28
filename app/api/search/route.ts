import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";
import type { Product } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ products: [] });
  }

  // FULLTEXT first for ranked relevance on multi-word queries; LIKE fallback
  // catches partial-word matches (e.g. "glide" inside "AirGlide") which
  // FULLTEXT cannot find since it tokenizes on word boundaries.
  const products = await query<Product>(
    `SELECT
       p.id, p.sku, p.name, p.description, p.category_id, p.base_price,
       p.brand, p.poster_url, p.broll_url, p.is_hyped, p.created_at, p.updated_at,
       (
         COALESCE(MATCH (p.name, p.description, p.brand) AGAINST (? IN NATURAL LANGUAGE MODE), 0)
         + CASE WHEN p.sku LIKE ?  THEN 100 ELSE 0 END
         + CASE WHEN p.name LIKE ? THEN  10 ELSE 0 END
         + CASE WHEN p.brand LIKE ? THEN  5 ELSE 0 END
       ) AS relevance
     FROM products p
     WHERE MATCH (p.name, p.description, p.brand) AGAINST (? IN NATURAL LANGUAGE MODE)
        OR p.sku LIKE ?
        OR p.name LIKE ?
        OR p.description LIKE ?
        OR p.brand LIKE ?
     ORDER BY relevance DESC
     LIMIT 30`,
    [q, `${q}%`, `%${q}%`, `%${q}%`, q, `${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
  );

  return NextResponse.json({ products, query: q });
}
