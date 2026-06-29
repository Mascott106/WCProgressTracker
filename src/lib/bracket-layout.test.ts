import fixtures from "../data/fixtures.json";
import {
  buildBracketGridLayout,
  buildKnockoutFeeders,
  collectBracketLeaves,
} from "./bracket-layout";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const feeders = buildKnockoutFeeders(fixtures.matches);
const leaves = collectBracketLeaves(104, feeders);
const layout = buildBracketGridLayout(feeders);

assert(leaves.length === 16, `expected 16 R32 leaves, got ${leaves.length}`);
assert(feeders.size === 15, `expected 15 feeder links, got ${feeders.size}`);

for (const [parent, [home, away]] of feeders) {
  if (home < 89 && away < 89) {
    assert(
      leaves.indexOf(home) + 1 === leaves.indexOf(away),
      `R16 M${parent} feeders M${home} and M${away} should be adjacent in bracket order`,
    );
  }
}

const m90 = layout.cells.find((cell) => cell.matchId === 90)!;
const m73 = layout.cells.find((cell) => cell.matchId === 73)!;
const m75 = layout.cells.find((cell) => cell.matchId === 75)!;

assert(m90.rowStart === m73.rowStart, "M90 should align with M73");
assert(m90.rowEnd === m75.rowEnd, "M90 should span through M75");
assert(m90.column === 1, "M90 should be in the R16 column");

const m104 = layout.cells.find((cell) => cell.matchId === 104)!;
assert(m104.column === 4, "Final should be in the last column");
assert(m104.rowEnd - m104.rowStart === 16, "Final should span the full bracket height");

console.log("bracket-layout tests passed");
