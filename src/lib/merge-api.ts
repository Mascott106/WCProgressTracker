import fixturesData from "@/data/fixtures.json";
import { getBroadcast } from "./broadcast";
import type { ApiGroupStandings } from "./group-standings";
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
  /** football-data.org match id (stable across fetches). */
  apiId?: number;
  /** e.g. GROUP_STAGE, LAST_32, QUARTER_FINALS */
  stage?: string | null;
  /** e.g. GROUP_A — null for knockout matches */
  group?: string | null;
  date: string;
  status: string;
  statusLong: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
}

const KICKOFF_TOLERANCE_MS = 90 * 60 * 1000;

/** Map our fixture id to the stage string football-data.org uses. */
export function expectedApiStage(staticMatch: StaticMatch): string | null {
  if (staticMatch.id <= 72) return "GROUP_STAGE";
  if (staticMatch.id <= 88) return "LAST_32";
  if (staticMatch.id <= 96) return "LAST_16";
  if (staticMatch.id <= 100) return "QUARTER_FINALS";
  if (staticMatch.id <= 102) return "SEMI_FINALS";
  if (staticMatch.id === 103) return "THIRD_PLACE";
  if (staticMatch.id === 104) return "FINAL";
  return null;
}

/** Parse GROUP_A → A for comparison with fixtures.json group letters. */
export function apiGroupLetter(
  apiGroup: string | null | undefined,
): string | null {
  if (!apiGroup) return null;
  const match = apiGroup.match(/^GROUP_([A-L])$/i);
  return match ? match[1]!.toUpperCase() : null;
}

function kickoffMatches(a: string, b: string): boolean {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return Math.abs(aMs - bMs) <= KICKOFF_TOLERANCE_MS;
}

function stageMatches(staticMatch: StaticMatch, api: ExternalMatch): boolean {
  const expected = expectedApiStage(staticMatch);
  if (!expected || !api.stage) return true;
  return api.stage === expected;
}

function groupMatches(staticMatch: StaticMatch, api: ExternalMatch): boolean {
  const staticGroup = staticMatch.group?.toUpperCase() ?? null;
  const apiGroup = apiGroupLetter(api.group);
  if (!staticGroup || !apiGroup) return true;
  return staticGroup === apiGroup;
}

function matchCandidateScore(
  staticMatch: StaticMatch,
  api: ExternalMatch,
): number {
  let score = 0;

  const expected = expectedApiStage(staticMatch);
  if (expected && api.stage === expected) score += 8;

  const staticGroup = staticMatch.group?.toUpperCase() ?? null;
  const apiGroup = apiGroupLetter(api.group);
  if (staticGroup && apiGroup && staticGroup === apiGroup) score += 8;

  if (
    api.homeTeam &&
    !isUndeterminedTeamName(staticMatch.homeTeam) &&
    teamsMatch(api.homeTeam, staticMatch.homeTeam)
  ) {
    score += 4;
  }
  if (
    api.awayTeam &&
    !isUndeterminedTeamName(staticMatch.awayTeam) &&
    teamsMatch(api.awayTeam, staticMatch.awayTeam)
  ) {
    score += 4;
  }

  const kickoffDelta = Math.abs(
    new Date(api.date).getTime() - new Date(staticMatch.date).getTime(),
  );
  score -= kickoffDelta / (60 * 60 * 1000);

  return score;
}

/** Whether an API row corresponds to a static fixture row. */
function apiMatchesStatic(
  staticMatch: StaticMatch,
  api: ExternalMatch,
): boolean {
  if (!kickoffMatches(api.date, staticMatch.date)) return false;
  if (!stageMatches(staticMatch, api)) return false;
  if (!groupMatches(staticMatch, api)) return false;

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

  const pick = candidates.reduce((best, current) =>
    matchCandidateScore(staticMatch, current.api) >
    matchCandidateScore(staticMatch, best.api)
      ? current
      : best,
  );
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
      venue: staticMatch.venue,
      city: staticMatch.city,
      foxChannel,
      onTubi,
    };
  });
}

export function buildProgressFromExternal(
  external: ExternalMatch[],
  now = Date.now(),
  apiStandings?: ApiGroupStandings,
) {
  return buildProgressData(mergeExternalMatches(external), now, {
    apiStandings,
  });
}
