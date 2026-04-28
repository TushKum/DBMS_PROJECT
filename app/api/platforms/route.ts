import { NextResponse } from "next/server";
import { getPlatforms } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const platforms = await getPlatforms();
  return NextResponse.json({ platforms });
}
