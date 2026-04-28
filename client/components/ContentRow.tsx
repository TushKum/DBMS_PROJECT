"use client";

import { useRef } from "react";
import type { Product } from "@/server/types";
import { ProductCard } from "./ProductCard";

export function ContentRow({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  };

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs uppercase tracking-widest text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-zinc-800 text-sm text-zinc-600">
          No items in this row yet
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="row-scroll flex gap-3 overflow-x-auto pt-4 pb-72"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
