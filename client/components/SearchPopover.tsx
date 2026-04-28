"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fetchSearch } from "@/client/lib/fetchers";
import { useUI } from "@/client/lib/UIContext";
import type { Product } from "@/server/types";

export function SearchPopover() {
  const { searchOpen, setSearchOpen, openProduct } = useUI();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ("");
      setResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || q.trim().length < 1) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setLoading(true);
      fetchSearch(q.trim())
        .then((d) => setResults(d.products))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(handle);
  }, [q, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearchOpen]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-[min(560px,90vw)] rounded-lg border border-zinc-800 bg-zinc-950/95 p-2 shadow-2xl shadow-black/60 backdrop-blur"
        >
          <div className="flex items-center gap-2 border-b border-zinc-900 px-2 pb-2">
            <span className="text-zinc-500">⌕</span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKUs, brands, products…"
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            {loading && <span className="text-[10px] text-zinc-500">…</span>}
          </div>

          <div className="mt-2 max-h-[60vh] overflow-y-auto">
            {q.trim() === "" && (
              <div className="px-2 py-6 text-center text-sm text-zinc-500">
                Type to search across all platforms
              </div>
            )}
            {q.trim() !== "" && results.length === 0 && !loading && (
              <div className="px-2 py-6 text-center text-sm text-zinc-500">
                No matches for &ldquo;{q}&rdquo;
              </div>
            )}
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  openProduct(p.id);
                  setSearchOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-zinc-900"
              >
                {p.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.poster_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-zinc-900" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-100">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-mono">{p.sku}</span>
                    <span>·</span>
                    <span>{p.brand}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Open
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
