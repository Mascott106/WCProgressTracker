import { buildLocalizedScheduleDays } from "./localized-schedule";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function match(id: number, iso: string): MatchSummary {
  return {
    id,
    date: iso,
    round: "Round of 32",
    status: "NS",
    statusLong: "Not Started",
    homeTeam: "A",
    awayTeam: "B",
    homeGoals: null,
    awayGoals: null,
    venue: "V",
    city: "C",
    foxChannel: "FOX",
    onTubi: false,
  };
}

// Kickoff 30 min after server snapshot; 60 min before drifted client clock.
const serverNow = Date.UTC(2026, 5, 30, 14, 0);
const clientLater = serverNow + 90 * 60 * 1000;
const matches = [match(99, "2026-06-30T14:30:00.000Z")];
const timeZone = "America/New_York";

const serverBuckets = buildLocalizedScheduleDays(matches, serverNow, timeZone);
const driftedClientBuckets = buildLocalizedScheduleDays(
  matches,
  clientLater,
  timeZone,
);
const anchoredClientBuckets = buildLocalizedScheduleDays(
  matches,
  serverNow,
  timeZone,
);

assert(
  serverBuckets[0]!.matches.length === 1,
  "server snapshot should include match in today bucket",
);
assert(
  driftedClientBuckets[0]!.matches.length === 0,
  "drifted client now should drop match from today bucket",
);
assert(
  serverBuckets[0]!.matches.map((m) => m.id).join(",") ===
    anchoredClientBuckets[0]!.matches.map((m) => m.id).join(","),
  "client using generatedAt should match server bucketing",
);

console.log("localized-schedule tests passed");
