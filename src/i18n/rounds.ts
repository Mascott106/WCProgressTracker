import { getMessage } from "./get-message";
import type { SupportedLocale } from "./resolve-locale";

const ROUND_KEYS: Record<string, string> = {
  "Round of 32": "rounds.roundOf32",
  "Round of 16": "rounds.roundOf16",
  "Quarter-finals": "rounds.quarterFinals",
  "Semi-finals": "rounds.semiFinals",
  "Third Place": "rounds.thirdPlace",
  Final: "rounds.final",
};

/** Translate API round names for display. Short codes (R32) pass through unchanged. */
export function translateRoundName(
  round: string,
  locale: SupportedLocale,
): string {
  const direct = ROUND_KEYS[round];
  if (direct) {
    return getMessage(locale, direct);
  }
  const groupInParens = round.match(/\(Group ([A-L])\)/);
  if (groupInParens) {
    return `${getMessage(locale, "schedule.groupPrefix")}${groupInParens[1]}`;
  }
  if (round.startsWith("Group Stage - ")) {
    const group = round.replace("Group Stage - ", "");
    return `${getMessage(locale, "schedule.groupPrefix")}${group}`;
  }
  return round;
}
