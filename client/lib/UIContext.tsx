"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DrawerName = "inventory" | "movements" | "suppliers" | null;

type UIContextValue = {
  drawer: DrawerName;
  openDrawer: (name: DrawerName) => void;
  closeAll: () => void;
  productId: number | null;
  openProduct: (id: number | null) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerName>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const value: UIContextValue = {
    drawer,
    openDrawer: (name) => {
      setDrawer(name);
      setProductId(null);
    },
    closeAll: () => {
      setDrawer(null);
      setProductId(null);
      setSearchOpen(false);
    },
    productId,
    openProduct: (id) => {
      setProductId(id);
      setDrawer(null);
    },
    searchOpen,
    setSearchOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
