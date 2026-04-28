import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/server/db";
import type { ReorderSuggestion } from "@/server/types";

export const dynamic = "force-dynamic";

// Vercel Cron hits this at 04:00 daily (see vercel.ts)
// Calls the sp_calculate_reorder_suggestions stored procedure with a 14-day window
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const conn = await pool.getConnection();
  try {
    const [resultSets] = await conn.query("CALL sp_calculate_reorder_suggestions(?)", [14]);
    const rows = (Array.isArray(resultSets) ? resultSets[0] : []) as ReorderSuggestion[];
    return NextResponse.json({
      generated_at: new Date().toISOString(),
      window_days: 14,
      suggestions: rows,
    });
  } finally {
    conn.release();
  }
}
