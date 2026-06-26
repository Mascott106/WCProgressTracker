import { applyGroupPlaceholders } from "./group-standings";
import { buildBracket } from "./bracket";
import { applyScoreLocks } from "./locked-scores";
import { applyManualScores } from "./manual-scores";
import { applyScheduleStatuses } from "./match-status";
import { buildKnockoutSchedule } from "./knockout-schedule";
import { getScheduleDayWindow } from "./schedule-day";
import {
  isFinished,
  isLive,
  MATCH_DURATION_MINUTES,
  MatchSummary,
  ProgressData,
  TOTAL_GAMES,
} from "./types";
import { FINAL_SCORE_LOCK_DELAY_MS } from "./api-limits";

const MATCH_DURATION_MS = MATCH_DURATION_MINUTES * 60 * 1000;

export function tournamentBounds(summaries: MatchSummary[]) {
  const kickoffs = summaries.map((m) => new Date(m.date).getTime());
  const start = Math.min(...kickoffs);
  const end = Math.max(...kickoffs) + MATCH_DURATION_MS;
  return { start, end };
}

function getTimeProgressPercent(now: number, start: number, end: number): number {
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

/** When the next status transition is expected (kickoff or end of live window). */
export function msUntilNextStatusChange(
  summaries: MatchSummary[],
  now: number,
): number {
  let next = Infinity;

  for (const match of summaries) {
    const kickoff = new Date(match.date).getTime();
    const end = kickoff + MATCH_DURATION_MS;

    if (isFinished(match.status)) {
      const lockAt = kickoff + MATCH_DURATION_MS + FINAL_SCORE_LOCK_DELAY_MS;
      if (now < lockAt) {
        next = Math.min(next, lockAt - now);
      }
      continue;
    }

    if (now < kickoff) next = Math.min(next, kickoff - now);
    else if (isLive(match.status) || now < end) next = Math.min(next, end - now);
  }

  return Number.isFinite(next) ? next : 60 * 60 * 1000;
}

function getScheduledMatchesForWindow(
  summaries: MatchSummary[],
  window: { start: number; end: number },
  notBefore?: number,
): MatchSummary[] {
  const earliest = notBefore ?? window.start;
  return summaries
    .filter((m) => {
      if (m.status !== "NS") return false;
      const kickoff = new Date(m.date).getTime();
      return kickoff >= earliest && kickoff < window.end;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

export function buildProgressData(
  summaries: MatchSummary[],
  now = Date.now(),
): ProgressData {
  const resolved = applyManualScores(
    applyGroupPlaceholders(
      applyScoreLocks(applyScheduleStatuses(summaries, now), now),
    ),
  );
  const completed = resolved.filter((m) => isFinished(m.status));
  const live = resolved.filter((m) => isLive(m.status));

  const completedSorted = [...completed].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const upcomingDays = [0, 1, 2].map((offset) => {
    const window = getScheduleDayWindow(now, offset);
    return {
      dateIso: window.dateIso,
      matches: getScheduledMatchesForWindow(
        resolved,
        window,
        offset === 0 ? now : undefined,
      ),
      isToday: offset === 0,
      isTomorrow: offset === 1,
    };
  });

  const { start, end } = tournamentBounds(resolved);
  const ttlMs = msUntilNextStatusChange(resolved, now);
  const completedCount = completed.length;

  return {
    totalGames: TOTAL_GAMES,
    completedGames: completedCount,
    liveGames: live.length,
    remainingGames: TOTAL_GAMES - completedCount,
    progressPercent: Math.round((completedCount / TOTAL_GAMES) * 1000) / 10,
    timeProgress: {
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      percent: getTimeProgressPercent(now, start, end),
    },
    lastCompleted: completedSorted.slice(0, 2),
    liveMatches: live,
    upcomingDays,
    bracket: buildBracket(resolved, now),
    knockoutSchedule: buildKnockoutSchedule(resolved, now),
    nextStatusChangeAt: new Date(now + ttlMs).toISOString(),
  };
}
