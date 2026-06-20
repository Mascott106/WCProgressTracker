/** Tournament schedule days roll over at 6 AM Eastern (handles EDT/EST). */
export const SCHEDULE_DAY_TIMEZONE = "America/New_York";
export const SCHEDULE_DAY_CUTOFF_HOUR = 6;

export interface EasternParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function getEasternParts(ms: number): EasternParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_DAY_TIMEZONE,
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

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number,
): Pick<EasternParts, "year" | "month" | "day"> {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function compareEasternParts(a: EasternParts, b: EasternParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day !== b.day) return a.day - b.day;
  if (a.hour !== b.hour) return a.hour - b.hour;
  return a.minute - b.minute;
}

/** UTC instant for a wall-clock time in America/New_York. */
export function easternWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): number {
  const target: EasternParts = { year, month, day, hour, minute };
  let lo = Date.UTC(year, month - 1, day - 1, 4, 0);
  let hi = Date.UTC(year, month - 1, day + 1, 12, 0);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (compareEasternParts(getEasternParts(mid), target) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/** Start/end of a schedule day (6 AM Eastern boundaries). */
export function getScheduleDayWindow(now: number, dayOffset: number) {
  const eastern = getEasternParts(now);
  let { year, month, day } = eastern;

  if (eastern.hour < SCHEDULE_DAY_CUTOFF_HOUR) {
    ({ year, month, day } = addCalendarDays(year, month, day, -1));
  }

  ({ year, month, day } = addCalendarDays(year, month, day, dayOffset));

  const start = easternWallTimeToUtc(
    year,
    month,
    day,
    SCHEDULE_DAY_CUTOFF_HOUR,
    0,
  );
  const nextDay = addCalendarDays(year, month, day, 1);
  const end = easternWallTimeToUtc(
    nextDay.year,
    nextDay.month,
    nextDay.day,
    SCHEDULE_DAY_CUTOFF_HOUR,
    0,
  );

  return {
    start,
    end,
    dateIso: new Date(start).toISOString(),
  };
}
