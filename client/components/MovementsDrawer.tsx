"use client";

import { useEffect, useState } from "react";
import { Drawer } from "./Drawer";
import { fetchMovements } from "@/client/lib/fetchers";
import { useUI } from "@/client/lib/UIContext";

type Row = Awaited<ReturnType<typeof fetchMovements>>["movements"][number];

const ACTION_STYLES: Record<string, string> = {
  SALE: "bg-blue-500/15 text-blue-300",
  RESTOCK: "bg-emerald-500/15 text-emerald-300",
  RETURN: "bg-purple-500/15 text-purple-300",
  TRANSFER: "bg-yellow-500/15 text-yellow-300",
  ADJUSTMENT: "bg-zinc-700/40 text-zinc-300",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function MovementsDrawer() {
  const { drawer, closeAll, openProduct } = useUI();
  const open = drawer === "movements";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    setError(null);
    fetchMovements()
      .then((d) => setRows(d.movements))
      .catch((e) => setError(e.message));
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={closeAll}
      title="Activity"
      subtitle="Recent stock-change events across all platforms"
    >
      {error && <div className="text-sm text-red-400">Error: {error}</div>}
      {!rows && !error && <div className="text-sm text-zinc-500">Loading…</div>}

      {rows && (
        <ul className="flex flex-col gap-2">
          {rows.map((m) => (
            <li
              key={m.id}
              onClick={() => openProduct(m.product_id)}
              className="cursor-pointer rounded-md border border-zinc-900 bg-zinc-900/40 p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      ACTION_STYLES[m.action_type] ?? "bg-zinc-700/30 text-zinc-300"
                    }`}
                  >
                    {m.action_type}
                  </span>
                  <span className="truncate text-sm font-semibold text-zinc-100">
                    {m.product_name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {m.sku}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-zinc-500">
                  {timeAgo(m.created_at)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
                <span>
                  {m.action_type === "SALE" && "Removed"}
                  {m.action_type === "RESTOCK" && "Added"}
                  {m.action_type === "TRANSFER" && "Moved"}
                  {!["SALE", "RESTOCK", "TRANSFER"].includes(m.action_type) && "Adjusted"}{" "}
                  <span className="font-bold text-zinc-100">{m.quantity}</span> units
                </span>
                {m.user_name && <span className="italic">by {m.user_name}</span>}
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="text-sm text-zinc-500">No movements recorded yet.</li>
          )}
        </ul>
      )}
    </Drawer>
  );
}
