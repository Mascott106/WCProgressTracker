import { applyGroupPlaceholders, parseApiStandings } from "./group-standings";
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

console.log("group-standings tests passed");
