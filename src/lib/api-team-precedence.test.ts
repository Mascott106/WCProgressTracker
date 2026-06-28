import { applyApiTeamPrecedence } from "./api-team-precedence";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const base: MatchSummary = {
  id: 74,
  date: "2026-06-29T20:30:00.000Z",
  round: "Round of 32",
  status: "NS",
  statusLong: "Not Started",
  homeTeam: "Germany",
  awayTeam: "Third F",
  homeGoals: null,
  awayGoals: null,
  venue: "Gillette Stadium",
  city: "Boston",
  foxChannel: "FOX",
  onTubi: false,
  apiHomeTeam: "Germany",
  apiAwayTeam: "Uruguay",
};

const [corrected] = applyApiTeamPrecedence([base]);
assert(corrected!.awayTeam === "Uruguay", "API away team overrides computed Best 3rd");
assert(corrected!.homeTeam === "Germany", "API home unchanged when matching");

const homeMismatch: MatchSummary = {
  ...base,
  homeTeam: "Computed Winner",
  apiHomeTeam: "Germany",
};
const [homeFixed] = applyApiTeamPrecedence([homeMismatch]);
assert(homeFixed!.homeTeam === "Germany", "API home overrides computed winner");

console.log("api-team-precedence tests passed");
