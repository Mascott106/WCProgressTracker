import {
  isFinished,
  isLive,
  MATCH_DURATION_MINUTES,
  statusLabel,
  type MatchSummary,
} from "./types";

const MATCH_DURATION_MS = MATCH_DURATION_MINUTES * 60 * 1000;

/**
 * Resolve display status for a match. Trusts API when it reports live/finished;
 * otherwise infers from kickoff time (football-data.org free tier delays live updates).
 */
export function resolveMatchStatus(
  kickoffIso: string,
  apiStatus: string | null | undefined,
  now = Date.now(),
): { status: string; statusLong: string } {
  const status = apiStatus ?? "NS";

  if (isFinished(status) || isLive(status)) {
    return { status, statusLong: statusLabel(status) };
  }

  if (status !== "NS") {
    return { status, statusLong: statusLabel(status) };
  }

  const kickoff = new Date(kickoffIso).getTime();
  const end = kickoff + MATCH_DURATION_MS;

  if (now < kickoff) {
    return { status: "NS", statusLong: statusLabel("NS") };
  }
  if (now < end) {
    return { status: "LIVE", statusLong: statusLabel("LIVE") };
  }

  return { status: "FT", statusLong: statusLabel("FT") };
}

/** Apply kickoff-based status when API data is missing or delayed. */
export function applyScheduleStatuses(
  summaries: MatchSummary[],
  now = Date.now(),
): MatchSummary[] {
  return summaries.map((match) => {
    const { status, statusLong } = resolveMatchStatus(
      match.date,
      match.status,
      now,
    );
    return { ...match, status, statusLong };
  });
}
