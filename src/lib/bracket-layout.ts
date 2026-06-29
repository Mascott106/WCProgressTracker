import { KNOCKOUT_ROUND_ORDER } from "./types";

export const FINAL_MATCH_ID = 104;

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

export interface BracketGridCell {
  matchId: number;
  rowStart: number;
  rowEnd: number;
  /** 0 = Round of 32 … 4 = Final */
  column: number;
}

export interface BracketGridLayout {
  rows: number;
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

export function buildBracketGridLayout(
  feeders: Map<number, [number, number]>,
  finalMatchId = FINAL_MATCH_ID,
): BracketGridLayout {
  const leaves = collectBracketLeaves(finalMatchId, feeders);
  const rows = leaves.length;
  const positions = new Map<number, { rowStart: number; rowEnd: number }>();

  leaves.forEach((id, index) => {
    positions.set(id, { rowStart: index + 1, rowEnd: index + 2 });
  });

  const depthCache = new Map<number, number>();
  const maxDepth = matchDepth(finalMatchId, feeders, depthCache);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const parents = [...feeders.keys()].filter(
      (id) => matchDepth(id, feeders, depthCache) === depth,
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

  const cells: BracketGridCell[] = [...positions.entries()].map(
    ([matchId, pos]) => ({
      matchId,
      rowStart: pos.rowStart,
      rowEnd: pos.rowEnd,
      column: matchDepth(matchId, feeders, depthCache),
    }),
  );

  return { rows, cells };
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
