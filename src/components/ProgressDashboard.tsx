"use client";

import { FormattedDate } from "@/components/FormattedDate";
import { formatDateTime } from "@/lib/format-datetime";
import { MatchPanel } from "@/components/MatchPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { TimeProgressBar } from "@/components/TimeProgressBar";
import { TournamentFireworks } from "@/components/TournamentFireworks";
import { TournamentThankYou } from "@/components/TournamentThankYou";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutRoundTimeline } from "@/components/KnockoutRoundTimeline";
import { UpcomingSchedule } from "@/components/UpcomingSchedule";
import { useFinalePreview } from "@/contexts/FinalePreviewContext";
import { useMatchProgressCelebrations } from "@/hooks/useMatchProgressCelebrations";
import { useProgressData } from "@/hooks/useProgressData";
import { useTournamentFireworks } from "@/hooks/useTournamentFireworks";
import { useTournamentThankYou } from "@/hooks/useTournamentThankYou";
import { useTranslation } from "@/contexts/LocaleContext";
import { useNerdMode } from "@/contexts/NerdModeContext";

export function ProgressDashboard() {
  const { nerdMode } = useNerdMode();
  const { t } = useTranslation();
  const { previewPhase } = useFinalePreview();
  const { data, meta, loading, error, refresh, setLoading } = useProgressData();
  const previewFireworks = previewPhase === "complete";
  const { show: showFireworks, dismiss: dismissFireworks } =
    useTournamentFireworks(data, previewFireworks);
  const { show: showThankYou, dismiss: dismissThankYou } =
    useTournamentThankYou(!!data?.tournamentComplete);

  useMatchProgressCelebrations(data, nerdMode);

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
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <TournamentThankYou show={showThankYou} onClose={dismissThankYou} />
      <TournamentFireworks show={showFireworks} onDone={dismissFireworks} />

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
        finalMatchStatus={data.finalMatchStatus}
        nerdMode={nerdMode}
        previewActive={previewPhase !== "off"}
      />

      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <MatchPanel
          title={t("panels.live", { nerd: nerdMode })}
          matches={data.liveMatches.slice(0, 3)}
          variant="live"
          emptyText={t("panels.emptyLive", { nerd: nerdMode })}
        />
        <MatchPanel
          title={t("panels.last", { nerd: nerdMode })}
          matches={data.lastCompleted}
          variant="default"
          highlightWinner
          emptyText={t("panels.emptyLast", { nerd: nerdMode })}
        />
      </div>

      {(data.upcomingDays.some((day) => day.matches.length > 0) ||
        (data.upcomingMatches ?? []).length > 0) && (
        <UpcomingSchedule
          days={data.upcomingDays}
          upcomingMatches={data.upcomingMatches}
          generatedAt={data.generatedAt}
          nerdMode={nerdMode}
        />
      )}

      {data.bracket.active && <KnockoutBracket bracket={data.bracket} />}

      <KnockoutRoundTimeline schedule={data.knockoutSchedule} />

      {meta && (
        <footer
          className={`flex shrink-0 flex-col gap-2 text-[10px] text-muted/40 sm:flex-row sm:items-center ${
            meta.source === "archive"
              ? "items-center justify-center text-center"
              : "items-start sm:justify-between"
          }`}
        >
          <span className="capitalize">
            {t("footer.source", {
              vars: { source: meta.source.replace("-", " ") },
            })}
            {meta.matchedFixtures > 0 &&
              t("footer.fixturesMatched", {
                vars: {
                  matched: meta.matchedFixtures,
                  total: meta.totalFixtures,
                },
              })}
          </span>
          {meta.source !== "archive" && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {meta.apiRequestsRemaining !== null &&
                meta.apiRequestsLimit !== null && (
                  <span
                    title={t("footer.apiQuotaTooltip", {
                      vars: {
                        limit: meta.apiRequestsLimit,
                        reset: meta.apiRequestResetAt
                          ? ` Counter resets at ${formatDateTime(meta.apiRequestResetAt, { timeOnly: true })}.`
                          : "",
                      },
                    })}
                  >
                    {t("footer.apiQuota", {
                      vars: {
                        remaining: meta.apiRequestsRemaining,
                        limit: meta.apiRequestsLimit,
                      },
                    })}
                    {meta.apiRequestResetAt &&
                      new Date(meta.apiRequestResetAt).getTime() >
                        Date.now() && (
                        <>
                          {t("footer.apiQuotaResets")}{" "}
                          <FormattedDate
                            iso={meta.apiRequestResetAt}
                            timeOnly
                          />
                        </>
                      )}
                  </span>
                )}
              <span title={t("footer.nextRefreshTitle")}>
                {t("footer.nextRefresh")}{" "}
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
                    ? t("footer.cacheFreshTitle")
                    : undefined
                }
                className="rounded px-2 py-1 text-accent/70 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("footer.refresh", { nerd: nerdMode })}
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
