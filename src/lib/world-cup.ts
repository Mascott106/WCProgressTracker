import fixturesData from "@/data/fixtures.json";
import { getBroadcast } from "./broadcast";
import { buildProgressData } from "./progress";
import {
  FINISHED_STATUSES,
  FixturesFile,
  MATCH_DURATION_MINUTES,
  MatchSummary,
  ProgressData,
  StaticMatch,
  statusLabel,
} from "./types";

const MATCH_DURATION_MS = MATCH_DURATION_MINUTES * 60 * 1000;

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

/** Static schedule — no external API. */
export function getProgress(now = Date.now()): ProgressData {
  const matches = (fixturesData as FixturesFile).matches;
  const summaries = matches.map((m) => toSummary(m, now));
  return buildProgressData(summaries, now);
}
