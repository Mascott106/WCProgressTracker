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

const PICKER_SET = new Set<string>(PICKER_TIMEZONES);

export function isPickerTimeZone(value: string): value is PickerTimeZone {
  return PICKER_SET.has(value);
}

export function parseStoredTimeZone(value: string | null): TimeZoneSelection {
  if (!value || value === TIMEZONE_AUTO) return TIMEZONE_AUTO;
  if (isPickerTimeZone(value)) return value;
  return TIMEZONE_AUTO;
}

function formatUtcOffset(timeZone: string, at: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;

  return parts ?? "UTC";
}

/** Dropdown label: city name + current offset. */
export function formatTimeZonePickerLabel(
  timeZone: string,
  locale: string,
  at: Date = new Date(),
): string {
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  const offset = formatUtcOffset(timeZone, at, locale);
  return `${city} (${offset})`;
}

/** Short code shown in the closed select when a manual zone is chosen. */
export function timeZonePickerCode(timeZone: string, locale: string): string {
  const offset = formatUtcOffset(timeZone, new Date(), locale);
  return offset.replace(/\s/g, "");
}
