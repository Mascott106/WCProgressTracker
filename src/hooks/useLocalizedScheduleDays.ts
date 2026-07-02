"use client";

import { useMemo } from "react";
import { getViewerTimeZone } from "@/lib/format-datetime";
import { buildLocalizedScheduleDays } from "@/lib/localized-schedule";
import type { MatchSummary, ScheduleDay } from "@/lib/types";

export function useLocalizedScheduleDays(
  upcomingMatches: MatchSummary[] | undefined,
  fallbackDays: ScheduleDay[],
): ScheduleDay[] {
  const timeZone = useMemo(() => getViewerTimeZone(), []);

  return useMemo(() => {
    if (upcomingMatches === undefined) {
      return fallbackDays;
    }
    return buildLocalizedScheduleDays(upcomingMatches, Date.now(), timeZone);
  }, [upcomingMatches, fallbackDays, timeZone]);
}