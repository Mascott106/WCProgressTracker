import fixtures from "../data/fixtures.json";
import { buildBracket } from "./bracket";
import {
  buildKnockoutFeeders,
  collectBracketLeaves,
} from "./bracket-layout";
import { KNOCKOUT_START_MS } from "./knockout-schedule";
import type { FixturesFile, MatchSummary } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const fixtureFeeders = buildKnockoutFeeders(
  (fixtures as FixturesFile).matches.filter(
    (m) => m.id >= 73 && m.round !== "Third Place",
  ),
);
const leftLeaves = collectBracketLeaves(101, fixtureFeeders);
const rightLeaves = collectBracketLeaves(102, fixtureFeeders);

assert(fixtureFeeders.size === 15, `expected 15 feeder links, got ${fixtureFeeders.size}`);
assert(
  leftLeaves.length + rightLeaves.length === 16,
  `expected 16 R32 leaves, got ${leftLeaves.length + rightLeaves.length}`,
);

function withResolvedKnockoutTeams(): MatchSummary[] {
  return (fixtures as FixturesFile).matches.map((match) => {
    const summary: MatchSummary = {
      id: match.id,
      date: match.date,
      round: match.round,
      status: match.status ?? "NS",
      statusLong: match.status ?? "Not Started",
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
      venue: match.venue,
      city: match.city,
      foxChannel: "FOX",
      onTubi: false,
    };

    if (match.id === 73) {
      summary.status = "FT";
      summary.homeTeam = "Canada";
      summary.awayTeam = "South Africa";
      summary.homeGoals = 2;
      summary.awayGoals = 0;
    }
    if (match.id === 74) {
      summary.status = "FT";
      summary.homeTeam = "Paraguay";
      summary.awayTeam = "Ukraine";
      summary.homeGoals = 1;
      summary.awayGoals = 0;
    }
    if (match.id === 75) {
      summary.status = "FT";
      summary.homeTeam = "Morocco";
      summary.awayTeam = "Croatia";
      summary.homeGoals = 3;
      summary.awayGoals = 1;
    }
    if (match.id === 90) {
      summary.status = "FT";
      summary.homeTeam = "Canada";
      summary.awayTeam = "Morocco";
      summary.homeGoals = 1;
      summary.awayGoals = 0;
    }
    if (match.id === 89) {
      summary.homeTeam = "Paraguay";
      summary.awayTeam = "Match 77 Winner";
    }

    return summary;
  });
}

const bracket = buildBracket(withResolvedKnockoutTeams(), KNOCKOUT_START_MS + 1);
assert(bracket.knockoutTree !== null, "expected knockout tree");

const treeFeeders = new Map(
  bracket.knockoutTree!.feeders.map(
    ([id, home, away]) => [id, [home, away] as [number, number]],
  ),
);
const treeLeft = collectBracketLeaves(101, treeFeeders);
const treeRight = collectBracketLeaves(102, treeFeeders);
const treeLeaves = [...treeLeft, ...treeRight].sort((a, b) => a - b);

assert(
  treeFeeders.size === 15,
  `resolved summaries must not shrink feeder map (got ${treeFeeders.size})`,
);
assert(
  treeLeaves.length === 16 && treeLeaves[0] === 73 && treeLeaves[15] === 88,
  `expected all 16 R32 leaves in tree, got ${treeLeaves.join(",")}`,
);
assert(treeLeaves.includes(73), "M73 should remain a tree leaf");
assert(treeLeaves.includes(75), "M75 should remain a tree leaf");
assert(treeLeaves.includes(77), "M77 should remain a tree leaf");
assert(treeLeaves.includes(78), "M78 should remain a tree leaf");

console.log("bracket tests passed");
