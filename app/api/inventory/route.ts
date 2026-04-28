import { NextRequest, NextResponse } from "next/server";
import { execute, query, type SqlParam } from "@/server/db";
import type { InventoryNode } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const platformId = searchParams.get("platform_id");
  const lowOnly = searchParams.get("low_stock") === "true";

  const where: string[] = [];
  const params: SqlParam[] = [];
  if (productId) {
    where.push("i.product_id = ?");
    params.push(Number(productId));
  }
  if (platformId) {
    where.push("i.platform_id = ?");
    params.push(Number(platformId));
  }
  if (lowOnly) {
    where.push("i.is_low_stock = TRUE");
  }

  const nodes = await query<InventoryNode>(
    `SELECT
       i.id, i.platform_id, i.product_id, i.size, i.color,
       i.current_quantity, i.reorder_level, i.capacity,
       i.platform_price, i.product_url, i.is_low_stock,
       i.last_checked_at, i.updated_at,
       pl.slug AS platform_slug, pl.name AS platform_name
     FROM inventory_nodes i
     JOIN platforms pl ON pl.id = i.platform_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY i.is_low_stock DESC, i.updated_at DESC
     LIMIT 500`,
    params,
  );
  return NextResponse.json({ nodes });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    platform_id?: number;
    product_id?: number;
    size?: string;
    color?: string;
    current_quantity?: number;
    reorder_level?: number;
    capacity?: number;
    platform_price?: number;
    product_url?: string;
  };

  const { platform_id, product_id, size, color } = body;
  if (!platform_id || !product_id || !size || !color) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", required: ["platform_id", "product_id", "size", "color"] },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      `INSERT INTO inventory_nodes
        (platform_id, product_id, size, color, current_quantity, reorder_level, capacity, platform_price, product_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        platform_id,
        product_id,
        size,
        color,
        body.current_quantity ?? 0,
        body.reorder_level ?? 5,
        body.capacity ?? 1000,
        body.platform_price ?? null,
        body.product_url ?? null,
      ],
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB_ERROR";
    if (message.includes("Duplicate")) {
      return NextResponse.json({ error: "VARIANT_ALREADY_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
