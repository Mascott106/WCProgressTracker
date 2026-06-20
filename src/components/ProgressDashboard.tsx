"use client";

import { useCallback, useEffect, useState } from "react";
import { MatchPanel } from "@/components/MatchPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { TimeProgressBar } from "@/components/TimeProgressBar";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutRoundTimeline } from "@/components/KnockoutRoundTimeline";
import { UpcomingSchedule } from "@/components/UpcomingSchedule";
import { getProgress } from "@/lib/world-cup";
import type { ProgressData } from "@/lib/types";

export function ProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setData(getProgress());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!data?.nextStatusChangeAt) return;

    const ms = new Date(data.nextStatusChangeAt).getTime() - Date.now();
    if (ms <= 0) {
      refresh();
      return;
    }

    const timer = setTimeout(refresh, ms + 500);
    return () => clearTimeout(timer);
  }, [data?.nextStatusChangeAt, refresh]);

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ProgressBar
        percent={data.progressPercent}
        completed={data.completedGames}
        live={data.liveGames}
        remaining={data.remainingGames}
        total={data.totalGames}
      />

      <TimeProgressBar
        startAt={data.timeProgress.startAt}
        endAt={data.timeProgress.endAt}
        initialPercent={data.timeProgress.percent}
      />

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <MatchPanel
          title="Live Now"
          matches={data.liveMatches.slice(0, 3)}
          variant="live"
          emptyText="No live matches"
        />
        <MatchPanel
          title="Last Completed"
          matches={data.lastCompleted ? [data.lastCompleted] : []}
          variant="default"
          emptyText="No results yet"
        />
      </div>

      {data.bracket.active ? (
        <KnockoutBracket bracket={data.bracket} />
      ) : (
        <UpcomingSchedule days={data.upcomingDays} />
      )}

      <KnockoutRoundTimeline schedule={data.knockoutSchedule} />
    </div>
  );
}
