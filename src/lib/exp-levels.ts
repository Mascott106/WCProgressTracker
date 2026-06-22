/** Cumulative EXP thresholds from exp-levels.txt (Lv 1 = 0 … Lv 99 = 2,452,783). */
export const LEVEL_EXP_THRESHOLDS: readonly number[] = [
  0, 6, 33, 94, 202, 372, 616, 949, 1384, 1934, 2614, 3588, 4610, 5809, 7200,
  8797, 10614, 12665, 14965, 17528, 20368, 24161, 27694, 31555, 35759, 40321,
  45255, 50576, 56299, 62438, 69008, 77066, 84643, 92701, 101255, 110320,
  119910, 130040, 140725, 151980, 163820, 176259, 189312, 202994, 217320,
  232305, 247963, 264309, 281358, 299125, 317625, 336872, 356881, 377667,
  399245, 421630, 444836, 468878, 493771, 519530, 546170, 581467, 610297,
  640064, 670784, 702471, 735141, 768808, 803488, 839195, 875945, 913752,
  952632, 992599, 1033669, 1075856, 1119176, 1163643, 1209273, 1256080,
  1304080, 1389359, 1441133, 1494178, 1548509, 1604141, 1661090, 1719371,
  1778999, 1839990, 1902360, 1966123, 2031295, 2097892, 2165929, 2235421,
  2306384, 2378833, 2452783,
] as const;

export const MAX_LEVEL = LEVEL_EXP_THRESHOLDS.length;
export const MAX_LEVEL_EXP = LEVEL_EXP_THRESHOLDS[MAX_LEVEL - 1]!;

export interface LevelProgress {
  level: number;
  totalExp: number;
  expInLevel: number;
  expToNextLevel: number;
  levelFillPercent: number;
  isMaxLevel: boolean;
}

function clampPercent(percent: number): number {
  return Math.min(100, Math.max(0, percent));
}

export function percentToTotalExp(percent: number): number {
  return Math.floor((clampPercent(percent) / 100) * MAX_LEVEL_EXP);
}

export function expToLevelProgress(totalExp: number): LevelProgress {
  const exp = Math.min(Math.max(0, Math.floor(totalExp)), MAX_LEVEL_EXP);

  let level = 1;
  for (let i = LEVEL_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_EXP_THRESHOLDS[i]!) {
      level = i + 1;
      break;
    }
  }

  const isMaxLevel = level >= MAX_LEVEL;
  const expAtLevel = LEVEL_EXP_THRESHOLDS[level - 1]!;

  if (isMaxLevel) {
    return {
      level: MAX_LEVEL,
      totalExp: exp,
      expInLevel: exp - expAtLevel,
      expToNextLevel: 0,
      levelFillPercent: 100,
      isMaxLevel: true,
    };
  }

  const expAtNext = LEVEL_EXP_THRESHOLDS[level]!;
  const expInLevel = exp - expAtLevel;
  const expToNextLevel = expAtNext - expAtLevel;
  const levelFillPercent =
    expToNextLevel > 0 ? (expInLevel / expToNextLevel) * 100 : 0;

  return {
    level,
    totalExp: exp,
    expInLevel,
    expToNextLevel,
    levelFillPercent,
    isMaxLevel: false,
  };
}

export function percentToLevelProgress(percent: number): LevelProgress {
  return expToLevelProgress(percentToTotalExp(percent));
}

export function formatExp(value: number): string {
  return value.toLocaleString("en-US");
}
