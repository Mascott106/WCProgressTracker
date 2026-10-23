"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wc-tournament-thank-you-dismissed";

export function useTournamentThankYou(tournamentComplete: boolean): {
  show: boolean;
  dismiss: () => void;
} {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!tournamentComplete) {
      setShow(false);
      return;
    }

    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setShow(false);
        return;
      }
    } catch {
      /* private browsing — still show once this mount */
    }

    setShow(true);
  }, [tournamentComplete]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }, []);

  return { show, dismiss };
}
