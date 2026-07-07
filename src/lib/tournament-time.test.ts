import {
  computeShakeMotion,
  computeTournamentTimePercent,
  ET_FIGHT_BUFFER_MINUTES,
  FINAL_OVERTIME_DISPLAY_PERCENT,
  HALFTIME_BREAK_MINUTES,
  HYDRATION_BREAK_ALLOWANCE_MINUTES,
  REGULAR_TIME_PLAY_MINUTES,
  tournamentTimeEndAt,
  tournamentTimeEndOffsetMinutes,
} from "./tournament-time";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const FINAL_KICKOFF = "2026-07-19T19:00:00.000Z";
const START_AT = "2026-06-11T19:00:00.000Z";

assert(
  tournamentTimeEndOffsetMinutes() === 105,
  "default offset is 90 + 15 = 105",
);
assert(
  tournamentTimeEndOffsetMinutes() ===
    REGULAR_TIME_PLAY_MINUTES +
      HALFTIME_BREAK_MINUTES +
      HYDRATION_BREAK_ALLOWANCE_MINUTES +
      ET_FIGHT_BUFFER_MINUTES,
  "offset equals sum of constants",
);
assert(tournamentTimeEndOffsetMinutes() > 100, "offset is not flat +100 wall clock");

const endAt = tournamentTimeEndAt(FINAL_KICKOFF);
const endMs = new Date(endAt).getTime();
const kickoffMs = new Date(FINAL_KICKOFF).getTime();
assert(
  endMs - kickoffMs === 105 * 60_000,
  "tournamentTimeEndAt adds 105 minutes to Final kickoff",
);

const beforeEnd = computeTournamentTimePercent(
  endMs - 60_000,
  START_AT,
  endAt,
  { status: "LIVE" },
);
assert(beforeEnd.phase === "normal", "before endAt is normal");
assert(beforeEnd.percent < FINAL_OVERTIME_DISPLAY_PERCENT, "before endAt is linear");
assert(!beforeEnd.shouldShake, "no shake before endAt");

const overtime = computeTournamentTimePercent(endMs + 60_000, START_AT, endAt, {
  status: "LIVE",
});
assert(overtime.phase === "finalOvertime", "past endAt with live Final is finalOvertime");
assert(
  overtime.percent === FINAL_OVERTIME_DISPLAY_PERCENT,
  "overtime holds at nines",
);
assert(overtime.shouldShake, "overtime shakes");
assert(overtime.overtimeMs === 60_000, "overtimeMs tracks past endAt");

const earlyComplete = computeTournamentTimePercent(
  endMs - 30 * 60_000,
  START_AT,
  endAt,
  { status: "FT" },
);
assert(earlyComplete.phase === "complete", "Final finished before endAt");
assert(earlyComplete.percent === 100, "snaps to 100 when Final finishes early");

const lateComplete = computeTournamentTimePercent(
  endMs + 45 * 60_000,
  START_AT,
  endAt,
  { status: "PEN" },
);
assert(lateComplete.phase === "complete", "Final finished after overtime");
assert(lateComplete.percent === 100, "snaps to 100 after long ET/pens");

const shakeEarly = computeShakeMotion(15 * 60_000, 1_000_000);
const shakeLate = computeShakeMotion(45 * 60_000, 1_000_000);
const shakeMax = computeShakeMotion(90 * 60_000, 1_000_000);
const earlyMag = Math.hypot(shakeEarly.translateX, shakeEarly.translateY);
const lateMag = Math.hypot(shakeLate.translateX, shakeLate.translateY);
const maxMag = Math.hypot(shakeMax.translateX, shakeMax.translateY);
assert(lateMag >= earlyMag, "shake intensity increases at 45 min vs 15 min past endAt");
assert(maxMag <= 3.5, "shake displacement capped for readability");
assert(Math.abs(shakeMax.rotateDeg) <= 1.3, "rotation capped");

console.log("tournament-time.test.ts: all assertions passed");
