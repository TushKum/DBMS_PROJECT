"use client";

import { useEffect, useState } from "react";
import type { InventoryNode } from "@/server/types";
import { fetchInventory } from "@/client/lib/fetchers";
import { Drawer } from "./Drawer";
import { useUI } from "@/client/lib/UIContext";

export function InventoryDrawer() {
  const { drawer, closeAll, openProduct } = useUI();
  const open = drawer === "inventory";
  const [nodes, setNodes] = useState<InventoryNode[] | null>(null);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNodes(null);
    setError(null);
    fetchInventory({ low_stock: filter === "low" })
      .then((d) => setNodes(d.nodes))
      .catch((e) => setError(e.message));
  }, [open, filter]);

  return (
    <Drawer
      open={open}
      onClose={closeAll}
      title="Inventory"
      subtitle={`${nodes?.length ?? "…"} variants tracked across all platforms`}
    >
      <div className="mb-4 inline-flex rounded-md border border-zinc-800 p-0.5">
        {(["all", "low"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-widest transition ${
              filter === k
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {k === "all" ? "All" : "Low Stock"}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-400">Error: {error}</div>}
      {!nodes && !error && (
        <div className="text-sm text-zinc-500">Loading…</div>
      )}

      {nodes && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-widest text-zinc-500">
              <th className="pb-2 pr-2">Platform</th>
              <th className="pb-2 pr-2">Variant</th>
              <th className="pb-2 pr-2 text-right">Qty</th>
              <th className="pb-2 pr-2 text-right">Price</th>
              <th className="pb-2 pl-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr
                key={n.id}
                onClick={() => openProduct(n.product_id)}
                className="cursor-pointer border-b border-zinc-900/60 transition hover:bg-zinc-900/40"
              >
                <td className="py-2.5 pr-2 text-zinc-300">
                  {(n as InventoryNode & { platform_name?: string }).platform_name ??
                    `#${n.platform_id}`}
                </td>
                <td className="py-2.5 pr-2 text-zinc-400">
                  <span className="font-mono text-[11px]">
                    {n.size} · {n.color}
                  </span>
                </td>
                <td
                  className={`py-2.5 pr-2 text-right tabular-nums ${
                    n.current_quantity === 0
                      ? "text-red-400"
                      : n.is_low_stock
                        ? "text-orange-300"
                        : "text-zinc-100"
                  }`}
                >
                  {n.current_quantity}
                </td>
                <td className="py-2.5 pr-2 text-right tabular-nums text-zinc-300">
                  {n.platform_price ? `₹${n.platform_price}` : "—"}
                </td>
                <td className="py-2.5 pl-2 text-right">
                  {n.current_quantity === 0 ? (
                    <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-300">
                      Out
                    </span>
                  ) : n.is_low_stock ? (
                    <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-300">
                      Low
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Drawer>
  );
}
