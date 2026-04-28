import { NextResponse } from "next/server";
import { getSuppliers } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const suppliers = await getSuppliers();
  return NextResponse.json({ suppliers });
}
