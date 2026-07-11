import {
  applyScheduleStatuses,
  resolveMatchStatus,
} from "./match-status";
import {
  getScheduleDayWindow,
  zonedWallTimeToUtc,
  SCHEDULE_DAY_TIMEZONE,
} from "./schedule-day";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// Jul 8 7 PM ET — prior schedule day vs "now" on Jul 11 10 AM ET
const r16Kickoff = zonedWallTimeToUtc(2026, 7, 8, 19, 0, SCHEDULE_DAY_TIMEZONE);
const nowOnJul11 = zonedWallTimeToUtc(2026, 7, 11, 10, 0, SCHEDULE_DAY_TIMEZONE);

const staleNs = resolveMatchStatus(
  new Date(r16Kickoff).toISOString(),
  "NS",
  nowOnJul11,
);
assert(staleNs.status === "FT", "prior-day NS closes at next schedule day");

const staleLive = resolveMatchStatus(
  new Date(r16Kickoff).toISOString(),
  "LIVE",
  nowOnJul11,
);
assert(staleLive.status === "FT", "prior-day LIVE closes at next schedule day");

// Same schedule day — still infer live during match window
const todayKickoff = zonedWallTimeToUtc(2026, 7, 11, 15, 0, SCHEDULE_DAY_TIMEZONE);
const nowDuringMatch = todayKickoff + 30 * 60_000;
const liveNow = resolveMatchStatus(
  new Date(todayKickoff).toISOString(),
  "NS",
  nowDuringMatch,
);
assert(liveNow.status === "LIVE", "same-day match can still be live");

const [closed] = applyScheduleStatuses(
  [
    {
      id: 96,
      date: new Date(r16Kickoff).toISOString(),
      round: "Round of 16",
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
    },
  ],
  nowOnJul11,
);
assert(closed?.status === "FT", "applyScheduleStatuses closes prior-day open matches");

const currentDayStart = getScheduleDayWindow(nowOnJul11, 0).start;
assert(
  new Date(r16Kickoff).getTime() < currentDayStart,
  "fixture kickoff is before current schedule day",
);

console.log("match-status.test.ts: all assertions passed");
