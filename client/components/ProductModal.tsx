"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProduct } from "@/client/lib/fetchers";
import { useUI } from "@/client/lib/UIContext";
import type { AvailabilityEntry, Product } from "@/server/types";

type FullProduct = Product & { availability: AvailabilityEntry[] };

function groupByPlatform(av: AvailabilityEntry[]) {
  const map = new Map<string, AvailabilityEntry[]>();
  for (const a of av) {
    const list = map.get(a.platform_slug) ?? [];
    list.push(a);
    map.set(a.platform_slug, list);
  }
  return Array.from(map.entries()).map(([slug, entries]) => ({ slug, entries }));
}

export function ProductModal() {
  const { productId, openProduct } = useUI();
  const open = productId != null;
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId == null) {
      setProduct(null);
      return;
    }
    setProduct(null);
    setError(null);
    fetchProduct(productId)
      .then((d) => setProduct(d.product as FullProduct))
      .catch((e) => setError(e.message));
  }, [productId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openProduct(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, openProduct]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => openProduct(null)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,920px)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[0_0_120px_rgba(0,0,0,0.9)]"
          >
            <button
              onClick={() => openProduct(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-md border border-zinc-700/60 bg-zinc-900/80 px-2.5 py-1 text-sm text-zinc-300 backdrop-blur hover:border-zinc-500 hover:text-zinc-50"
            >
              ✕
            </button>

            <div className="flex max-h-[88vh] flex-col overflow-hidden md:flex-row">
              {error && (
                <div className="flex-1 p-8 text-sm text-red-400">Error: {error}</div>
              )}
              {!product && !error && (
                <div className="flex-1 p-8 text-sm text-zinc-500">Loading product…</div>
              )}
              {product && (
                <>
                  <div className="relative w-full md:w-2/5 bg-zinc-900">
                    {product.poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.poster_url}
                        alt={product.name}
                        className="h-72 w-full object-cover md:h-full"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center text-3xl font-black text-zinc-700 md:h-full">
                        {product.sku}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-yellow-300">
                      {product.brand}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-50 md:text-3xl">
                      {product.name}
                    </h2>
                    <div className="mt-1 text-xs text-zinc-500">
                      <span className="font-mono">{product.sku}</span>
                    </div>
                    {product.description && (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                        {product.description}
                      </p>
                    )}

                    <h3 className="mt-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Available on {groupByPlatform(product.availability).length} platforms
                    </h3>
                    <div className="mt-3 flex flex-col gap-2">
                      {groupByPlatform(product.availability).map(({ slug, entries }) => (
                        <PlatformRow key={slug} entries={entries} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PlatformRow({ entries }: { entries: AvailabilityEntry[] }) {
  const platform = entries[0];
  const inStockEntries = entries.filter((e) => e.in_stock);
  const totalQty = inStockEntries.reduce((s, e) => s + e.qty, 0);
  const minPrice = inStockEntries.length
    ? Math.min(...inStockEntries.map((e) => e.price || Infinity))
    : null;
  const url = entries.find((e) => e.in_stock)?.url ?? entries[0].url;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: totalQty > 0 ? (platform.brand_color ?? "#22c55e") : "#52525b",
            }}
          />
          <span className="font-semibold text-zinc-100">{platform.platform_name}</span>
          <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
            {platform.kind === "BRAND_DTC" ? "DTC" : "Marketplace"}
          </span>
        </div>
        {totalQty > 0 ? (
          <a
            href={url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            View · ₹{minPrice}
          </a>
        ) : (
          <span className="text-xs font-bold uppercase tracking-widest text-red-400">
            Sold Out
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {entries.map((e, i) => (
          <div
            key={`${e.size}-${e.color}-${i}`}
            className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
              e.in_stock
                ? "border-zinc-800 bg-zinc-950 text-zinc-300"
                : "border-zinc-900 bg-zinc-950/40 text-zinc-600 line-through"
            }`}
          >
            <span className="font-mono">
              {e.size} · {e.color}
            </span>
            <span className="tabular-nums">{e.in_stock ? e.qty : 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
