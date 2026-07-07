import { KNOCKOUT_TIMELINE_ROUNDS } from "./knockout-schedule";
import { GROUP_STAGE_GAMES, roundShortName, TOTAL_GAMES } from "./types";

export interface MatchProgressStageMark {
  percent: number;
  shortName: string;
  round: string;
}

const KNOCKOUT_MATCH_COUNTS: Record<(typeof KNOCKOUT_TIMELINE_ROUNDS)[number], number> =
  {
    "Round of 32": 16,
    "Round of 16": 8,
    "Quarter-finals": 4,
    "Semi-finals": 2,
    "Third Place": 1,
    Final: 1,
  };

/** Vertical tick + label positions where each knockout round begins on the match bar. */
export function matchProgressStageMarks(
  totalGames = TOTAL_GAMES,
): MatchProgressStageMark[] {
  let completedBefore = GROUP_STAGE_GAMES;
  const marks: MatchProgressStageMark[] = [];

  for (const round of KNOCKOUT_TIMELINE_ROUNDS) {
    marks.push({
      percent: (completedBefore / totalGames) * 100,
      shortName: roundShortName(round),
      round,
    });
    completedBefore += KNOCKOUT_MATCH_COUNTS[round];
  }

  return marks;
}

export function matchProgressStageMarkPercents(
  totalGames = TOTAL_GAMES,
): number[] {
  return matchProgressStageMarks(totalGames).map((mark) => mark.percent);
}
