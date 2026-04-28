import { NextResponse } from "next/server";
import { getDashboardRows } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getDashboardRows();
  return NextResponse.json(rows);
}
