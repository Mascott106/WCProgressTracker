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
assert(layout.rows === 32, `expected 32 bracket rows, got ${layout.rows}`);
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
assert(m104.rowEnd - m104.rowStart === 32, "Final should span the full bracket height");

const r32Ids = layout.cells
  .filter((cell) => cell.column === 0 || cell.column === 8)
  .map((cell) => cell.matchId)
  .sort((a, b) => a - b);
assert(
  r32Ids.length === 16 && r32Ids[0] === 73 && r32Ids[15] === 88,
  `expected all 16 R32 matches in outer columns, got ${r32Ids.join(",")}`,
);

const leftR32Ids = layout.cells
  .filter((cell) => cell.column === 0)
  .sort((a, b) => a.rowStart - b.rowStart)
  .map((cell) => cell.matchId);
assert(
  leftR32Ids.join(",") === leftLeaves.join(","),
  `left R32 order should match bracket leaves, got ${leftR32Ids.join(",")}`,
);

const innerIds = new Set(
  layout.cells
    .filter((cell) => cell.column > 0 && cell.column < 8)
    .map((cell) => cell.matchId),
);
for (let id = 89; id <= 102; id++) {
  assert(innerIds.has(id), `M${id} should appear in an inner bracket column`);
}

function rowsOverlap(
  a: { rowStart: number; rowEnd: number },
  b: { rowStart: number; rowEnd: number },
): boolean {
  return a.rowStart < b.rowEnd && b.rowStart < a.rowEnd;
}

for (let col = 0; col < BRACKET_COLUMNS; col++) {
  const colCells = layout.cells.filter((cell) => cell.column === col);
  for (let i = 0; i < colCells.length; i++) {
    for (let j = i + 1; j < colCells.length; j++) {
      assert(
        !rowsOverlap(colCells[i], colCells[j]),
        `column ${col}: M${colCells[i].matchId} (${colCells[i].rowStart}-${colCells[i].rowEnd}) overlaps M${colCells[j].matchId} (${colCells[j].rowStart}-${colCells[j].rowEnd})`,
      );
    }
  }
}

const cellIds = layout.cells.map((cell) => cell.matchId);
const duplicateIds = cellIds.filter((id, index) => cellIds.indexOf(id) !== index);
assert(duplicateIds.length === 0, `duplicate layout cells: ${duplicateIds.join(",")}`);

console.log("bracket-layout tests passed");
