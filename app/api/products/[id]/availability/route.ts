import { NextRequest, NextResponse } from "next/server";
import { getProductAvailability } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }
  const availability = await getProductAvailability(productId);
  return NextResponse.json({ availability });
}
