"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressData } from "@/lib/types";

const STORAGE_KEY = "wc-tournament-fireworks-shown";

export function useTournamentFireworks(
  data: ProgressData | null,
  previewFireworks: boolean,
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);
  const prevCompleteRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (previewFireworks) {
      setShow(true);
      return;
    }

    if (!data) return;

    const complete = data.tournamentComplete;
    const prev = prevCompleteRef.current;
    prevCompleteRef.current = complete;

    if (prev === null) return;

    if (!prev && complete) {
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setShow(true);
    }
  }, [data, previewFireworks]);

  const dismiss = useCallback(() => setShow(false), []);

  return { show, dismiss };
}
