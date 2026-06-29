import { applyScoreLocks, clearLockedScores } from "./locked-scores";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function sampleMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    id: 74,
    date: "2026-06-29T20:30:00.000Z",
    round: "Round of 32",
    status: "LIVE",
    statusLong: "Live",
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    homeGoals: 1,
    awayGoals: 1,
    venue: "Gillette Stadium",
    city: "Boston",
    foxChannel: "FOX",
    onTubi: false,
    ...overrides,
  };
}

clearLockedScores();

// Simulate an earlier incorrect lock at 2-1 after full time.
applyScoreLocks(
  [
    sampleMatch({
      status: "FT",
      statusLong: "Full Time",
      homeGoals: 2,
      awayGoals: 1,
    }),
  ],
  Date.parse("2026-06-30T02:00:00.000Z"),
);

const liveAfterLock = applyScoreLocks(
  [sampleMatch({ homeGoals: 1, awayGoals: 1, status: "LIVE" })],
  Date.parse("2026-06-29T22:05:00.000Z"),
);

assert(liveAfterLock[0].homeGoals === 1, "live match should use API score");
assert(liveAfterLock[0].awayGoals === 1, "live match should use API score");
assert(liveAfterLock[0].status === "LIVE", "live match should not inherit FT status from lock");

clearLockedScores();
console.log("locked-scores tests passed");
