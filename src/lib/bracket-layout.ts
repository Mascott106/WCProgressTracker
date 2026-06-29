import { KNOCKOUT_ROUND_ORDER } from "./types";

export const FINAL_MATCH_ID = 104;
export const BRACKET_COLUMNS = 9;
export const FINAL_COLUMN = 4;

const WINNER_RE = /^Match (\d+) Winner$/;

export function parseWinnerFeeder(label: string): number | null {
  const m = label.match(WINNER_RE);
  return m ? Number(m[1]) : null;
}

export function buildKnockoutFeeders(
  matches: { id: number; homeTeam: string; awayTeam: string }[],
): Map<number, [number, number]> {
  const map = new Map<number, [number, number]>();
  for (const match of matches) {
    const home = parseWinnerFeeder(match.homeTeam);
    const away = parseWinnerFeeder(match.awayTeam);
    if (home !== null && away !== null) {
      map.set(match.id, [home, away]);
    }
  }
  return map;
}

/** Depth-first leaf order so each sibling pair is vertically adjacent. */
export function collectBracketLeaves(
  matchId: number,
  feeders: Map<number, [number, number]>,
): number[] {
  const pair = feeders.get(matchId);
  if (!pair) return [matchId];
  const [homeFeeder, awayFeeder] = pair;
  return [
    ...collectBracketLeaves(homeFeeder, feeders),
    ...collectBracketLeaves(awayFeeder, feeders),
  ];
}

export type BracketSide = "left" | "right" | "center";

export interface BracketGridCell {
  matchId: number;
  rowStart: number;
  rowEnd: number;
  /** 0–8: R32 … SF | Final | SF … R32 */
  column: number;
  side: BracketSide;
}

export interface BracketGridLayout {
  rows: number;
  columns: number;
  cells: BracketGridCell[];
}

function matchDepth(
  matchId: number,
  feeders: Map<number, [number, number]>,
  cache: Map<number, number>,
): number {
  const cached = cache.get(matchId);
  if (cached !== undefined) return cached;

  const pair = feeders.get(matchId);
  if (!pair) {
    cache.set(matchId, 0);
    return 0;
  }

  const depth =
    Math.max(
      matchDepth(pair[0], feeders, cache),
      matchDepth(pair[1], feeders, cache),
    ) + 1;
  cache.set(matchId, depth);
  return depth;
}

function collectSubtreeMatchIds(
  matchId: number,
  feeders: Map<number, [number, number]>,
): Set<number> {
  const ids = new Set<number>();
  const walk = (id: number) => {
    ids.add(id);
    const pair = feeders.get(id);
    if (pair) {
      walk(pair[0]);
      walk(pair[1]);
    }
  };
  walk(matchId);
  return ids;
}

function buildHalfGridPositions(
  semiFinalId: number,
  feeders: Map<number, [number, number]>,
): Map<number, { rowStart: number; rowEnd: number }> {
  const leaves = collectBracketLeaves(semiFinalId, feeders);
  const positions = new Map<number, { rowStart: number; rowEnd: number }>();
  const subtree = collectSubtreeMatchIds(semiFinalId, feeders);
  const depthCache = new Map<number, number>();

  // Four grid tracks per R32 slot — pairs stay adjacent, cards get enough height.
  leaves.forEach((id, index) => {
    positions.set(id, { rowStart: 4 * index + 1, rowEnd: 4 * index + 5 });
  });

  const maxDepth = matchDepth(semiFinalId, feeders, depthCache);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const parents = [...subtree].filter(
      (id) => feeders.has(id) && matchDepth(id, feeders, depthCache) === depth,
    );
    parents.sort((a, b) => {
      const aHome = feeders.get(a)![0];
      const bHome = feeders.get(b)![0];
      return positions.get(aHome)!.rowStart - positions.get(bHome)!.rowStart;
    });

    for (const parent of parents) {
      const [homeFeeder, awayFeeder] = feeders.get(parent)!;
      const homePos = positions.get(homeFeeder)!;
      const awayPos = positions.get(awayFeeder)!;
      positions.set(parent, {
        rowStart: homePos.rowStart,
        rowEnd: awayPos.rowEnd,
      });
    }
  }

  return positions;
}

/** Split bracket: left half | Final | right half (mirrored). */
export function buildBracketGridLayout(
  feeders: Map<number, [number, number]>,
  finalMatchId = FINAL_MATCH_ID,
): BracketGridLayout {
  const finalPair = feeders.get(finalMatchId);
  if (!finalPair) {
    return { rows: 0, columns: BRACKET_COLUMNS, cells: [] };
  }

  const [leftSemi, rightSemi] = finalPair;
  const leftPositions = buildHalfGridPositions(leftSemi, feeders);
  const rightPositions = buildHalfGridPositions(rightSemi, feeders);
  const rows = collectBracketLeaves(leftSemi, feeders).length * 4;
  const depthCache = new Map<number, number>();
  const cells: BracketGridCell[] = [];

  for (const [matchId, pos] of leftPositions) {
    const depth = matchDepth(matchId, feeders, depthCache);
    cells.push({
      matchId,
      rowStart: pos.rowStart,
      rowEnd: pos.rowEnd,
      column: depth,
      side: "left",
    });
  }

  for (const [matchId, pos] of rightPositions) {
    const depth = matchDepth(matchId, feeders, depthCache);
    cells.push({
      matchId,
      rowStart: pos.rowStart,
      rowEnd: pos.rowEnd,
      column: BRACKET_COLUMNS - 1 - depth,
      side: "right",
    });
  }

  const leftSemiPos = leftPositions.get(leftSemi)!;
  const rightSemiPos = rightPositions.get(rightSemi)!;
  cells.push({
    matchId: finalMatchId,
    rowStart: Math.min(leftSemiPos.rowStart, rightSemiPos.rowStart),
    rowEnd: Math.max(leftSemiPos.rowEnd, rightSemiPos.rowEnd),
    column: FINAL_COLUMN,
    side: "center",
  });

  return { rows, columns: BRACKET_COLUMNS, cells };
}

export const BRACKET_ROUND_LABELS = KNOCKOUT_ROUND_ORDER.map((name) => {
  switch (name) {
    case "Round of 32":
      return "R32";
    case "Round of 16":
      return "R16";
    case "Quarter-finals":
      return "QF";
    case "Semi-finals":
      return "SF";
    case "Final":
      return "Final";
    default:
      return name;
  }
});

/** Column headers for the split bracket grid. */
export const BRACKET_SPLIT_LABELS = [
  "R32",
  "R16",
  "QF",
  "SF",
  "Final",
  "SF",
  "QF",
  "R16",
  "R32",
] as const;
