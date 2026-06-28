import fixturesData from "@/data/fixtures.json";
import { isUndeterminedTeamName } from "./placeholders";
import {
  buildThirdPlaceAssignments,
  isBestThirdPlaceholder,
  resolveBestThirdPlaceholder,
  type ThirdPlaceSlotAssignment,
} from "./third-place-qualifiers";
import { teamsMatch } from "./team-names";
import { FixturesFile, isFinished, type MatchSummary } from "./types";

const GROUP_WINNER_RE = /^Group ([A-L]) Winners?$/i;
const GROUP_RUNNER_UP_RE = /^Group ([A-L]) Runners? Up$/i;

function apiGroupLetter(
  apiGroup: string | null | undefined,
): string | null {
  if (!apiGroup) return null;
  const match = apiGroup.match(/^GROUP_([A-L])$/i);
  return match ? match[1]!.toUpperCase() : null;
}

export interface GroupStandingRow {
  team: string;
  played: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}

/** One group's table block from football-data.org /standings. */
export interface ApiGroupStandingBlock {
  type: string;
  group: string | null;
  table: {
    position: number;
    team: { name: string };
    playedGames: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  }[];
}

export type ApiGroupStandings = Record<string, GroupStandingRow[]>;

const groupStageMeta = (() => {
  const matches = (fixturesData as FixturesFile).matches.filter(
    (m) => m.group && m.id <= 72,
  );
  const teamsByGroup = new Map<string, Set<string>>();
  const groupByMatchId = new Map<number, string>();

  for (const match of matches) {
    const group = match.group!.toUpperCase();
    groupByMatchId.set(match.id, group);
    const teams = teamsByGroup.get(group) ?? new Set<string>();
    teams.add(match.homeTeam);
    teams.add(match.awayTeam);
    teamsByGroup.set(group, teams);
  }

  return { matches, teamsByGroup, groupByMatchId };
})();

/** Best 3rd slot metadata from static fixtures (side + opponent winner group). */
const bestThirdSlotByMatchId = (() => {
  const map = new Map<
    number,
    { winnerGroup: string; side: "home" | "away" }
  >();
  for (const match of (fixturesData as FixturesFile).matches) {
    const homeWinner = match.homeTeam.match(GROUP_WINNER_RE);
    const awayWinner = match.awayTeam.match(GROUP_WINNER_RE);
    if (isBestThirdPlaceholder(match.homeTeam) && awayWinner) {
      map.set(match.id, {
        winnerGroup: awayWinner[1]!.toUpperCase(),
        side: "home",
      });
    } else if (isBestThirdPlaceholder(match.awayTeam) && homeWinner) {
      map.set(match.id, {
        winnerGroup: homeWinner[1]!.toUpperCase(),
        side: "away",
      });
    }
  }
  return map;
})();

export function winnerGroupForBestThirdMatch(matchId: number): string | null {
  return bestThirdSlotByMatchId.get(matchId)?.winnerGroup ?? null;
}

export function bestThirdSideForMatch(
  matchId: number,
): "home" | "away" | null {
  return bestThirdSlotByMatchId.get(matchId)?.side ?? null;
}

export function apiTeamForBestThirdSlot(match: MatchSummary): string | null {
  const side = bestThirdSideForMatch(match.id);
  if (!side) return null;
  return apiTeamForBestThirdSide(side, match.apiHomeTeam, match.apiAwayTeam);
}

/** Pick the API team name for a Best 3rd slot on the given side. */
export function apiTeamForBestThirdSide(
  side: "home" | "away",
  apiHomeTeam: string | null | undefined,
  apiAwayTeam: string | null | undefined,
): string | null {
  return side === "home"
    ? concreteApiTeamName(apiHomeTeam)
    : concreteApiTeamName(apiAwayTeam);
}

function concreteApiTeamName(name: string | null | undefined): string | null {
  if (!name?.trim() || isUndeterminedTeamName(name)) return null;
  return name.trim();
}

/** Warn when computed Best 3rd assignments disagree with API knockout fixtures. */
function validateBestThirdAgainstApi(
  summaries: MatchSummary[],
  thirdByWinner: Map<string, ThirdPlaceSlotAssignment> | null,
): void {
  if (!thirdByWinner) return;

  for (const match of summaries) {
    const winnerGroup = winnerGroupForBestThirdMatch(match.id);
    if (!winnerGroup) continue;

    const computed = thirdByWinner.get(winnerGroup);
    const apiTeam = apiTeamForBestThirdSlot(match);
    if (
      computed &&
      apiTeam &&
      !teamsMatch(computed.team, apiTeam)
    ) {
      console.warn(
        `[wc-progress] Match ${match.id} Best 3rd (1${winnerGroup}): computed "${computed.team}" (3${computed.thirdGroup}) ≠ API "${apiTeam}" — using API`,
      );
    }
  }
}

function emptyStanding(team: string): GroupStandingRow {
  return { team, played: 0, points: 0, gf: 0, ga: 0, gd: 0 };
}

function addResult(
  table: Map<string, GroupStandingRow>,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number,
) {
  const homeRow = table.get(home)!;
  const awayRow = table.get(away)!;

  homeRow.played += 1;
  awayRow.played += 1;
  homeRow.gf += homeGoals;
  homeRow.ga += awayGoals;
  awayRow.gf += awayGoals;
  awayRow.ga += homeGoals;

  if (homeGoals > awayGoals) {
    homeRow.points += 3;
  } else if (homeGoals < awayGoals) {
    awayRow.points += 3;
  } else {
    homeRow.points += 1;
    awayRow.points += 1;
  }

  homeRow.gd = homeRow.gf - homeRow.ga;
  awayRow.gd = awayRow.gf - awayRow.ga;
}

/** Normalize football-data.org standings into group letter → sorted table rows. */
export function parseApiStandings(
  blocks: ApiGroupStandingBlock[],
): ApiGroupStandings {
  const result: ApiGroupStandings = {};

  for (const block of blocks) {
    if (block.type !== "TOTAL") continue;
    const letter = apiGroupLetter(block.group);
    if (!letter || block.table.length === 0) continue;

    result[letter] = [...block.table]
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        team: row.team.name,
        played: row.playedGames,
        points: row.points,
        gf: row.goalsFor,
        ga: row.goalsAgainst,
        gd: row.goalDifference,
      }));
  }

  return result;
}

function computeGroupTables(
  summaries: MatchSummary[],
): Map<string, GroupStandingRow[]> {
  const byId = new Map(summaries.map((m) => [m.id, m]));
  const tables = new Map<string, Map<string, GroupStandingRow>>();

  for (const [group, teams] of groupStageMeta.teamsByGroup) {
    const table = new Map<string, GroupStandingRow>();
    for (const team of teams) {
      table.set(team, emptyStanding(team));
    }
    tables.set(group, table);
  }

  for (const staticMatch of groupStageMeta.matches) {
    const result = byId.get(staticMatch.id);
    if (!result || !isFinished(result.status)) continue;
    if (result.homeGoals === null || result.awayGoals === null) continue;

    const group = groupStageMeta.groupByMatchId.get(staticMatch.id);
    if (!group) continue;

    addResult(
      tables.get(group)!,
      result.homeTeam,
      result.awayTeam,
      result.homeGoals,
      result.awayGoals,
    );
  }

  const sorted = new Map<string, GroupStandingRow[]>();
  for (const [group, table] of tables) {
    sorted.set(
      group,
      [...table.values()].sort(
        (a, b) =>
          b.points - a.points ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          a.team.localeCompare(b.team),
      ),
    );
  }

  return sorted;
}

function buildGroupTables(
  summaries: MatchSummary[],
  apiStandings?: ApiGroupStandings,
): Map<string, GroupStandingRow[]> {
  const computed = computeGroupTables(summaries);
  if (!apiStandings || Object.keys(apiStandings).length === 0) {
    return computed;
  }

  const merged = new Map(computed);
  for (const [group, rows] of Object.entries(apiStandings)) {
    if (rows.length === 0) continue;

    const letter = group.toUpperCase();
    const compRows = computed.get(letter);
    if (compRows) {
      for (let i = 0; i < Math.min(3, compRows.length, rows.length); i++) {
        const comp = compRows[i];
        const api = rows[i];
        if (comp && api && !teamsMatch(comp.team, api.team)) {
          console.warn(
            `[wc-progress] Group ${letter} #${i + 1}: computed "${comp.team}" ≠ API standings "${api.team}" — using API`,
          );
        }
      }
    }

    merged.set(letter, rows);
  }
  return merged;
}

function resolveGroupLabel(
  name: string,
  tables: Map<string, GroupStandingRow[]>,
  thirdByWinner: Map<string, ThirdPlaceSlotAssignment> | null,
  opponentWinnerGroup: string | null,
): string {
  if (isBestThirdPlaceholder(name)) {
    return resolveBestThirdPlaceholder(
      name,
      thirdByWinner,
      opponentWinnerGroup,
    );
  }

  const winner = name.match(GROUP_WINNER_RE);
  if (winner) {
    const table = tables.get(winner[1]!.toUpperCase());
    if (table?.[0]) return table[0].team;
    return name;
  }

  const runnerUp = name.match(GROUP_RUNNER_UP_RE);
  if (runnerUp) {
    const table = tables.get(runnerUp[1]!.toUpperCase());
    if (table?.[1]) return table[1].team;
    return name;
  }

  return name;
}

/** Replace Group X Winners / Runners Up labels using group-stage results. */
export function applyGroupPlaceholders(
  summaries: MatchSummary[],
  options?: { apiStandings?: ApiGroupStandings },
): MatchSummary[] {
  const tables = buildGroupTables(summaries, options?.apiStandings);
  const thirdByWinner = buildThirdPlaceAssignments(tables);
  validateBestThirdAgainstApi(summaries, thirdByWinner);

  return summaries.map((match) => {
    const opponentWinnerGroup =
      winnerGroupForBestThirdMatch(match.id) ??
      match.homeTeam.match(GROUP_WINNER_RE)?.[1]?.toUpperCase() ??
      match.awayTeam.match(GROUP_WINNER_RE)?.[1]?.toUpperCase() ??
      null;

    const homeTeam = isUndeterminedTeamName(match.homeTeam)
      ? resolveGroupLabel(
          match.homeTeam,
          tables,
          thirdByWinner,
          opponentWinnerGroup,
        )
      : match.homeTeam;
    const awayTeam = isUndeterminedTeamName(match.awayTeam)
      ? resolveGroupLabel(
          match.awayTeam,
          tables,
          thirdByWinner,
          opponentWinnerGroup,
        )
      : match.awayTeam;

    if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) {
      return match;
    }

    return { ...match, homeTeam, awayTeam };
  });
}
