"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          >
            <header className="sticky top-0 flex items-start justify-between border-b border-zinc-900 bg-zinc-950/95 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-50">{title}</h2>
                {subtitle && (
                  <p className="mt-0.5 text-xs uppercase tracking-widest text-zinc-500">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
