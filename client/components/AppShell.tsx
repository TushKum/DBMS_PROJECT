"use client";

import { useEffect, type ReactNode } from "react";
import { UIProvider, useUI } from "@/client/lib/UIContext";
import { Header } from "./Header";
import { InventoryDrawer } from "./InventoryDrawer";
import { MovementsDrawer } from "./MovementsDrawer";
import { SuppliersDrawer } from "./SuppliersDrawer";
import { ProductModal } from "./ProductModal";

function GlobalKeybinds() {
  const { setSearchOpen, closeAll } = useUI();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        closeAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen, closeAll]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <GlobalKeybinds />
      <Header />
      <main className="mx-auto max-w-[1600px] px-6 pb-24">{children}</main>
      <InventoryDrawer />
      <MovementsDrawer />
      <SuppliersDrawer />
      <ProductModal />
    </UIProvider>
  );
}
