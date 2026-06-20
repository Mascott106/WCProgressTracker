import type { KnockoutSchedule, MatchSummary } from "./types";
import { isFinished, isLive, roundShortName } from "./types";

export const KNOCKOUT_TIMELINE_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Third Place",
  "Final",
] as const;

/** Knockout stage begins June 28, 2026 (Round of 32). */
export const KNOCKOUT_START_MS = new Date("2026-06-28T12:00:00-04:00").getTime();

function roundMilestoneStatus(
  matches: MatchSummary[],
): "complete" | "current" | "upcoming" {
  if (matches.length === 0) return "upcoming";
  if (matches.every((m) => isFinished(m.status))) return "complete";
  if (matches.some((m) => isLive(m.status) || isFinished(m.status))) {
    return "current";
  }
  return "upcoming";
}

export function buildKnockoutSchedule(
  summaries: MatchSummary[],
  now: number,
): KnockoutSchedule {
  const knockout = summaries.filter((m) => m.id >= 73);

  const knockoutStarted =
    now >= KNOCKOUT_START_MS ||
    knockout.some((m) => m.status === "LIVE" || isFinished(m.status));

  const previewBracket =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_PREVIEW_BRACKET === "true";

  const active = knockoutStarted || previewBracket;

  const milestones = KNOCKOUT_TIMELINE_ROUNDS.map((name) => {
    const roundMatches = knockout
      .filter((m) => m.round === name)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dates = roundMatches.map((m) => m.date);

    return {
      name,
      shortName: roundShortName(name),
      startsAt: dates[0] ?? "",
      endsAt: dates[dates.length - 1] ?? "",
      totalMatches: roundMatches.length,
      completedMatches: roundMatches.filter((m) => isFinished(m.status)).length,
      status: roundMilestoneStatus(roundMatches),
    };
  });

  const currentRound =
    milestones.find((m) => m.status === "current")?.name ??
    milestones.find((m) => m.status === "upcoming")?.name ??
    null;

  return { active, milestones, currentRound };
}
