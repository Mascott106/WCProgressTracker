import {
  formatDateTime,
  formatDayLabel,
  isOffsetStyleTimeZoneName,
} from "./format-datetime";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const SAMPLE_ISO = "2026-06-28T19:00:00.000Z";

assert(isOffsetStyleTimeZoneName("GMT-3"), "GMT-3 should be offset style");
assert(isOffsetStyleTimeZoneName("GMT+9"), "GMT+9 should be offset style");
assert(isOffsetStyleTimeZoneName("UTC+2"), "UTC+2 should be offset style");
assert(!isOffsetStyleTimeZoneName("EDT"), "EDT should not be offset style");
assert(!isOffsetStyleTimeZoneName("BRT"), "BRT should not be offset style");

const cases: Array<{
  label: string;
  locale: string;
  timeZone: string;
  expect: (formatted: string) => boolean;
  reject?: RegExp;
}> = [
  {
    label: "US Eastern keeps EDT",
    locale: "en-US",
    timeZone: "America/New_York",
    expect: (s) => s.includes("EDT"),
    reject: /GMT/i,
  },
  {
    label: "Brasília en-US uses named zone",
    locale: "en-US",
    timeZone: "America/Sao_Paulo",
    expect: (s) => s.includes("São Paulo Time") || s.includes("Brasilia"),
    reject: /GMT-3/i,
  },
  {
    label: "Brasília pt-BR uses BRT",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    expect: (s) => s.includes("BRT"),
    reject: /GMT/i,
  },
  {
    label: "Tokyo en-US uses Japan Time",
    locale: "en-US",
    timeZone: "Asia/Tokyo",
    expect: (s) => s.includes("Japan Time"),
    reject: /GMT\+9/i,
  },
  {
    label: "London en-GB avoids bare offset",
    locale: "en-GB",
    timeZone: "Europe/London",
    expect: (s) =>
      s.includes("BST") ||
      s.includes("GMT") ||
      s.includes("British") ||
      s.includes("UK"),
    reject: /GMT\+1/i,
  },
  {
    label: "Sydney en-AU uses named or abbreviation",
    locale: "en-AU",
    timeZone: "Australia/Sydney",
    expect: (s) =>
      /AEST|AEDT|Sydney|Australia/i.test(s),
    reject: /GMT\+10/i,
  },
];

for (const { label, locale, timeZone, expect: expectFn, reject } of cases) {
  const formatted = formatDateTime(SAMPLE_ISO, {
    timeOnly: true,
    locale,
    timeZone,
  });
  assert(expectFn(formatted), `${label}: got "${formatted}"`);
  if (reject) {
    assert(!reject.test(formatted), `${label}: should not match ${reject}: "${formatted}"`);
  }
}

const dayLabel = formatDayLabel(SAMPLE_ISO, {
  locale: "en-US",
  timeZone: "America/Sao_Paulo",
});
assert(dayLabel.length > 0, "day label should not be empty");

console.log("format-datetime tests passed");
