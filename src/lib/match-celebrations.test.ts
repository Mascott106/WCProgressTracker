import {
  hasLiveToLastCompletedTransition,
  shouldPlayMatchCompleteSound,
} from "./match-celebrations";
import type { MatchSummary, ProgressData } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function match(id: number): MatchSummary {
  return {
    id,
    date: "2026-06-26T19:00:00.000Z",
    round: "Group Stage",
    status: "FT",
    statusLong: "Full Time",
    homeTeam: "A",
    awayTeam: "B",
    homeGoals: 1,
    awayGoals: 0,
    venue: "V",
    city: "C",
    foxChannel: "FOX",
    onTubi: false,
  };
}

const baseData = {
  totalGames: 104,
  completedGames: 1,
  liveGames: 0,
  remainingGames: 103,
  progressPercent: 1,
  timeProgress: { startAt: "", endAt: "", percent: 0 },
  upcomingDays: [],
  bracket: { active: false, rounds: [], thirdPlace: null, knockoutTree: null },
  knockoutSchedule: { active: false, milestones: [], currentRound: null },
  nextStatusChangeAt: "",
} satisfies Omit<ProgressData, "liveMatches" | "lastCompleted">;

assert(
  hasLiveToLastCompletedTransition([42], [], [match(42)]),
  "live → last completed",
);
assert(
  !hasLiveToLastCompletedTransition([42], [match(42)], []),
  "still live",
);
assert(
  !hasLiveToLastCompletedTransition([], [match(42)], [match(42)]),
  "was never tracked as live",
);

const data: ProgressData = {
  ...baseData,
  liveMatches: [],
  lastCompleted: [match(42)],
};

assert(
  shouldPlayMatchCompleteSound({ liveMatchIds: [42], nerdMode: true }, data, true),
  "nerd mode transition plays",
);
assert(
  !shouldPlayMatchCompleteSound({ liveMatchIds: [42], nerdMode: true }, data, false),
  "normal mode silent",
);
assert(
  !shouldPlayMatchCompleteSound(null, data, true),
  "no sound on first load",
);

console.log("match-celebrations tests passed");
