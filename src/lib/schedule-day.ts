/** Tournament schedule days roll over at 6 AM local (handles DST per zone). */
export const SCHEDULE_DAY_TIMEZONE = "America/New_York";
export const SCHEDULE_DAY_CUTOFF_HOUR = 6;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** @deprecated Use getZonedParts(ms, SCHEDULE_DAY_TIMEZONE) */
export type EasternParts = ZonedParts;

export function getZonedParts(ms: number, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  let hour = get("hour");
  if (hour === 24) hour = 0;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

/** @deprecated Use getZonedParts */
export function getEasternParts(ms: number): ZonedParts {
  return getZonedParts(ms, SCHEDULE_DAY_TIMEZONE);
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number,
): Pick<ZonedParts, "year" | "month" | "day"> {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function compareZonedParts(a: ZonedParts, b: ZonedParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day !== b.day) return a.day - b.day;
  if (a.hour !== b.hour) return a.hour - b.hour;
  return a.minute - b.minute;
}

/** UTC instant for a wall-clock time in the given IANA timezone. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const target: ZonedParts = { year, month, day, hour, minute };
  let lo = Date.UTC(year, month - 1, day - 1, 4, 0);
  let hi = Date.UTC(year, month - 1, day + 1, 12, 0);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (compareZonedParts(getZonedParts(mid, timeZone), target) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/** @deprecated Use zonedWallTimeToUtc(..., SCHEDULE_DAY_TIMEZONE) */
export function easternWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): number {
  return zonedWallTimeToUtc(year, month, day, hour, minute, SCHEDULE_DAY_TIMEZONE);
}

/** Start/end of a schedule day (6 AM boundaries in the given timezone). */
export function getScheduleDayWindow(
  now: number,
  dayOffset: number,
  timeZone: string = SCHEDULE_DAY_TIMEZONE,
) {
  const zoned = getZonedParts(now, timeZone);
  let { year, month, day } = zoned;

  if (zoned.hour < SCHEDULE_DAY_CUTOFF_HOUR) {
    ({ year, month, day } = addCalendarDays(year, month, day, -1));
  }

  ({ year, month, day } = addCalendarDays(year, month, day, dayOffset));

  const start = zonedWallTimeToUtc(
    year,
    month,
    day,
    SCHEDULE_DAY_CUTOFF_HOUR,
    0,
    timeZone,
  );
  const nextDay = addCalendarDays(year, month, day, 1);
  const end = zonedWallTimeToUtc(
    nextDay.year,
    nextDay.month,
    nextDay.day,
    SCHEDULE_DAY_CUTOFF_HOUR,
    0,
    timeZone,
  );

  return {
    start,
    end,
    dateIso: new Date(start).toISOString(),
  };
}
