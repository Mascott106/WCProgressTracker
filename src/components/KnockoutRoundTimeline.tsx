"use client";

import { FormattedDate } from "@/components/FormattedDate";
import type { KnockoutSchedule } from "@/lib/types";

export function KnockoutRoundTimeline({
  schedule,
}: {
  schedule: KnockoutSchedule;
}) {
  return (
    <div className="shrink-0 rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-dim">
          Knockout Schedule
        </h2>
        {schedule.active && schedule.currentRound ? (
          <p className="text-[10px] text-muted/50">
            Now:{" "}
            <span className="font-medium text-accent">
              {schedule.currentRound}
            </span>
          </p>
        ) : !schedule.active ? (
          <p className="text-[10px] text-muted/50">
            Begins{" "}
            {schedule.milestones[0]?.startsAt && (
              <FormattedDate
                iso={schedule.milestones[0].startsAt}
                dateOnly
                className="inline font-medium text-muted/70"
              />
            )}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-0">
        {schedule.milestones.map((milestone, index) => (
          <div key={milestone.name} className="flex min-w-0 flex-1 items-start">
            {index > 0 && (
              <div
                className={`mt-2 h-px flex-1 ${
                  schedule.milestones[index - 1].status === "complete"
                    ? "bg-accent/50"
                    : "bg-border/40"
                }`}
              />
            )}
            <MilestoneNode milestone={milestone} />
            {index < schedule.milestones.length - 1 && (
              <div
                className={`mt-2 h-px flex-1 ${
                  milestone.status === "complete"
                    ? "bg-accent/50"
                    : "bg-border/40"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneNode({
  milestone,
}: {
  milestone: KnockoutSchedule["milestones"][number];
}) {
  const isComplete = milestone.status === "complete";
  const isCurrent = milestone.status === "current";

  return (
    <div className="flex w-[5.5rem] shrink-0 flex-col items-center gap-0.5 px-0.5">
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          isComplete
            ? "border-accent bg-accent text-background"
            : isCurrent
              ? "live-dot border-red-400 bg-red-500/20"
              : "border-border/60 bg-surface"
        }`}
      >
        {isComplete && (
          <span className="text-[8px] font-bold leading-none">✓</span>
        )}
        {isCurrent && (
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        )}
      </div>

      <p
        className={`text-center text-[10px] font-semibold leading-tight ${
          isCurrent
            ? "text-red-400"
            : isComplete
              ? "text-accent"
              : "text-muted/60"
        }`}
      >
        {milestone.shortName}
      </p>

      {milestone.startsAt && (
        <FormattedDate
          iso={milestone.startsAt}
          dateOnly
          className="text-center text-[9px] leading-tight text-muted/45"
        />
      )}

      {isCurrent && milestone.totalMatches > 0 && (
        <p className="text-[8px] text-muted/40">
          {milestone.completedMatches}/{milestone.totalMatches}
        </p>
      )}
    </div>
  );
}
