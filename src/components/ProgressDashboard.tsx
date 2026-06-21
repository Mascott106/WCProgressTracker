"use client";

import { useCallback, useEffect, useState } from "react";
import { FormattedDate } from "@/components/FormattedDate";
import { MatchPanel } from "@/components/MatchPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { TimeProgressBar } from "@/components/TimeProgressBar";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutRoundTimeline } from "@/components/KnockoutRoundTimeline";
import { UpcomingSchedule } from "@/components/UpcomingSchedule";
import { useNerdMode } from "@/contexts/NerdModeContext";
import type { ProgressApiMeta } from "@/lib/football-data";
import { label } from "@/lib/nerd-mode-labels";
import type { ProgressData } from "@/lib/types";

export function ProgressDashboard() {
  const { nerdMode } = useNerdMode();
  const [data, setData] = useState<ProgressData | null>(null);
  const [meta, setMeta] = useState<ProgressApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (force) params.set("refresh", "true");
      if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
        params.set("mock", "true");
      }
      const query = params.toString();
      const res = await fetch(`/api/progress${query ? `?${query}` : ""}`);

      let json: { data?: ProgressData; meta?: ProgressApiMeta; error?: string };
      try {
        json = await res.json();
      } catch {
        throw new Error(
          res.status >= 500
            ? "Server error — stop the dev server, run `rm -rf .next && npm run dev`, and reload"
            : `Request failed (${res.status})`,
        );
      }

      if (!res.ok) {
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }

      if (!json.data) {
        throw new Error("Invalid response from /api/progress");
      }

      setData(json.data);
      setMeta(json.meta ?? null);
      if (json.meta?.apiError) {
        setError(json.meta.apiError);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const nextAt = meta?.cacheExpiresAt ?? data?.nextStatusChangeAt;
    if (!nextAt) return;

    const ms = new Date(nextAt).getTime() - Date.now();
    if (ms <= 0) {
      refresh();
      return;
    }

    const timer = setTimeout(() => refresh(), ms + 500);
    return () => clearTimeout(timer);
  }, [meta?.cacheExpiresAt, data?.nextStatusChangeAt, refresh]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            refresh(true);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-surface-elevated"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-3 pb-4">
      {error && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          {error}
        </div>
      )}

      <ProgressBar
        percent={data.progressPercent}
        completed={data.completedGames}
        live={data.liveGames}
        remaining={data.remainingGames}
        total={data.totalGames}
        nerdMode={nerdMode}
      />

      <TimeProgressBar
        startAt={data.timeProgress.startAt}
        endAt={data.timeProgress.endAt}
        nerdMode={nerdMode}
      />

      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <MatchPanel
          title={label("panelLive", nerdMode)}
          matches={data.liveMatches.slice(0, 3)}
          variant="live"
          emptyText={label("emptyLive", nerdMode)}
        />
        <MatchPanel
          title={label("panelLast", nerdMode)}
          matches={data.lastCompleted ? [data.lastCompleted] : []}
          variant="default"
          highlightWinner
          emptyText={label("emptyLast", nerdMode)}
        />
      </div>

      {data.upcomingDays.some((day) => day.matches.length > 0) && (
        <UpcomingSchedule days={data.upcomingDays} nerdMode={nerdMode} />
      )}

      {data.bracket.active && <KnockoutBracket bracket={data.bracket} />}

      <KnockoutRoundTimeline schedule={data.knockoutSchedule} />

      {meta && (
        <footer className="flex shrink-0 flex-col items-start gap-2 text-[10px] text-muted/40 sm:flex-row sm:items-center sm:justify-between">
          <span className="capitalize">
            Source: {meta.source.replace("-", " ")}
            {meta.matchedFixtures > 0 &&
              ` · ${meta.matchedFixtures}/${meta.totalFixtures} fixtures matched`}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {meta.apiRequestsRemaining !== null &&
              meta.apiRequestsLimit !== null && (
                <span
                  title={`football-data.org free tier: ${meta.apiRequestsLimit} requests per minute (rolling window, not a daily cap).${
                    meta.apiRequestResetAt
                      ? ` Counter resets at ${new Date(meta.apiRequestResetAt).toLocaleTimeString()}.`
                      : ""
                  }`}
                >
                  API quota: {meta.apiRequestsRemaining}/{meta.apiRequestsLimit}{" "}
                  left · per minute
                  {meta.apiRequestResetAt &&
                    new Date(meta.apiRequestResetAt).getTime() > Date.now() && (
                      <>
                        {" "}
                        · resets{" "}
                        <FormattedDate
                          iso={meta.apiRequestResetAt}
                          timeOnly
                        />
                      </>
                    )}
                </span>
              )}
            <span title="Refreshes every minute during live matches and for ~10 minutes after; otherwise at the next kickoff">
              Next refresh{" "}
              <FormattedDate iso={meta.cacheExpiresAt} timeOnly />
            </span>
            <button
              type="button"
              onClick={() => refresh(true)}
              disabled={
                !!meta.cacheExpiresAt &&
                new Date(meta.cacheExpiresAt).getTime() > Date.now()
              }
              title={
                meta.cacheExpiresAt &&
                new Date(meta.cacheExpiresAt).getTime() > Date.now()
                  ? "Cache still fresh — automatic refresh runs every minute during live play"
                  : undefined
              }
              className="rounded px-2 py-1 text-accent/70 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {label("refresh", nerdMode)}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
