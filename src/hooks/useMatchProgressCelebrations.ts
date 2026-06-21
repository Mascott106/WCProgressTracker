"use client";

import { useEffect, useRef } from "react";
import { percentToLevelProgress } from "@/lib/exp-levels";
import { playLevelUpSound } from "@/lib/play-levelup";
import type { ProgressData } from "@/lib/types";

export function useMatchProgressCelebrations(
  data: ProgressData | null,
  nerdMode: boolean,
): void {
  const snapshotRef = useRef<{
    completed: number;
    matchLevel: number;
    nerdMode: boolean;
  } | null>(null);

  useEffect(() => {
    if (!data) return;

    const matchLevel = nerdMode
      ? percentToLevelProgress(data.progressPercent).level
      : 0;
    const prev = snapshotRef.current;

    if (prev && prev.nerdMode === nerdMode) {
      const gameCompleted = data.completedGames > prev.completed;
      const leveledUp = nerdMode && matchLevel > prev.matchLevel;

      if (gameCompleted || leveledUp) {
        playLevelUpSound();
      }
    }

    snapshotRef.current = {
      completed: data.completedGames,
      matchLevel,
      nerdMode,
    };
  }, [data, nerdMode]);
}
