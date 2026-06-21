import fixturesData from "@/data/fixtures.json";
import { getBroadcast } from "./broadcast";
import { buildProgressData } from "./progress";
import {
  isUndeterminedTeamName,
  resolveTeamName,
} from "./placeholders";
import { teamsMatch } from "./team-names";
import {
  FixturesFile,
  MatchSummary,
  StaticMatch,
  statusLabel,
} from "./types";

/** Normalized match from an external API, ready to merge onto our schedule. */
export interface ExternalMatch {
  date: string;
  status: string;
  statusLong: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
}

const KICKOFF_TOLERANCE_MS = 90 * 60 * 1000;

function kickoffMatches(a: string, b: string): boolean {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return Math.abs(aMs - bMs) <= KICKOFF_TOLERANCE_MS;
}

/** Whether an API row corresponds to a static fixture row. */
function apiMatchesStatic(
  staticMatch: StaticMatch,
  api: ExternalMatch,
): boolean {
  if (!kickoffMatches(api.date, staticMatch.date)) return false;

  const homePlaceholder = isUndeterminedTeamName(staticMatch.homeTeam);
  const awayPlaceholder = isUndeterminedTeamName(staticMatch.awayTeam);

  if (homePlaceholder && awayPlaceholder) return true;

  if (!homePlaceholder) {
    if (!api.homeTeam || !teamsMatch(api.homeTeam, staticMatch.homeTeam)) {
      return false;
    }
  }

  if (!awayPlaceholder) {
    if (!api.awayTeam || !teamsMatch(api.awayTeam, staticMatch.awayTeam)) {
      return false;
    }
  }

  return true;
}

function findExternalMatch(
  staticMatch: StaticMatch,
  external: ExternalMatch[],
  used: Set<number>,
): ExternalMatch | undefined {
  const candidates = external
    .map((api, index) => ({ api, index }))
    .filter(({ index, api }) => !used.has(index) && apiMatchesStatic(staticMatch, api));

  if (candidates.length === 0) return undefined;

  const exact = candidates.find(
    ({ api }) =>
      api.homeTeam &&
      api.awayTeam &&
      teamsMatch(api.homeTeam, staticMatch.homeTeam) &&
      teamsMatch(api.awayTeam, staticMatch.awayTeam),
  );
  const pick = exact ?? candidates[0];
  used.add(pick.index);
  return pick.api;
}

export function countMatchedFixtures(external: ExternalMatch[]): number {
  const staticMatches = (fixturesData as FixturesFile).matches;
  const used = new Set<number>();
  return staticMatches.filter((m) => findExternalMatch(m, external, used)).length;
}

export function mergeExternalMatches(
  external: ExternalMatch[],
): MatchSummary[] {
  const staticMatches = (fixturesData as FixturesFile).matches;
  const used = new Set<number>();

  return staticMatches.map((staticMatch) => {
    const api = findExternalMatch(staticMatch, external, used);
    const { foxChannel, onTubi } = getBroadcast(staticMatch.id);
    const kickoff = api?.date ?? staticMatch.date;

    return {
      id: staticMatch.id,
      date: kickoff,
      round: staticMatch.round,
      status: api?.status ?? "NS",
      statusLong: api?.statusLong ?? statusLabel("NS"),
      homeTeam: resolveTeamName(staticMatch.homeTeam, api?.homeTeam),
      awayTeam: resolveTeamName(staticMatch.awayTeam, api?.awayTeam),
      homeGoals: api?.homeGoals ?? staticMatch.homeGoals,
      awayGoals: api?.awayGoals ?? staticMatch.awayGoals,
      foxChannel,
      onTubi,
    };
  });
}

export function buildProgressFromExternal(
  external: ExternalMatch[],
  now = Date.now(),
) {
  return buildProgressData(mergeExternalMatches(external), now);
}
