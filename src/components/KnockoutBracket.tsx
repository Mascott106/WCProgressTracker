"use client";

import type { BracketData, BracketSlot } from "@/lib/types";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";

export function KnockoutBracket({ bracket }: { bracket: BracketData }) {
  if (!bracket.active) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>

      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-2">
        {bracket.rounds.map((round) => (
          <BracketColumn
            key={round.name}
            label={round.shortName}
            matches={round.matches}
            emphasize={round.name === "Final"}
            extra={round.name === "Final" ? bracket.thirdPlace : null}
          />
        ))}
      </div>
    </div>
  );
}

function BracketColumn({
  label,
  matches,
  emphasize,
  extra,
}: {
  label: string;
  matches: BracketSlot[];
  emphasize?: boolean;
  extra?: BracketSlot | null;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col sm:flex-1 ${emphasize ? "sm:min-w-[11rem]" : ""} border-l-2 border-border/40 pl-3 first:border-l-0 first:pl-0 sm:border-l-0 sm:pl-0`}
    >
      <p className="mb-1 shrink-0 text-center text-[9px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </p>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-0.5">
        {matches.map((slot) => (
          <BracketMatch key={slot.id} slot={slot} large={emphasize} />
        ))}
        {extra && (
          <>
            <p className="mt-1 shrink-0 text-center text-[8px] uppercase tracking-widest text-muted/40">
              3rd
            </p>
            <BracketMatch slot={extra} />
          </>
        )}
      </div>
    </div>
  );
}

function BracketMatch({
  slot,
  large = false,
}: {
  slot: BracketSlot;
  large?: boolean;
}) {
  const hasScore = slot.homeGoals !== null && slot.awayGoals !== null;
  const homeWins =
    hasScore && slot.homeGoals! > slot.awayGoals!;
  const awayWins =
    hasScore && slot.awayGoals! > slot.homeGoals!;

  const border = slot.isLive
    ? "border-red-500/50 bg-red-500/5"
    : slot.isFinished
      ? "border-border/80 bg-surface/40"
      : "border-border/40 bg-surface/20";

  return (
    <div
      className={`rounded border px-1.5 py-2 sm:py-1 ${border} ${large ? "sm:py-1.5" : ""}`}
      title={`Match ${slot.id}`}
    >
      <BroadcastLabel
        foxChannel={slot.foxChannel}
        onTubi={slot.onTubi}
        className="mb-0.5"
      />
      <TeamLine
        name={slot.homeTeam}
        goals={slot.homeGoals}
        wins={homeWins}
        large={large}
      />
      <TeamLine
        name={slot.awayTeam}
        goals={slot.awayGoals}
        wins={awayWins}
        large={large}
      />
    </div>
  );
}

function TeamLine({
  name,
  goals,
  wins,
  large,
}: {
  name: string;
  goals: number | null;
  wins: boolean;
  large?: boolean;
}) {
  const placeholder = name.startsWith("Match ") || name.startsWith("Group ");

  return (
    <div
      className={`flex items-center justify-between gap-1 leading-tight ${large ? "text-xs" : "text-[10px]"}`}
    >
      <TeamName
        name={name}
        className={`min-w-0 truncate ${wins ? "font-semibold text-accent" : placeholder ? "text-muted/45" : "text-foreground/90"}`}
      />
      {goals !== null && (
        <span className="shrink-0 font-mono font-bold tabular-nums">{goals}</span>
      )}
    </div>
  );
}
