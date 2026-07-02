"use client";

import { useMemo } from "react";
import { buildLocalizedScheduleDays } from "@/lib/localized-schedule";
import type { MatchSummary, ScheduleDay } from "@/lib/types";
import { useViewerTimeZone } from "@/hooks/useViewerTimeZone";

export function useLocalizedScheduleDays(
  upcomingMatches: MatchSummary[] | undefined,
  fallbackDays: ScheduleDay[],
  generatedAt: string | undefined,
): ScheduleDay[] {
  const timeZone = useViewerTimeZone();

  return useMemo(() => {
    if (upcomingMatches === undefined || generatedAt === undefined) {
      return fallbackDays;
    }
    const now = new Date(generatedAt).getTime();
    if (Number.isNaN(now)) {
      return fallbackDays;
    }
    return buildLocalizedScheduleDays(upcomingMatches, now, timeZone);
  }, [upcomingMatches, fallbackDays, generatedAt, timeZone]);
}
