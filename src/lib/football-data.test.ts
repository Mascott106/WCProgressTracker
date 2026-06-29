import { extractMatchGoals, scoreFromGoalEvents } from "./football-data";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

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
