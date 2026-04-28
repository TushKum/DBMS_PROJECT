"use client";

import { useEffect, useState } from "react";
import { Drawer } from "./Drawer";
import { fetchSuppliers } from "@/client/lib/fetchers";
import { useUI } from "@/client/lib/UIContext";

type Supplier = Awaited<ReturnType<typeof fetchSuppliers>>["suppliers"][number];

export function SuppliersDrawer() {
  const { drawer, closeAll } = useUI();
  const open = drawer === "suppliers";
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSuppliers(null);
    setError(null);
    fetchSuppliers()
      .then((d) => setSuppliers(d.suppliers))
      .catch((e) => setError(e.message));
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={closeAll}
      title="Suppliers"
      subtitle={`${suppliers?.length ?? "…"} brand partners`}
    >
      {error && <div className="text-sm text-red-400">Error: {error}</div>}
      {!suppliers && !error && (
        <div className="text-sm text-zinc-500">Loading…</div>
      )}

      {suppliers && (
        <ul className="flex flex-col gap-3">
          {suppliers.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-zinc-900 bg-zinc-900/40 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-50">{s.name}</h3>
                  {s.contact_email && (
                    <a
                      href={`mailto:${s.contact_email}`}
                      className="mt-0.5 inline-block text-xs text-zinc-400 underline-offset-2 hover:text-zinc-100 hover:underline"
                    >
                      {s.contact_email}
                    </a>
                  )}
                </div>
                <ReliabilityRing score={Number(s.reliability_score)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Lead Time
                  </div>
                  <div className="mt-0.5 text-base font-bold text-zinc-100 tabular-nums">
                    {s.lead_time_days}
                    <span className="ml-1 text-xs font-normal text-zinc-400">days</span>
                  </div>
                </div>
                <div className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Products Supplied
                  </div>
                  <div className="mt-0.5 text-base font-bold text-zinc-100 tabular-nums">
                    {s.products_supplied}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function ReliabilityRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  const color =
    pct >= 92 ? "text-emerald-400" : pct >= 85 ? "text-yellow-400" : "text-orange-400";
  return (
    <div className={`flex flex-col items-end ${color}`}>
      <span className="text-2xl font-black tabular-nums leading-none">
        {pct.toFixed(0)}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">
        reliability
      </span>
    </div>
  );
}
