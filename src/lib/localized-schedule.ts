import { getScheduleDayWindow } from "./schedule-day";
import type { MatchSummary, ScheduleDay } from "./types";

function getScheduledMatchesForWindow(
  summaries: MatchSummary[],
  window: { start: number; end: number },
  notBefore?: number,
): MatchSummary[] {
  const earliest = notBefore ?? window.start;
  return summaries
    .filter((m) => {
      if (m.status !== "NS") return false;
      const kickoff = new Date(m.date).getTime();
      return kickoff >= earliest && kickoff < window.end;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

/** Group upcoming matches into today / tomorrow / day-after in the viewer's timezone. */
export function buildLocalizedScheduleDays(
  matches: MatchSummary[],
  now: number,
  timeZone: string,
): ScheduleDay[] {
  return [0, 1, 2].map((offset) => {
    const window = getScheduleDayWindow(now, offset, timeZone);
    return {
      dateIso: window.dateIso,
      matches: getScheduledMatchesForWindow(
        matches,
        window,
        offset === 0 ? now : undefined,
      ),
      isToday: offset === 0,
      isTomorrow: offset === 1,
    };
  });
}
