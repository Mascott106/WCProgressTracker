"use client";

import { useCallback, useEffect, useState } from "react";

export function useTournamentThankYou(tournamentComplete: boolean): {
  show: boolean;
  dismiss: () => void;
} {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(tournamentComplete);
  }, [tournamentComplete]);

  const dismiss = useCallback(() => {
    setShow(false);
  }, []);

  return { show, dismiss };
}
