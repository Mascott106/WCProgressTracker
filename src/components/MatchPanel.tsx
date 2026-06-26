"use client";

import type { MatchSummary } from "@/lib/types";
import {
  formatMatchVenue,
  getMatchWinnerTeam,
  hasMatchScore,
} from "@/lib/types";
import { FormattedDate } from "@/components/FormattedDate";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";
import { teamFlag } from "@/lib/team-flags";

export function MatchRow({
  match,
  variant = "default",
  showTime = true,
  timeOnly = false,
  highlightWinner = false,
}: {
  match: MatchSummary;
  variant?: "default" | "live" | "upcoming";
  showTime?: boolean;
  timeOnly?: boolean;
  highlightWinner?: boolean;
}) {
  const hasScore = hasMatchScore(match);
  const winner = highlightWinner ? getMatchWinnerTeam(match) : null;
  const homeWins = hasScore && winner === match.homeTeam;
  const awayWins = hasScore && winner === match.awayTeam;

  return (
    <div className="flex flex-col gap-1 py-0.5 sm:flex-row sm:items-center sm:gap-3">
      {showTime && (
        <div className="flex items-center justify-between gap-2 sm:contents">
          <FormattedDate
            iso={match.date}
            timeOnly={timeOnly}
            className="w-auto shrink-0 text-[10px] tabular-nums text-muted/60 sm:w-[5.5rem]"
          />
          <StatusBadge
            status={match.statusLong}
            variant={variant}
            className="sm:order-last"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-sm font-medium ${
              homeWins
                ? "font-semibold text-accent"
                : awayWins
                  ? "text-muted/50"
                  : ""
            }`}
          >
            <TeamName name={match.homeTeam} />
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
          <span
            className={`min-w-0 flex-1 truncate text-sm font-medium ${
              awayWins
                ? "font-semibold text-accent"
                : homeWins
                  ? "text-muted/50"
                  : ""
            }`}
          >
            <TeamName name={match.awayTeam} />
          </span>
        </div>
        <p
          className="truncate text-[10px] text-muted/50"
          title={formatMatchVenue(match)}
        >
          {formatMatchVenue(match)}
        </p>
      </div>

      <span className="hidden shrink-0 truncate text-[10px] text-muted/50 xl:inline xl:max-w-[9rem]">
        {match.round.replace("Group Stage - ", "")}
      </span>

      <BroadcastLabel
        foxChannel={match.foxChannel}
        onTubi={match.onTubi}
        className="hidden shrink-0 sm:inline-flex"
      />

      {!showTime && (
        <StatusBadge status={match.statusLong} variant={variant} />
      )}
    </div>
  );
}

export function MatchPanel({
  title,
  matches,
  variant = "default",
  emptyText = "—",
  highlightWinner = false,
}: {
  title: string;
  matches: MatchSummary[];
  variant?: "default" | "live" | "upcoming";
  emptyText?: string;
  highlightWinner?: boolean;
}) {
  const isLive = variant === "live";
  const featured =
    highlightWinner && matches.length > 0 ? matches[0] : null;
  const winner = featured ? getMatchWinnerTeam(featured) : null;
  const hasScore = featured ? hasMatchScore(featured) : false;

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

      {featured && hasScore && (
        <p className="mb-1 text-xs font-semibold text-accent">
          {winner ? (
            <>
              {teamFlag(winner) && (
                <span className="mr-1" aria-hidden>
                  {teamFlag(winner)}
                </span>
              )}
              {winner} wins {featured.homeGoals}–{featured.awayGoals}
            </>
          ) : (
            `Draw ${featured.homeGoals}–${featured.awayGoals}`
          )}
        </p>
      )}

      {matches.length === 0 ? (
        <p className="py-1 text-xs text-muted/40">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              variant={variant}
              highlightWinner={highlightWinner}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  variant,
  className = "",
}: {
  status: string;
  variant: "default" | "live" | "upcoming";
  className?: string;
}) {
  const colors = {
    live: "bg-red-500/15 text-red-400",
    upcoming: "bg-accent/15 text-accent",
    default: "bg-muted/10 text-muted/70",
  };

  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${colors[variant]} ${className}`}
    >
      {status}
    </span>
  );
}
