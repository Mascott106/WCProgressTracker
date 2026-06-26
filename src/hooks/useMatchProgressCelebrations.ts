"use client";

import { useEffect, useRef } from "react";
import { shouldPlayMatchCompleteSound } from "@/lib/match-celebrations";
import { playLevelUpSound } from "@/lib/play-levelup";
import type { ProgressData } from "@/lib/types";

export function useMatchProgressCelebrations(
  data: ProgressData | null,
  nerdMode: boolean,
): void {
  const snapshotRef = useRef<{
    liveMatchIds: number[];
    nerdMode: boolean;
  } | null>(null);

  useEffect(() => {
    if (!data) return;

    const prev = snapshotRef.current;

    if (shouldPlayMatchCompleteSound(prev, data, nerdMode)) {
      playLevelUpSound();
    }

    snapshotRef.current = {
      liveMatchIds: data.liveMatches.map((m) => m.id),
      nerdMode,
    };
  }, [data, nerdMode]);
}
