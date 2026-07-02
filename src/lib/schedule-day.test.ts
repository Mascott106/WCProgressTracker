import {
  getScheduleDayWindow,
  getZonedParts,
  SCHEDULE_DAY_CUTOFF_HOUR,
  SCHEDULE_DAY_TIMEZONE,
  zonedWallTimeToUtc,
} from "./schedule-day";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// 2026-06-30 02:00 UTC = Jun 29 22:00 ET / Jun 29 23:00 BRT
const lateNightUtc = Date.UTC(2026, 5, 30, 2, 0);

const nyParts = getZonedParts(lateNightUtc, "America/New_York");
const spParts = getZonedParts(lateNightUtc, "America/Sao_Paulo");

assert(nyParts.hour === 22, `NY hour should be 22, got ${nyParts.hour}`);
assert(spParts.hour === 23, `SP hour should be 23, got ${spParts.hour}`);

const nyWindow = getScheduleDayWindow(lateNightUtc, 0, "America/New_York");
const spWindow = getScheduleDayWindow(lateNightUtc, 0, "America/Sao_Paulo");

assert(
  nyWindow.start !== spWindow.start,
  "schedule day start should differ between NY and São Paulo near midnight",
);

// Before 6 AM local rolls to previous schedule day
const beforeCutoff = zonedWallTimeToUtc(
  2026,
  6,
  30,
  5,
  0,
  "America/Sao_Paulo",
);
const spBeforeSix = getScheduleDayWindow(beforeCutoff, 0, "America/Sao_Paulo");
const spPartsAtCutoff = getZonedParts(spBeforeSix.start, "America/Sao_Paulo");

assert(
  spPartsAtCutoff.hour === SCHEDULE_DAY_CUTOFF_HOUR,
  `schedule day should start at ${SCHEDULE_DAY_CUTOFF_HOUR}:00 local`,
);

// Eastern default parameter unchanged for server bucketing
const defaultWindow = getScheduleDayWindow(lateNightUtc, 0);
const explicitNy = getScheduleDayWindow(lateNightUtc, 0, SCHEDULE_DAY_TIMEZONE);
assert(
  defaultWindow.start === explicitNy.start,
  "default timezone should remain America/New_York",
);

console.log("schedule-day tests passed");
