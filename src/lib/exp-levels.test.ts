import {
  MAX_LEVEL_EXP,
  expToLevelProgress,
  percentToLevelProgress,
} from "./exp-levels";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const at0 = percentToLevelProgress(0);
assert(at0.level === 1, "0% should be Lv 1");
assert(at0.totalExp === 0, "0% should be 0 EXP");

const at100 = percentToLevelProgress(100);
assert(at100.level === 99, "100% should be Lv 99");
assert(at100.totalExp === MAX_LEVEL_EXP, "100% should be max EXP");
assert(at100.isMaxLevel, "100% should be max level");

const at50Exp = expToLevelProgress(299125);
assert(at50Exp.level === 50, `299125 EXP should be Lv 50, got ${at50Exp.level}`);

const mid = percentToLevelProgress(50);
assert(mid.level > 1 && mid.level < 99, "50% should be between Lv 1 and 99");

const level2 = expToLevelProgress(6);
assert(level2.level === 2, "6 EXP should be Lv 2");

console.log("exp-levels tests passed");
