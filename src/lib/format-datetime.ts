const DEFAULT_LOCALE = "en-US";

const DATE_TIME_BASE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const TIME_BASE: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

const DATE_ONLY_BASE: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

const DAY_LABEL_BASE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export interface FormatDateTimeOptions {
  timeOnly?: boolean;
  dateOnly?: boolean;
  locale?: string;
  timeZone?: string;
}

let viewerLocaleOverride: string | null = null;

/** Set by LocaleProvider so datetime formatting matches the language picker. */
export function setViewerLocaleOverride(locale: string | null): void {
  viewerLocaleOverride = locale;
}

/** Browser locale from language settings; safe on server (falls back). */
export function getViewerLocale(): string {
  if (viewerLocaleOverride) {
    return viewerLocaleOverride;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return DEFAULT_LOCALE;
}

/** IANA timezone from OS settings; safe on server (falls back to UTC). */
export function getViewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

export function isOffsetStyleTimeZoneName(name: string | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (/^(GMT|UTC)/i.test(trimmed)) return true;
  return /^[+-]\d/.test(trimmed);
}

function getTimeZoneNamePart(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string | undefined {
  return new Intl.DateTimeFormat(locale, options)
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
}

function pickTimeZoneNameStyle(
  date: Date,
  locale: string,
  timeZone: string | undefined,
  base: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  const withZone = { ...base, ...(timeZone ? { timeZone } : {}) };
  const shortName = getTimeZoneNamePart(date, locale, {
    ...withZone,
    timeZoneName: "short",
  });

  if (!isOffsetStyleTimeZoneName(shortName)) {
    return { ...withZone, timeZoneName: "short" };
  }

  const genericName = getTimeZoneNamePart(date, locale, {
    ...withZone,
    timeZoneName: "shortGeneric",
  });
  if (genericName && !isOffsetStyleTimeZoneName(genericName)) {
    return { ...withZone, timeZoneName: "shortGeneric" };
  }

  return { ...withZone, timeZoneName: "longGeneric" };
}

/** Format an ISO timestamp for the viewer's locale and timezone. */
export function formatDateTime(
  iso: string,
  options: FormatDateTimeOptions = {},
): string {
  const date = new Date(iso);
  const locale = options.locale ?? getViewerLocale();
  const timeZone = options.timeZone;

  if (options.dateOnly) {
    return new Intl.DateTimeFormat(locale, {
      ...DATE_ONLY_BASE,
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  }

  const base = options.timeOnly ? TIME_BASE : DATE_TIME_BASE;
  const formatOptions = pickTimeZoneNameStyle(date, locale, timeZone, base);
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/** Long weekday date for schedule headings in the viewer's timezone. */
export function formatDayLabel(
  iso: string,
  options: { locale?: string; timeZone?: string } = {},
): string {
  const date = new Date(iso);
  const locale = options.locale ?? getViewerLocale();
  const timeZone = options.timeZone;

  return new Intl.DateTimeFormat(locale, {
    ...DAY_LABEL_BASE,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}
