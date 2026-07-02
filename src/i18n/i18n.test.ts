import { getMessage } from "./get-message";
import { resolveLocale } from "./resolve-locale";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(resolveLocale("fr-FR") === "fr", "fr-FR → fr");
assert(resolveLocale("fr-CA") === "fr", "fr-CA → fr");
assert(resolveLocale("de-DE") === "de", "de-DE → de");
assert(resolveLocale("pt-BR") === "pt-BR", "pt-BR → pt-BR");
assert(resolveLocale("pt") === "pt-BR", "pt → pt-BR");
assert(resolveLocale("ja-JP") === "en", "ja-JP → en");

assert(
  getMessage("fr", "schedule.today", { nerd: false }) === "Reste de la journée",
  "fr schedule.today normal",
);
assert(
  getMessage("de", "schedule.matchCount", { count: 1 }) === "(1 Spiel)",
  "de matchCount one",
);
assert(
  getMessage("de", "schedule.matchCount", { count: 3 }) === "(3 Spiele)",
  "de matchCount other",
);
assert(
  getMessage("fr", "schedule.matchCount", { count: 1 }) === "(1 match)",
  "fr matchCount one",
);

console.log("i18n.test.ts passed");
