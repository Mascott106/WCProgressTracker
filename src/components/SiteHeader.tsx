"use client";

import { useNerdMode } from "@/contexts/NerdModeContext";
import { label } from "@/lib/nerd-mode-labels";

export function SiteHeader() {
  const { nerdMode } = useNerdMode();

  return (
    <header className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
          FIFA World Cup 2026
        </p>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {label("pageTitle", nerdMode)}
        </h1>
      </div>

      <p className="text-xs text-muted/70 sm:text-right">
        104 matches · June 11 – July 19
      </p>
    </header>
  );
}
