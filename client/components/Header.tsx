"use client";

import { useUI } from "@/client/lib/UIContext";
import { SearchPopover } from "./SearchPopover";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", action: "close" as const },
  { key: "inventory", label: "Inventory", action: "drawer" as const },
  { key: "movements", label: "Activity", action: "drawer" as const },
  { key: "suppliers", label: "Suppliers", action: "drawer" as const },
];

export function Header() {
  const { drawer, openDrawer, closeAll, searchOpen, setSearchOpen } = useUI();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur">
      <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <button
            onClick={closeAll}
            className="text-xl font-black tracking-tight text-yellow-400"
          >
            STOCK<span className="text-zinc-100">.FLIX</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                (item.action === "close" && drawer === null) ||
                (item.action === "drawer" && drawer === item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.action === "close") closeAll();
                    else
                      openDrawer(
                        item.key as Exclude<
                          ReturnType<typeof useUI>["drawer"],
                          null
                        >,
                      );
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
            aria-label="Search"
          >
            <span>⌕</span>
            <span className="hidden md:inline">Search</span>
            <span className="ml-2 hidden rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 md:inline">
              /
            </span>
          </button>
          <span className="hidden text-xs uppercase tracking-widest text-zinc-500 lg:inline">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
            Live
          </span>
          <SearchPopover />
        </div>
      </div>
    </header>
  );
}
