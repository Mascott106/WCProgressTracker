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

// QF underway while one R16 match still open in the API (straggler).
const qfWithR16Straggler: MatchSummary[] = [
  ...Array.from({ length: 16 }, (_, i) =>
    koMatch(73 + i, "Round of 32", "FT"),
  ),
  ...Array.from({ length: 7 }, (_, i) =>
    koMatch(89 + i, "Round of 16", "FT"),
  ),
  koMatch(96, "Round of 16", "NS"),
  koMatch(97, "Quarter-finals", "FT"),
  koMatch(98, "Quarter-finals", "FT"),
  koMatch(99, "Quarter-finals", "FT"),
  koMatch(100, "Quarter-finals", "NS"),
];

const qfSchedule = buildKnockoutSchedule(
  qfWithR16Straggler,
  KNOCKOUT_START_MS + 1,
);
const r16 = qfSchedule.milestones.find((m) => m.name === "Round of 16");
const qf = qfSchedule.milestones.find((m) => m.name === "Quarter-finals");

assert(r16?.status === "complete", "R16 displays complete once QF has started");
assert(qf?.status === "current", "QF is active when it has results");
assert(
  qfSchedule.milestones.filter((m) => m.status === "current").length === 1,
  "only one current milestone",
);
assert(
  qfSchedule.currentRound === "Quarter-finals",
  "header matches QF activity",
);

// Still in R16 — no QF results yet.
const r16Only: MatchSummary[] = [
  ...Array.from({ length: 16 }, (_, i) =>
    koMatch(73 + i, "Round of 32", "FT"),
  ),
  ...Array.from({ length: 7 }, (_, i) =>
    koMatch(89 + i, "Round of 16", "FT"),
  ),
  koMatch(96, "Round of 16", "NS"),
  ...Array.from({ length: 4 }, (_, i) =>
    koMatch(97 + i, "Quarter-finals", "NS"),
  ),
];

const r16Schedule = buildKnockoutSchedule(r16Only, KNOCKOUT_START_MS + 1);
assert(
  r16Schedule.milestones.find((m) => m.name === "Round of 16")?.status ===
    "current",
  "R16 stays active when QF has not started",
);
assert(
  r16Schedule.currentRound === "Round of 16",
  "header stays on R16 before QF",
);

// Entire tournament finished — Final complete, nothing "current"
const allDone: MatchSummary[] = [
  ...Array.from({ length: 16 }, (_, i) =>
    koMatch(73 + i, "Round of 32", "FT"),
  ),
  ...Array.from({ length: 8 }, (_, i) =>
    koMatch(89 + i, "Round of 16", "FT"),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    koMatch(97 + i, "Quarter-finals", "FT"),
  ),
  koMatch(101, "Semi-finals", "FT"),
  koMatch(102, "Semi-finals", "FT"),
  koMatch(103, "Third Place", "FT"),
  koMatch(104, "Final", "FT"),
];

const doneSchedule = buildKnockoutSchedule(allDone, KNOCKOUT_START_MS + 1);
assert(
  doneSchedule.milestones.every((m) => m.status === "complete"),
  "all milestones complete when Final is finished",
);
assert(
  doneSchedule.milestones.filter((m) => m.status === "current").length === 0,
  "no current milestone after Final",
);
assert(doneSchedule.currentRound === null, "currentRound is null when done");

console.log("knockout-schedule.test.ts: all assertions passed");
