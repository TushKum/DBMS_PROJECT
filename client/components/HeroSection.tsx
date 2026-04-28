"use client";

import { motion } from "framer-motion";
import type { Product } from "@/server/types";
import { useUI } from "@/client/lib/UIContext";

export function HeroSection({ product }: { product: Product | null }) {
  const { openProduct, openDrawer } = useUI();

  return (
    <section className="relative -mx-6 mb-10 h-[68vh] min-h-[420px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
        {product?.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.poster_url}
            alt={product.name}
            className="h-full w-full object-cover opacity-40"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-full max-w-[1600px] items-end px-6 pb-20"
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />
            Hyped Drop
          </span>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">
            {product?.name ?? "STOCK.FLIX"}
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-300 md:text-lg">
            {product?.description ??
              "Live stock + price across Myntra, Flipkart, Ajio, The Souled Store, Bewakoof and Everdeon."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => product && openProduct(product.id)}
              disabled={!product}
              className="rounded-md bg-zinc-100 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-40"
            >
              View Stock
            </button>
            <button
              onClick={() => openDrawer("movements")}
              className="rounded-md border border-zinc-600/60 bg-zinc-800/60 px-6 py-3 text-sm font-bold text-zinc-100 backdrop-blur transition hover:border-zinc-400 hover:bg-zinc-800"
            >
              Activity Log
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
