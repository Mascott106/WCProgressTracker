import { applyGroupPlaceholders, parseApiStandings, bestThirdSideForMatch, apiTeamForBestThirdSlot, apiTeamForBestThirdSide, winnerGroupForBestThirdMatch } from "./group-standings";
import type { MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const parsed = parseApiStandings([
  {
    type: "HOME",
    group: "GROUP_A",
    table: [
      {
        position: 1,
        team: { name: "Wrong Table" },
        playedGames: 1,
        points: 3,
        goalsFor: 1,
        goalsAgainst: 0,
        goalDifference: 1,
      },
    ],
  },
  {
    type: "TOTAL",
    group: "GROUP_A",
    table: [
      {
        position: 2,
        team: { name: "South Africa" },
        playedGames: 3,
        points: 4,
        goalsFor: 3,
        goalsAgainst: 4,
        goalDifference: -1,
      },
      {
        position: 1,
        team: { name: "Mexico" },
        playedGames: 3,
        points: 7,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
      },
    ],
  },
]);

assert(parsed.A?.[0]?.team === "Mexico", "winner is position 1");
assert(parsed.A?.[1]?.team === "South Africa", "runner-up is position 2");

const knockout: MatchSummary = {
  id: 73,
  date: "2026-06-28T19:00:00.000Z",
  round: "Round of 32",
  status: "NS",
  statusLong: "Not Started",
  homeTeam: "Group A Runners Up",
  awayTeam: "Group B Runners Up",
  homeGoals: null,
  awayGoals: null,
  venue: "SoFi Stadium",
  city: "Inglewood",
  foxChannel: "FOX",
  onTubi: false,
};

const [resolved] = applyGroupPlaceholders([knockout], {
  apiStandings: {
    A: parsed.A!,
    B: [
      {
        team: "Switzerland",
        played: 3,
        points: 7,
        gf: 6,
        ga: 2,
        gd: 4,
      },
      {
        team: "Canada",
        played: 3,
        points: 6,
        gf: 5,
        ga: 3,
        gd: 2,
      },
    ],
  },
});

assert(resolved!.homeTeam === "South Africa", "API standings resolve runner-up");
assert(resolved!.awayTeam === "Canada", "API standings resolve group B runner-up");

assert(bestThirdSideForMatch(74) === "away", "match 74 Best 3rd on away");
assert(winnerGroupForBestThirdMatch(74) === "E", "match 74 faces group E winner");

const awaySlotMatch: MatchSummary = {
  id: 74,
  date: "2026-06-29T20:30:00.000Z",
  round: "Round of 32",
  status: "NS",
  statusLong: "Not Started",
  homeTeam: "Germany",
  awayTeam: "Best 3rd (A/B/C/D/F)",
  homeGoals: null,
  awayGoals: null,
  venue: "Gillette Stadium",
  city: "Boston",
  foxChannel: "FOX",
  onTubi: false,
  apiHomeTeam: "Germany",
  apiAwayTeam: "Scotland",
};
assert(
  apiTeamForBestThirdSlot(awaySlotMatch) === "Scotland",
  "away-side Best 3rd uses apiAwayTeam",
);
assert(
  apiTeamForBestThirdSide("home", "Scotland", "Germany") === "Scotland",
  "home-side Best 3rd uses apiHomeTeam",
);
assert(
  apiTeamForBestThirdSide("away", "Germany", "Scotland") === "Scotland",
  "away-side Best 3rd uses apiAwayTeam",
);

for (const id of [74, 77, 79, 80, 81, 82, 85, 87]) {
  assert(bestThirdSideForMatch(id) === "away", `match ${id} Best 3rd on away`);
}

const homeSlotMatch: MatchSummary = {
  ...awaySlotMatch,
  id: 999,
  homeTeam: "Best 3rd (A/B/C/D/F)",
  awayTeam: "Group E Winners",
  apiHomeTeam: "Scotland",
  apiAwayTeam: "Germany",
};
assert(
  apiTeamForBestThirdSlot(homeSlotMatch) === null,
  "unknown match id has no Best 3rd slot",
);

console.log("group-standings tests passed");
