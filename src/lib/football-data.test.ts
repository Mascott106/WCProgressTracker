import {
  API_FETCH_INTERVAL_MS,
  QUIET_POLL_MS,
} from "./api-limits";
import { computeCacheTtl, extractMatchGoals, scoreFromGoalEvents } from "./football-data";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function scheduledMatch(dateIso: string): MatchSummary {
  return {
    id: 1,
    date: dateIso,
    status: "NS",
    statusLong: "Not Started",
    homeTeam: "A",
    awayTeam: "B",
    homeGoals: null,
    awayGoals: null,
    round: "Group Stage - A",
    venue: "",
    city: "",
    foxChannel: null,
    onTubi: false,
  };
}

const quietNow = Date.UTC(2026, 6, 3, 21, 25); // 5:25 PM ET
const kickoffIn35Min = new Date(quietNow + 35 * 60_000).toISOString();

assert(
  computeCacheTtl([scheduledMatch(kickoffIn35Min)], quietNow) === QUIET_POLL_MS,
  "quiet window should poll every 5 minutes when next kickoff is far",
);

const kickoffIn3Min = new Date(quietNow + 3 * 60_000).toISOString();
assert(
  computeCacheTtl([scheduledMatch(kickoffIn3Min)], quietNow) === 3 * 60_000,
  "should fetch before kickoff when it is within 5 minutes",
);

const kickoffIn30Sec = new Date(quietNow + 30_000).toISOString();
assert(
  computeCacheTtl([scheduledMatch(kickoffIn30Sec)], quietNow) === 30_000,
  "should fetch at kickoff when it is less than 60 seconds away",
);

const liveKickoff = new Date(quietNow - 30 * 60_000).toISOString();
assert(
  computeCacheTtl([scheduledMatch(liveKickoff)], quietNow) ===
    API_FETCH_INTERVAL_MS,
  "live window should poll every minute",
);

const fromEvents = scoreFromGoalEvents([
  { score: { home: 1, away: 0 } },
  { score: { home: 1, away: 1 } },
]);
assert(fromEvents?.home === 1 && fromEvents?.away === 1, "last goal event score");

const liveStaleFullTime = extractMatchGoals({
  status: "IN_PLAY",
  utcDate: "2026-06-29T20:30:00.000Z",
  homeTeam: { name: "Germany" },
  awayTeam: { name: "Paraguay" },
  goals: [
    { score: { home: 1, away: 0 } },
    { score: { home: 1, away: 1 } },
  ],
  score: {
    fullTime: { home: 2, away: 1 },
  },
});

assert(
  liveStaleFullTime.home === 1 && liveStaleFullTime.away === 1,
  "live match should prefer goal events over stale fullTime",
);

const finished = extractMatchGoals({
  status: "FINISHED",
  utcDate: "2026-06-29T20:30:00.000Z",
  homeTeam: { name: "Germany" },
  awayTeam: { name: "Paraguay" },
  goals: [{ score: { home: 1, away: 1 } }],
  score: {
    fullTime: { home: 2, away: 1 },
  },
});

assert(
  finished.home === 2 && finished.away === 1,
  "finished match should keep fullTime",
);

console.log("football-data score tests passed");
