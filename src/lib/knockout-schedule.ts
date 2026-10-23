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

/** Furthest round with results or live play wins; earlier rounds display complete once a later round has started. */
function normalizeMilestoneStatuses<
  T extends {
    status: "complete" | "current" | "upcoming";
    completedMatches: number;
    totalMatches: number;
    liveMatches: number;
  },
>(milestones: T[]): T[] {
  let furthestActivityIdx = -1;
  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i]!;
    if (milestone.liveMatches > 0 || milestone.completedMatches > 0) {
      furthestActivityIdx = i;
    }
  }

  if (furthestActivityIdx === -1) return milestones;

  const furthest = milestones[furthestActivityIdx]!;
  const furthestComplete =
    furthest.totalMatches > 0 &&
    furthest.completedMatches >= furthest.totalMatches;

  // Last round fully done: everything complete, no "current"
  if (furthestComplete && furthestActivityIdx + 1 >= milestones.length) {
    return milestones.map((m) =>
      m.status === "complete" ? m : { ...m, status: "complete" as const },
    );
  }

  const currentIdx =
    furthestComplete && furthestActivityIdx + 1 < milestones.length
      ? furthestActivityIdx + 1
      : furthestActivityIdx;

  return milestones.map((milestone, index) => {
    if (index < currentIdx) {
      return milestone.status === "complete"
        ? milestone
        : { ...milestone, status: "complete" as const };
    }
    if (index === currentIdx) {
      const hasStarted =
        milestone.liveMatches > 0 || milestone.completedMatches > 0;
      return {
        ...milestone,
        status: hasStarted ? ("current" as const) : ("upcoming" as const),
      };
    }
    return milestone.status === "upcoming"
      ? milestone
      : { ...milestone, status: "upcoming" as const };
  });
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

  const milestones = normalizeMilestoneStatuses(
    KNOCKOUT_TIMELINE_ROUNDS.map((name) => {
      const roundMatches = knockout
        .filter((m) => m.round === name)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      const dates = roundMatches.map((m) => m.date);

      return {
        name,
        shortName: roundShortName(name),
        startsAt: dates[0] ?? "",
        endsAt: dates[dates.length - 1] ?? "",
        totalMatches: roundMatches.length,
        completedMatches: roundMatches.filter((m) => isFinished(m.status))
          .length,
        liveMatches: roundMatches.filter((m) => isLive(m.status)).length,
        status: roundMilestoneStatus(roundMatches),
      };
    }),
  );

  const allComplete = milestones.every((m) => m.status === "complete");
  const currentRound = allComplete
    ? null
    : (milestones.find((m) => m.status === "current")?.name ??
      milestones.find((m) => m.status === "upcoming")?.name ??
      null);

  return { active, milestones, currentRound };
}
