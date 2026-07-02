import {
  formatTimeZonePickerLabel,
  formatTimeZoneSuffix,
  timeZoneObservesDst,
  TOURNAMENT_TZ_REFERENCE_MS,
} from "./timezones";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const locale = "en-US";
const ny = "America/New_York";
const phoenix = "America/Phoenix";

const winterMs = Date.UTC(2026, 0, 15, 12, 0);
const summerMs = TOURNAMENT_TZ_REFERENCE_MS;

const nyWinter = formatTimeZoneSuffix(ny, locale, winterMs);
const nySummer = formatTimeZoneSuffix(ny, locale, summerMs);

assert(nyWinter !== nySummer, "New York suffix should differ between winter and summer");
assert(
  nySummer.includes("DT") || nySummer.includes("-4"),
  `NY summer suffix should reflect EDT, got ${nySummer}`,
);
assert(
  nyWinter.includes("ST") || nyWinter.includes("-5"),
  `NY winter suffix should reflect EST, got ${nyWinter}`,
);

assert(
  !timeZoneObservesDst(phoenix, locale),
  "Phoenix should not observe DST",
);

const nyLabel = formatTimeZonePickerLabel(ny, locale, summerMs);
assert(
  nyLabel.startsWith("New York ("),
  `picker label should include city, got ${nyLabel}`,
);

console.log("timezones.test.ts passed");
