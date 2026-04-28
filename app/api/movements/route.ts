import { NextRequest, NextResponse } from "next/server";
import { pool, query, withTransaction } from "@/server/db";
import type { Movement, ActionType } from "@/server/types";

export const dynamic = "force-dynamic";

const ACTION_TYPES: ActionType[] = [
  "SALE",
  "RESTOCK",
  "RETURN",
  "TRANSFER",
  "ADJUSTMENT",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const productId = searchParams.get("product_id");

  const movements = await query<Movement>(
    `SELECT m.*, p.sku, p.name AS product_name, u.name AS user_name
     FROM movements m
     JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.user_id
     ${productId ? "WHERE m.product_id = ?" : ""}
     ORDER BY m.created_at DESC
     LIMIT ?`,
    productId ? [Number(productId), limit] : [limit],
  );
  return NextResponse.json({ movements });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    action_type?: ActionType;
    inventory_node_id?: number;
    source_node_id?: number;
    dest_node_id?: number;
    product_id?: number;
    quantity?: number;
    user_id?: number | null;
    notes?: string | null;
  };

  if (!body.action_type || !ACTION_TYPES.includes(body.action_type)) {
    return NextResponse.json(
      { error: "INVALID_ACTION_TYPE", allowed: ACTION_TYPES },
      { status: 400 },
    );
  }
  if (!body.quantity || body.quantity <= 0) {
    return NextResponse.json({ error: "INVALID_QUANTITY" }, { status: 400 });
  }

  const userIdHeader = req.headers.get("x-staff-id");
  const userId = body.user_id ?? (userIdHeader ? Number(userIdHeader) : null);

  // SALE / RESTOCK funnel through stored procedures for atomic row-locked updates
  if (body.action_type === "SALE" || body.action_type === "RESTOCK") {
    const nodeId = body.inventory_node_id ?? body.source_node_id ?? body.dest_node_id;
    if (!nodeId) {
      return NextResponse.json({ error: "MISSING_INVENTORY_NODE_ID" }, { status: 400 });
    }
    const proc = body.action_type === "SALE" ? "sp_record_sale" : "sp_record_restock";
    try {
      const conn = await pool.getConnection();
      try {
        await conn.query(`CALL ${proc}(?, ?, ?, @movement_id)`, [
          nodeId,
          body.quantity,
          userId,
        ]);
        const [rows] = await conn.query("SELECT @movement_id AS id");
        const movementId = (rows as { id: number }[])[0]?.id;
        return NextResponse.json({ id: movementId, action_type: body.action_type }, { status: 201 });
      } finally {
        conn.release();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "DB_ERROR";
      if (message.includes("INSUFFICIENT_STOCK")) {
        return NextResponse.json({ error: "INSUFFICIENT_STOCK" }, { status: 409 });
      }
      if (message.includes("NODE_NOT_FOUND")) {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // TRANSFER: deduct from source, add to dest, log one movement — all in one tx
  if (body.action_type === "TRANSFER") {
    if (!body.source_node_id || !body.dest_node_id) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", required: ["source_node_id", "dest_node_id"] },
        { status: 400 },
      );
    }
    try {
      const movementId = await withTransaction(async (conn) => {
        const [srcRows] = await conn.query(
          "SELECT product_id, current_quantity FROM inventory_nodes WHERE id = ? FOR UPDATE",
          [body.source_node_id],
        );
        const src = (srcRows as { product_id: number; current_quantity: number }[])[0];
        if (!src) throw new Error("SOURCE_NOT_FOUND");
        if (src.current_quantity < body.quantity!) throw new Error("INSUFFICIENT_STOCK");

        await conn.query("SELECT id FROM inventory_nodes WHERE id = ? FOR UPDATE", [
          body.dest_node_id,
        ]);

        await conn.query(
          "UPDATE inventory_nodes SET current_quantity = current_quantity - ? WHERE id = ?",
          [body.quantity, body.source_node_id],
        );
        await conn.query(
          "UPDATE inventory_nodes SET current_quantity = current_quantity + ? WHERE id = ?",
          [body.quantity, body.dest_node_id],
        );
        const [ins] = await conn.query(
          `INSERT INTO movements
             (product_id, source_node_id, dest_node_id, quantity, action_type, user_id, notes)
           VALUES (?, ?, ?, ?, 'TRANSFER', ?, ?)`,
          [
            src.product_id,
            body.source_node_id,
            body.dest_node_id,
            body.quantity,
            userId,
            body.notes ?? null,
          ],
        );
        return (ins as { insertId: number }).insertId;
      });
      return NextResponse.json({ id: movementId, action_type: "TRANSFER" }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "DB_ERROR";
      const status = message === "INSUFFICIENT_STOCK" ? 409 : message.endsWith("_NOT_FOUND") ? 404 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  // RETURN / ADJUSTMENT: simple log + qty adjust
  return NextResponse.json({ error: "UNSUPPORTED_ACTION" }, { status: 400 });
}
