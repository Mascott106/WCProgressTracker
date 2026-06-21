"use client";

import { useNerdMode } from "@/contexts/NerdModeContext";
import { label } from "@/lib/nerd-mode-labels";

export function SiteHeader() {
  const { nerdMode, toggleNerdMode, ready } = useNerdMode();

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

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <p className="text-xs text-muted/70">
          {nerdMode
            ? label("pageSubtitle", true)
            : "104 matches · June 11 – July 19"}
        </p>
        <button
          type="button"
          onClick={toggleNerdMode}
          disabled={!ready}
          suppressHydrationWarning
          className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
            nerdMode
              ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
              : "border-border bg-surface text-muted/70 hover:text-foreground"
          }`}
          aria-pressed={nerdMode}
        >
          Nerd Mode: {nerdMode ? "ON" : "OFF"}
        </button>
      </div>
    </header>
  );
}
