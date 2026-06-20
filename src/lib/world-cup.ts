import fixturesData from "@/data/fixtures.json";
import { getBroadcast } from "./broadcast";
import { buildBracket } from "./bracket";
import { buildKnockoutSchedule } from "./knockout-schedule";
import {
  FINISHED_STATUSES,
  FixturesFile,
  isFinished,
  isLive,
  MATCH_DURATION_MINUTES,
  MatchSummary,
  ProgressData,
  StaticMatch,
  statusLabel,
  TOTAL_GAMES,
} from "./types";

const MATCH_DURATION_MS = MATCH_DURATION_MINUTES * 60 * 1000;

const allMatches = (fixturesData as FixturesFile).matches;
const TOURNAMENT_START_MS = Math.min(
  ...allMatches.map((m) => new Date(m.date).getTime()),
);
const TOURNAMENT_END_MS =
  Math.max(...allMatches.map((m) => new Date(m.date).getTime())) +
  MATCH_DURATION_MS;

function getTimeProgressPercent(now: number): number {
  if (now <= TOURNAMENT_START_MS) return 0;
  if (now >= TOURNAMENT_END_MS) return 100;
  return ((now - TOURNAMENT_START_MS) / (TOURNAMENT_END_MS - TOURNAMENT_START_MS)) * 100;
}

function resolveStatus(match: StaticMatch, now: number): string {
  if (match.status && FINISHED_STATUSES.has(match.status)) {
    return match.status;
  }

  const kickoff = new Date(match.date).getTime();
  const end = kickoff + MATCH_DURATION_MS;

  if (now < kickoff) return "NS";
  if (now < end) return "LIVE";
  return match.status ?? "FT";
}

function toSummary(match: StaticMatch, now: number): MatchSummary {
  const status = resolveStatus(match, now);
  const { foxChannel, onTubi } = getBroadcast(match.id);
  return {
    id: match.id,
    date: match.date,
    round: match.round,
    status,
    statusLong: statusLabel(status),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    foxChannel,
    onTubi,
  };
}

function msUntilNextChange(matches: StaticMatch[], now: number): number {
  let next = Infinity;

  for (const match of matches) {
    const kickoff = new Date(match.date).getTime();
    const end = kickoff + MATCH_DURATION_MS;

    if (match.status && FINISHED_STATUSES.has(match.status)) continue;

    if (now < kickoff) next = Math.min(next, kickoff - now);
    else if (now < end) next = Math.min(next, end - now);
  }

  return Number.isFinite(next) ? next : 60 * 60 * 1000;
}

/** Midnight-to-midnight window for a calendar day offset from today (local time). */
function getCalendarDayWindow(now: number, daysFromToday: number) {
  const start = new Date(now);
  start.setDate(start.getDate() + daysFromToday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.getTime(),
    end: end.getTime(),
    dateIso: start.toISOString(),
  };
}

function getScheduledMatchesForWindow(
  summaries: MatchSummary[],
  window: { start: number; end: number },
): MatchSummary[] {
  return summaries
    .filter((m) => {
      if (m.status !== "NS") return false;
      const kickoff = new Date(m.date).getTime();
      return kickoff >= window.start && kickoff < window.end;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

export function getProgress(now = Date.now()): ProgressData {
  const matches = (fixturesData as FixturesFile).matches;

  const summaries = matches.map((m) => toSummary(m, now));
  const completed = summaries.filter((m) => isFinished(m.status));
  const live = summaries.filter((m) => isLive(m.status));

  const completedSorted = [...completed].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const upcomingDays = [1, 2].map((offset) => {
    const window = getCalendarDayWindow(now, offset);
    return {
      dateIso: window.dateIso,
      matches: getScheduledMatchesForWindow(summaries, window),
      isTomorrow: offset === 1,
    };
  });

  const completedCount = completed.length;
  const ttlMs = msUntilNextChange(matches, now);
  const bracket = buildBracket(summaries, now);
  const knockoutSchedule = buildKnockoutSchedule(summaries, now);

  return {
    totalGames: TOTAL_GAMES,
    completedGames: completedCount,
    liveGames: live.length,
    remainingGames: TOTAL_GAMES - completedCount,
    progressPercent: Math.round((completedCount / TOTAL_GAMES) * 1000) / 10,
    timeProgress: {
      startAt: new Date(TOURNAMENT_START_MS).toISOString(),
      endAt: new Date(TOURNAMENT_END_MS).toISOString(),
      percent: getTimeProgressPercent(now),
    },
    lastCompleted: completedSorted[0] ?? null,
    liveMatches: live,
    upcomingDays,
    bracket,
    knockoutSchedule,
    nextStatusChangeAt: new Date(now + ttlMs).toISOString(),
  };
}
