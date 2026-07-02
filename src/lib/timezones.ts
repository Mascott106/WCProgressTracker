import { isOffsetStyleTimeZoneName } from "./format-datetime";

/** Curated IANA zones for the footer picker (2026 host region + major viewer zones). */
export const PICKER_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/Mexico_City",
  "America/Tijuana",
  "America/Cancun",
  "America/Monterrey",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Lisbon",
  "Europe/Amsterdam",
  "Europe/Moscow",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export type PickerTimeZone = (typeof PICKER_TIMEZONES)[number];

export const TIMEZONE_AUTO = "auto" as const;
export type TimeZoneSelection = typeof TIMEZONE_AUTO | PickerTimeZone;

/** Mid-tournament instant for picker labels (US hosts observe DST in June 2026). */
export const TOURNAMENT_TZ_REFERENCE_MS = Date.UTC(2026, 5, 15, 17, 0);

const PICKER_SET = new Set<string>(PICKER_TIMEZONES);

export function isPickerTimeZone(value: string): value is PickerTimeZone {
  return PICKER_SET.has(value);
}

export function parseStoredTimeZone(value: string | null): TimeZoneSelection {
  if (!value || value === TIMEZONE_AUTO) return TIMEZONE_AUTO;
  if (isPickerTimeZone(value)) return value;
  return TIMEZONE_AUTO;
}

function toDate(at: Date | number): Date {
  return typeof at === "number" ? new Date(at) : at;
}

function getTimeZoneNamePart(
  timeZone: string,
  at: Date,
  locale: string,
  timeZoneName: NonNullable<Intl.DateTimeFormatOptions["timeZoneName"]>,
): string | undefined {
  return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
}

/**
 * DST-aware label suffix: prefers "EDT"/"BST" over bare "GMT-4" when Intl provides a name.
 * Falls back to numeric offset for zones that only expose offsets.
 */
export function formatTimeZoneSuffix(
  timeZone: string,
  locale: string,
  at: Date | number = new Date(),
): string {
  const date = toDate(at);

  for (const style of ["short", "shortGeneric", "longGeneric"] as const) {
    const name = getTimeZoneNamePart(timeZone, date, locale, style);
    if (name && !isOffsetStyleTimeZoneName(name)) {
      return name;
    }
  }

  return getTimeZoneNamePart(timeZone, date, locale, "shortOffset") ?? "UTC";
}

/** Dropdown label: city name + DST-aware suffix at the given instant. */
export function formatTimeZonePickerLabel(
  timeZone: string,
  locale: string,
  at: Date | number = TOURNAMENT_TZ_REFERENCE_MS,
): string {
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  return `${city} (${formatTimeZoneSuffix(timeZone, locale, at)})`;
}

/** Short code for the footer select (abbreviation or offset at `at`). */
export function timeZonePickerCode(
  timeZone: string,
  locale: string,
  at: Date | number = new Date(),
): string {
  return formatTimeZoneSuffix(timeZone, locale, at).replace(/\s/g, "");
}

/** True when the suffix differs between winter and summer (observes DST). */
export function timeZoneObservesDst(
  timeZone: string,
  locale: string = "en-US",
): boolean {
  if (timeZone === "UTC") return false;
  const winter = formatTimeZoneSuffix(
    timeZone,
    locale,
    Date.UTC(2026, 0, 15, 12, 0),
  );
  const summer = formatTimeZoneSuffix(
    timeZone,
    locale,
    TOURNAMENT_TZ_REFERENCE_MS,
  );
  return winter !== summer;
}
