import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne, type SqlParam } from "@/server/db";
import type { Product } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  const product = await queryOne<Product>(
    `SELECT p.*, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [productId],
  );
  if (!product) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const allowed = [
    "name",
    "description",
    "category_id",
    "base_price",
    "brand",
    "poster_url",
    "broll_url",
    "is_hyped",
  ] as const;

  const updates: string[] = [];
  const values: SqlParam[] = [];
  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key] as SqlParam);
    }
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: "NO_UPDATES" }, { status: 400 });
  }
  values.push(productId);

  const result = await execute(
    `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, affected: result.affectedRows });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  const result = await execute("DELETE FROM products WHERE id = ?", [productId]);
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
