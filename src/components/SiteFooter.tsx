"use client";

import { useNerdMode } from "@/contexts/NerdModeContext";

export function SiteFooter() {
  const { toggleNerdMode, ready } = useNerdMode();

  return (
    <p className="mt-auto pt-4 text-center text-[10px] text-muted/40">
      Built by{" "}
      <button
        type="button"
        onClick={toggleNerdMode}
        disabled={!ready}
        suppressHydrationWarning
        className="cursor-default text-muted/40 disabled:cursor-default"
      >
        Scott Mendenko
      </button>
    </p>
  );
}
