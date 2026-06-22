"use client";

import { useCupMode } from "@/contexts/CupModeContext";
import { useNerdMode } from "@/contexts/NerdModeContext";

const hiddenBtn =
  "cursor-default border-0 bg-transparent p-0 font-inherit text-[10px] text-muted/40 disabled:cursor-default";

export function SiteFooter() {
  const { toggleNerdMode, ready } = useNerdMode();
  const { cycleCupMode } = useCupMode();

  return (
    <p className="mt-auto pt-4 text-center text-[10px] text-muted/40">
      Built by{" "}
      <button
        type="button"
        onClick={toggleNerdMode}
        disabled={!ready}
        suppressHydrationWarning
        className={hiddenBtn}
      >
        Scott Mendenko
      </button>
      <button
        type="button"
        onClick={cycleCupMode}
        className={`ml-1 ${hiddenBtn}`}
        aria-label="Fill the cup"
      >
        🏆
      </button>
    </p>
  );
}
