import fixturesData from "@/data/fixtures.json";
import { getBroadcast } from "./broadcast";
import { buildProgressData } from "./progress";
import { resolveMatchStatus } from "./match-status";
import {
  FixturesFile,
  MatchSummary,
  ProgressData,
  StaticMatch,
} from "./types";

function toSummary(match: StaticMatch, now: number): MatchSummary {
  const { status, statusLong } = resolveMatchStatus(
    match.date,
    match.status,
    now,
  );
  const { foxChannel, onTubi } = getBroadcast(match.id);
  return {
    id: match.id,
    date: match.date,
    round: match.round,
    status,
    statusLong,
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
