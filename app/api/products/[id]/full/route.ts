import { NextRequest, NextResponse } from "next/server";
import { getProductDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }
  const product = await getProductDetail(productId);
  if (!product) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ product });
}
