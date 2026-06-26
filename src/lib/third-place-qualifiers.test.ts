import { applyGroupPlaceholders, type GroupStandingRow } from "./group-standings";
import {
  buildThirdPlaceAssignments,
  rankThirdPlaceCandidates,
} from "./third-place-qualifiers";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function table(
  rows: [string, number, number, number, number, number][],
): GroupStandingRow[] {
  return rows.map(([team, played, points, gf, ga, gd]) => ({
    team,
    played,
    points,
    gf,
    ga,
    gd,
  }));
}

// Annex C row "EJIFHGLK" → qualifying {E,F,G,H,I,J,K,L}, 1E faces 3F.
const tables = new Map<string, GroupStandingRow[]>([
  ["A", table([["Mexico", 3, 7, 4, 2, 2], ["South Africa", 3, 4, 3, 4, -1], ["Low A", 3, 1, 1, 5, -4]])],
  ["B", table([["Canada", 3, 6, 5, 3, 2], ["Qatar", 3, 1, 2, 6, -4], ["Low B", 3, 0, 0, 3, -3]])],
  ["C", table([["Team C1", 3, 9, 6, 1, 5], ["Team C2", 3, 3, 2, 4, -2], ["Low C", 3, 0, 1, 6, -5]])],
  ["D", table([["Team D1", 3, 7, 5, 2, 3], ["Team D2", 3, 4, 3, 4, -1], ["Low D", 3, 1, 2, 5, -3]])],
  ["E", table([["Team E1", 3, 7, 4, 2, 2], ["Team E2", 3, 5, 3, 3, 0], ["Third E", 3, 4, 3, 3, 0]])],
  ["F", table([["Team F1", 3, 6, 4, 3, 1], ["Team F2", 3, 4, 2, 3, -1], ["Third F", 3, 5, 4, 2, 2]])],
  ["G", table([["Team G1", 3, 7, 5, 1, 4], ["Team G2", 3, 4, 2, 3, -1], ["Third G", 3, 3, 2, 4, -2]])],
  ["H", table([["Team H1", 3, 6, 3, 2, 1], ["Team H2", 3, 4, 2, 3, -1], ["Third H", 3, 4, 3, 4, -1]])],
  ["I", table([["Team I1", 3, 7, 4, 2, 2], ["Team I2", 3, 4, 3, 4, -1], ["Third I", 3, 3, 2, 3, -1]])],
  ["J", table([["Team J1", 3, 6, 4, 3, 1], ["Team J2", 3, 4, 2, 3, -1], ["Third J", 3, 4, 3, 4, -1]])],
  ["K", table([["Team K1", 3, 7, 5, 2, 3], ["Team K2", 3, 4, 3, 4, -1], ["Third K", 3, 3, 2, 4, -2]])],
  ["L", table([["Team L1", 3, 6, 4, 3, 1], ["Team L2", 3, 4, 2, 3, -1], ["Third L", 3, 3, 2, 4, -2]])],
]);

const ranked = rankThirdPlaceCandidates(tables);
assert(ranked !== null, "all groups complete");
const qualifyingGroups = ranked!.slice(0, 8).map((q) => q.group).sort().join("");
assert(qualifyingGroups === "EFGHIJKL", `expected EFGHIJKL combo, got ${qualifyingGroups}`);

const assignments = buildThirdPlaceAssignments(tables);
assert(assignments?.get("E") === "Third F", "1E should face Third F per Annex C");

const match74: MatchSummary = {
  id: 74,
  date: "2026-06-29T20:30:00.000Z",
  round: "Round of 32",
  status: "NS",
  statusLong: "Not Started",
  homeTeam: "Group E Winners",
  awayTeam: "Best 3rd (A/B/C/D/F)",
  homeGoals: null,
  awayGoals: null,
  venue: "Gillette Stadium",
  city: "Foxborough",
  foxChannel: "FOX",
  onTubi: false,
};

// applyGroupPlaceholders computes tables from summaries — inject via apiStandings shortcut
const apiStandings = Object.fromEntries(tables);
const [resolved] = applyGroupPlaceholders([match74], { apiStandings });
assert(resolved!.awayTeam === "Third F", "match 74 Best 3rd resolves to Third F");

console.log("third-place-qualifiers tests passed");
