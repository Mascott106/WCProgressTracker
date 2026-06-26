import annexData from "@/data/third-place-annex-c.json";
import type { GroupStandingRow } from "./group-standings";

/** Group winners with a Round of 32 third-place opponent (FIFA Annex C column order). */
const ANNEX_C_WINNERS = annexData.winners as string[];
const ANNEX_C_ROWS = annexData.rows as string[];

const ALL_GROUPS = "ABCDEFGHIJKL".split("");
const GROUPS_IN_STAGE = 3;

/** FIFA Annex C: keyed by sorted 8 qualifying group letters → winner → third-group letter. */
const THIRD_PLACE_LOOKUP = (() => {
  const map = new Map<string, Record<string, string>>();
  for (const letters of ANNEX_C_ROWS) {
    const byWinner: Record<string, string> = {};
    for (let j = 0; j < ANNEX_C_WINNERS.length; j++) {
      byWinner[ANNEX_C_WINNERS[j]!] = letters[j]!;
    }
    map.set(letters.split("").sort().join(""), byWinner);
  }
  return map;
})();

export interface ThirdPlaceCandidate {
  group: string;
  row: GroupStandingRow;
}

/** Rank all 12 third-placed teams; null until every group has completed 3 games. */
export function rankThirdPlaceCandidates(
  tables: Map<string, GroupStandingRow[]>,
): ThirdPlaceCandidate[] | null {
  const candidates: ThirdPlaceCandidate[] = [];

  for (const group of ALL_GROUPS) {
    const table = tables.get(group);
    if (!table || table.length < 3) return null;
    const third = table[2]!;
    if (third.played < GROUPS_IN_STAGE) return null;
    candidates.push({ group, row: third });
  }

  candidates.sort(
    (a, b) =>
      b.row.points - a.row.points ||
      b.row.gd - a.row.gd ||
      b.row.gf - a.row.gf ||
      a.row.team.localeCompare(b.row.team),
  );

  return candidates;
}

/**
 * Map group-winner letter (A,B,D,E,G,I,K,L) → third-placed team name.
 * Uses FIFA Annex C once all group-stage thirds are final.
 */
export function buildThirdPlaceAssignments(
  tables: Map<string, GroupStandingRow[]>,
): Map<string, string> | null {
  const ranked = rankThirdPlaceCandidates(tables);
  if (!ranked) return null;

  const qualifying = ranked.slice(0, 8);
  const combo = qualifying
    .map((q) => q.group)
    .sort()
    .join("");
  const byWinner = THIRD_PLACE_LOOKUP.get(combo);
  if (!byWinner) return null;

  const teamByGroup = new Map(qualifying.map((q) => [q.group, q.row.team]));
  const assignment = new Map<string, string>();

  for (const [winner, thirdGroup] of Object.entries(byWinner)) {
    const team = teamByGroup.get(thirdGroup);
    if (team) assignment.set(winner, team);
  }

  return assignment.size === ANNEX_C_WINNERS.length ? assignment : null;
}

export const BEST_THIRD_RE = /^Best 3rd \(([A-L](?:\/[A-L])*)\)$/i;

export function isBestThirdPlaceholder(name: string): boolean {
  return BEST_THIRD_RE.test(name.trim());
}
