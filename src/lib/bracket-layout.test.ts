import fixtures from "../data/fixtures.json";
import {
  BRACKET_COLUMNS,
  FINAL_COLUMN,
  buildBracketGridLayout,
  buildKnockoutFeeders,
  collectBracketLeaves,
} from "./bracket-layout";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const feeders = buildKnockoutFeeders(fixtures.matches);
const layout = buildBracketGridLayout(feeders);
const leftLeaves = collectBracketLeaves(101, feeders);
const rightLeaves = collectBracketLeaves(102, feeders);

assert(feeders.size === 15, `expected 15 feeder links, got ${feeders.size}`);
assert(leftLeaves.length === 8, `expected 8 left R32 leaves, got ${leftLeaves.length}`);
assert(rightLeaves.length === 8, `expected 8 right R32 leaves, got ${rightLeaves.length}`);
assert(layout.rows === 8, `expected 8 bracket rows, got ${layout.rows}`);
assert(layout.columns === BRACKET_COLUMNS, "expected 9 columns");

for (const [parent, [home, away]] of feeders) {
  if (home < 89 && away < 89) {
    const leaves =
      leftLeaves.includes(home) || leftLeaves.includes(away)
        ? leftLeaves
        : rightLeaves;
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
assert(m90.column === 1, "M90 should be in the left R16 column");
assert(m90.side === "left", "M90 should be on the left half");

const m88 = layout.cells.find((cell) => cell.matchId === 88)!;
assert(m88.column === 8, "M88 should be in the right R32 column");
assert(m88.side === "right", "M88 should be on the right half");

const m101 = layout.cells.find((cell) => cell.matchId === 101)!;
const m102 = layout.cells.find((cell) => cell.matchId === 102)!;
assert(m101.column === 3, "Left semi should sit left of the final");
assert(m102.column === 5, "Right semi should sit right of the final");

const m104 = layout.cells.find((cell) => cell.matchId === 104)!;
assert(m104.column === FINAL_COLUMN, "Final should be centered");
assert(m104.side === "center", "Final should be in the center");
assert(m104.rowEnd - m104.rowStart === 8, "Final should span the full bracket height");

console.log("bracket-layout tests passed");
