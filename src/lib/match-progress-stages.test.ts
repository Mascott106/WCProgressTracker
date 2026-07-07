import {
  matchProgressStageMarkPercents,
  matchProgressStageMarks,
} from "./match-progress-stages";
import { matchProgressKnockoutPercent } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const marks = matchProgressStageMarks();
const percents = matchProgressStageMarkPercents();

assert(marks.length === 6, "six knockout round boundaries");
assert(
  marks[0]!.shortName === "R32" && marks[0]!.percent === matchProgressKnockoutPercent(),
  "first mark is R32 at group-stage end",
);
assert(marks[1]!.shortName === "R16", "R16 mark");
assert(marks[2]!.shortName === "QF", "QF mark");
assert(marks[3]!.shortName === "SF", "SF mark");
assert(marks[4]!.shortName === "3rd", "Third Place mark");
assert(marks[5]!.shortName === "Final", "Final mark");
assert(
  Math.abs(marks[5]!.percent - (103 / 104) * 100) < 0.001,
  "Final begins after 103 prior matches",
);
assert(percents.length === marks.length, "percent helper matches marks");
assert(!percents.includes(25) && !percents.includes(75), "no legacy 25/75 ticks");

console.log("match-progress-stages.test.ts: all assertions passed");
