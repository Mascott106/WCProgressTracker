"use client";

import type { MatchSummary } from "@/lib/types";
import { FormattedDate } from "@/components/FormattedDate";
import { BroadcastLabel } from "@/components/BroadcastLabel";

export function MatchRow({
  match,
  variant = "default",
  showTime = true,
  timeOnly = false,
}: {
  match: MatchSummary;
  variant?: "default" | "live" | "upcoming";
  showTime?: boolean;
  timeOnly?: boolean;
}) {
  const hasScore =
    match.homeGoals !== null && match.awayGoals !== null;

  return (
    <div className="flex items-center gap-3 py-0.5">
      {showTime && (
        <FormattedDate
          iso={match.date}
          timeOnly={timeOnly}
          className="w-[5.5rem] shrink-0 text-[10px] tabular-nums text-muted/60"
        />
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {match.homeTeam}
        </span>
        <span className="shrink-0 text-muted/40">
          {hasScore ? (
            <span className="font-mono text-sm font-bold tabular-nums">
              {match.homeGoals}–{match.awayGoals}
            </span>
          ) : (
            "vs"
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {match.awayTeam}
        </span>
      </div>

      <span className="hidden shrink-0 truncate text-[10px] text-muted/50 xl:inline xl:max-w-[9rem]">
        {match.round.replace("Group Stage - ", "")}
      </span>

      <BroadcastLabel
        foxChannel={match.foxChannel}
        onTubi={match.onTubi}
        className="shrink-0"
      />

      <StatusBadge status={match.statusLong} variant={variant} />
    </div>
  );
}

export function MatchPanel({
  title,
  matches,
  variant = "default",
  emptyText = "—",
}: {
  title: string;
  matches: MatchSummary[];
  variant?: "default" | "live" | "upcoming";
  emptyText?: string;
}) {
  const isLive = variant === "live";

  return (
    <div className="rounded-lg border border-border bg-surface-elevated/80 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        {isLive && (
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-dim">
          {title}
        </h2>
      </div>

      {matches.length === 0 ? (
        <p className="py-1 text-xs text-muted/40">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant: "default" | "live" | "upcoming";
}) {
  const colors = {
    live: "bg-red-500/15 text-red-400",
    upcoming: "bg-accent/15 text-accent",
    default: "bg-muted/10 text-muted/70",
  };

  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${colors[variant]}`}
    >
      {status}
    </span>
  );
}
