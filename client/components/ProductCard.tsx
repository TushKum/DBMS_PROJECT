"use client";

import { motion } from "framer-motion";
import type { AvailabilityEntry, Product } from "@/server/types";
import { useUI } from "@/client/lib/UIContext";

const CARD_VARIANTS = {
  rest: { scale: 1, y: 0, zIndex: 1 },
  hover: { scale: 1.06, y: -8, zIndex: 30 },
};

function summarize(availability: AvailabilityEntry[] | undefined) {
  if (!availability?.length) {
    return { byPlatform: [] as Array<{ key: string; entries: AvailabilityEntry[] }>, anyInStock: false };
  }
  const map = new Map<string, AvailabilityEntry[]>();
  for (const a of availability) {
    const key = a.platform_slug;
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  return {
    byPlatform: Array.from(map.entries()).map(([key, entries]) => ({ key, entries })),
    anyInStock: availability.some((a) => a.in_stock),
  };
}

function PlatformBadge({ entries }: { entries: AvailabilityEntry[] }) {
  const inStock = entries.some((e) => e.in_stock);
  const minPrice = Math.min(...entries.filter((e) => e.in_stock).map((e) => e.price || Infinity));
  const platform = entries[0];
  const totalQty = entries.reduce((sum, e) => sum + (e.in_stock ? e.qty : 0), 0);

  return (
    <a
      href={entries.find((e) => e.in_stock)?.url ?? entries[0].url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
        inStock
          ? "border-zinc-700/80 bg-zinc-800/60 text-zinc-100 hover:border-zinc-500"
          : "border-zinc-900 bg-zinc-950/60 text-zinc-600"
      }`}
    >
      <span className="flex items-center gap-1.5 truncate">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: inStock
              ? (platform.brand_color ?? "#22c55e")
              : "#52525b",
          }}
        />
        <span className="truncate">{platform.platform_name}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {inStock ? (
          <>
            <span className="font-semibold text-yellow-300">
              ₹{Number.isFinite(minPrice) ? minPrice : "—"}
            </span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">{totalQty}</span>
          </>
        ) : (
          <span className="text-red-400/80">SOLD OUT</span>
        )}
      </span>
    </a>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { byPlatform, anyInStock } = summarize(product.availability);
  const lowStock = (product.total_on_hand ?? 0) > 0 && (product.total_on_hand ?? 0) < 10;
  const { openProduct } = useUI();

  return (
    <motion.div
      variants={CARD_VARIANTS}
      initial="rest"
      whileHover="hover"
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openProduct(product.id)}
      className="group relative aspect-[2/3] w-[220px] flex-shrink-0 cursor-pointer overflow-visible rounded-md bg-zinc-900 ring-1 ring-zinc-800 hover:ring-yellow-400/40"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
        {product.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.poster_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-3xl font-black text-zinc-700">
            {product.sku}
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {!anyInStock && (
            <span className="rounded-sm bg-red-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Sold Out
            </span>
          )}
          {lowStock && anyInStock && (
            <span className="rounded-sm bg-orange-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
              Low Stock
            </span>
          )}
        </div>
        {product.is_hyped && (
          <span className="absolute right-2 top-2 rounded-sm bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-950 shadow-lg">
            Hyped
          </span>
        )}
      </div>

      {/* Hover-expanded panel: brand, price summary, per-platform availability */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute left-0 right-0 top-full z-40 mt-1 origin-top rounded-md border border-zinc-800 bg-zinc-950/95 p-3 opacity-0 shadow-2xl shadow-black/60 backdrop-blur group-hover:pointer-events-auto group-hover:opacity-100"
      >
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span className="truncate">{product.brand ?? product.sku}</span>
          {product.daily_velocity != null && product.daily_velocity > 0 && (
            <span className="text-yellow-300">
              {product.daily_velocity}/day
            </span>
          )}
        </div>
        <h3 className="mt-1 truncate text-sm font-bold text-zinc-50">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
          <span>
            {product.platforms_in_stock ?? 0} / {byPlatform.length} platforms
          </span>
          {product.min_price != null && (
            <>
              <span>·</span>
              <span className="text-zinc-200">
                from <span className="font-bold text-yellow-300">₹{product.min_price}</span>
              </span>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {byPlatform.length === 0 ? (
            <div className="text-[11px] italic text-zinc-600">No platform data yet</div>
          ) : (
            byPlatform.map(({ key, entries }) => (
              <PlatformBadge key={key} entries={entries} />
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
