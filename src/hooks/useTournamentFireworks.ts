"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressData } from "@/lib/types";

const STORAGE_KEY = "wc-tournament-fireworks-shown";

export function useTournamentFireworks(
  data: ProgressData | null,
  previewFireworks: boolean,
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (previewFireworks) {
      setShow(true);
      return;
    }

    if (!data?.tournamentComplete) return;
    if (shownRef.current) return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        shownRef.current = true;
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    shownRef.current = true;
    setShow(true);
  }, [data, previewFireworks]);

  const dismiss = useCallback(() => setShow(false), []);

  return { show, dismiss };
}
