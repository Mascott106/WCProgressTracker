import fixturesData from "@/data/fixtures.json";
import { isUndeterminedTeamName } from "./placeholders";
import { FixturesFile, isFinished, type MatchSummary } from "./types";

const GROUP_WINNER_RE = /^Group ([A-L]) Winners?$/i;
const GROUP_RUNNER_UP_RE = /^Group ([A-L]) Runners? Up$/i;

interface Standing {
  team: string;
  played: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}

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

function emptyStanding(team: string): Standing {
  return { team, played: 0, points: 0, gf: 0, ga: 0, gd: 0 };
}

function addResult(
  table: Map<string, Standing>,
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

function computeGroupTables(
  summaries: MatchSummary[],
): Map<string, Standing[]> {
  const byId = new Map(summaries.map((m) => [m.id, m]));
  const tables = new Map<string, Map<string, Standing>>();

  for (const [group, teams] of groupStageMeta.teamsByGroup) {
    const table = new Map<string, Standing>();
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

  const sorted = new Map<string, Standing[]>();
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

function resolveGroupLabel(
  name: string,
  tables: Map<string, Standing[]>,
): string {
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
): MatchSummary[] {
  const tables = computeGroupTables(summaries);

  return summaries.map((match) => {
    const homeTeam = isUndeterminedTeamName(match.homeTeam)
      ? resolveGroupLabel(match.homeTeam, tables)
      : match.homeTeam;
    const awayTeam = isUndeterminedTeamName(match.awayTeam)
      ? resolveGroupLabel(match.awayTeam, tables)
      : match.awayTeam;

    if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) {
      return match;
    }

    return { ...match, homeTeam, awayTeam };
  });
}
