import { buildKnockoutSchedule, KNOCKOUT_START_MS } from "./knockout-schedule";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function koMatch(
  id: number,
  round: string,
  status: MatchSummary["status"],
): MatchSummary {
  return {
    id,
    date: "2026-07-04T19:00:00.000Z",
    round,
    status,
    statusLong: status,
    homeTeam: "A",
    awayTeam: "B",
    homeGoals: status === "FT" ? 1 : null,
    awayGoals: status === "FT" ? 0 : null,
    venue: "V",
    city: "C",
    foxChannel: "FOX",
    onTubi: false,
  };
}

const summaries: MatchSummary[] = [
  ...Array.from({ length: 16 }, (_, i) =>
    koMatch(73 + i, "Round of 32", "FT"),
  ),
  ...Array.from({ length: 7 }, (_, i) =>
    koMatch(89 + i, "Round of 16", "FT"),
  ),
  koMatch(96, "Round of 16", "NS"),
  koMatch(97, "Quarter-finals", "FT"),
  koMatch(98, "Quarter-finals", "FT"),
  koMatch(99, "Quarter-finals", "NS"),
  koMatch(100, "Quarter-finals", "NS"),
];

const schedule = buildKnockoutSchedule(summaries, KNOCKOUT_START_MS + 1);
const r16 = schedule.milestones.find((m) => m.name === "Round of 16");
const qf = schedule.milestones.find((m) => m.name === "Quarter-finals");

assert(r16?.status === "current", "R16 is the active round");
assert(qf?.status === "upcoming", "QF is not lit while R16 remains");
assert(
  schedule.milestones.filter((m) => m.status === "current").length === 1,
  "only one current milestone",
);
assert(schedule.currentRound === "Round of 16", "header matches active round");

console.log("knockout-schedule.test.ts: all assertions passed");
