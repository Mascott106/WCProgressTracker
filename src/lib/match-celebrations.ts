import type { MatchSummary, ProgressData } from "./types";

/** True when a match that was live is now in Last Completed (and no longer live). */
export function hasLiveToLastCompletedTransition(
  prevLiveIds: number[],
  liveMatches: MatchSummary[],
  lastCompleted: MatchSummary[],
): boolean {
  const prevLive = new Set(prevLiveIds);
  const currLive = new Set(liveMatches.map((m) => m.id));

  return [...prevLive].some(
    (id) =>
      !currLive.has(id) && lastCompleted.some((m) => m.id === id),
  );
}

export function shouldPlayMatchCompleteSound(
  prev: { liveMatchIds: number[]; nerdMode: boolean } | null,
  data: ProgressData,
  nerdMode: boolean,
): boolean {
  if (!nerdMode || !prev || !prev.nerdMode) return false;
  return hasLiveToLastCompletedTransition(
    prev.liveMatchIds,
    data.liveMatches,
    data.lastCompleted,
  );
}
