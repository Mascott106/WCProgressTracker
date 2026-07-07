"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CupMode } from "@/contexts/CupModeContext";

const STORAGE_KEYS: Record<"cup-match" | "cup-time", string> = {
  "cup-match": "wc-cup-fireworks-match",
  "cup-time": "wc-cup-fireworks-time",
};

export function useCupFullFireworks(
  mode: Extract<CupMode, "cup-match" | "cup-time">,
  displayPercent: number,
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);
  const prevPercentRef = useRef<number>(0);
  const dedupedRef = useRef(false);

  useEffect(() => {
    const prev = prevPercentRef.current;
    prevPercentRef.current = displayPercent;

    if (displayPercent < 99.5) {
      dedupedRef.current = false;
      try {
        sessionStorage.removeItem(STORAGE_KEYS[mode]);
      } catch {
        /* ignore */
      }
      return;
    }

    if (prev < 99.5 && displayPercent >= 99.5) {
      try {
        if (sessionStorage.getItem(STORAGE_KEYS[mode]) === "1") return;
        sessionStorage.setItem(STORAGE_KEYS[mode], "1");
      } catch {
        /* ignore */
      }
      if (!dedupedRef.current) {
        dedupedRef.current = true;
        setShow(true);
      }
    }
  }, [mode, displayPercent]);

  const dismiss = useCallback(() => setShow(false), []);

  return { show, dismiss };
}
