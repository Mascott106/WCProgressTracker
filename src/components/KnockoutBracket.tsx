"use client";

import type { BracketData, BracketSlot } from "@/lib/types";
import { formatMatchVenue } from "@/lib/types";
import type { KnockoutTreeMeta } from "@/lib/bracket-layout";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";

/** SF → QF → R16 → R32 on each half (0 = semi). */
const KNOCKOUT_HALF_DEPTH = 3;

export function KnockoutBracket({ bracket }: { bracket: BracketData }) {
  if (!bracket.active) return null;

  if (!bracket.knockoutTree) {
    return <KnockoutBracketFallback bracket={bracket} />;
  }

  const slotsById = buildSlotsById(bracket);
  const feeders = buildFeedersMap(bracket.knockoutTree);
  const { finalMatchId, semiFinalMatchIds } = bracket.knockoutTree;
  const [leftSemi, rightSemi] = semiFinalMatchIds;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>

      <div className="sm:hidden">
        <KnockoutBracketRoundList bracket={bracket} />
      </div>

      <div className="hidden w-full sm:block">
        <div className="grid w-full grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(0,4fr)] items-center gap-x-1 py-1">
          <BracketSubtree
            matchId={leftSemi}
            side="left"
            depth={0}
            feeders={feeders}
            slots={slotsById}
          />

          <div className="flex min-w-0 flex-col items-stretch gap-2 px-0.5">
            <div>
              <p className="mb-0.5 text-center text-[9px] font-semibold uppercase tracking-widest text-accent/70">
                Final
              </p>
              {slotsById.get(finalMatchId) ? (
                <BracketMatch slot={slotsById.get(finalMatchId)!} large />
              ) : (
                <BracketMatchPlaceholder matchId={finalMatchId} />
              )}
            </div>
            {bracket.thirdPlace && (
              <div>
                <p className="mb-0.5 text-center text-[8px] uppercase tracking-widest text-muted/40">
                  3rd
                </p>
                <BracketMatch slot={bracket.thirdPlace} />
              </div>
            )}
          </div>

          <BracketSubtree
            matchId={rightSemi}
            side="right"
            depth={0}
            feeders={feeders}
            slots={slotsById}
          />
        </div>
      </div>
    </div>
  );
}

function buildFeedersMap(
  tree: KnockoutTreeMeta,
): Map<number, [number, number]> {
  return new Map(
    tree.feeders.map(([id, home, away]) => [id, [home, away] as [number, number]]),
  );
}

function buildSlotsById(bracket: BracketData): Map<number, BracketSlot> {
  const slotsById = new Map<number, BracketSlot>();
  for (const round of bracket.rounds) {
    for (const slot of round.matches) {
      slotsById.set(slot.id, slot);
    }
  }
  if (bracket.thirdPlace) {
    slotsById.set(bracket.thirdPlace.id, bracket.thirdPlace);
  }
  return slotsById;
}

function BracketSubtree({
  matchId,
  side,
  depth,
  feeders,
  slots,
}: {
  matchId: number;
  side: "left" | "right";
  depth: number;
  feeders: Map<number, [number, number]>;
  slots: Map<number, BracketSlot>;
}) {
  const pair = feeders.get(matchId);
  const slot = slots.get(matchId);

  if (!pair) {
    return (
      <div className="flex w-full min-w-0 items-center">
        {slot ? (
          <BracketMatch slot={slot} compact />
        ) : (
          <BracketMatchPlaceholder matchId={matchId} />
        )}
      </div>
    );
  }

  const [homeFeeder, awayFeeder] = pair;
  const feedersFlex = KNOCKOUT_HALF_DEPTH - depth;

  return (
    <div
      className={`flex w-full min-w-0 items-stretch ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      <div
        className="flex min-w-0 flex-col justify-center gap-0.5 py-0.5"
        style={{ flex: feedersFlex }}
      >
        <BracketSubtree
          matchId={homeFeeder}
          side={side}
          depth={depth + 1}
          feeders={feeders}
          slots={slots}
        />
        <BracketSubtree
          matchId={awayFeeder}
          side={side}
          depth={depth + 1}
          feeders={feeders}
          slots={slots}
        />
      </div>
      <BracketTreeConnector side={side} />
      <div className="flex min-w-0 items-center self-center" style={{ flex: 1 }}>
        {slot ? (
          <BracketMatch slot={slot} compact />
        ) : (
          <BracketMatchPlaceholder matchId={matchId} />
        )}
      </div>
    </div>
  );
}

function BracketTreeConnector({ side }: { side: "left" | "right" }) {
  const onLeft = side === "right";

  return (
    <div
      className="relative w-2 shrink-0 self-stretch sm:w-3"
      aria-hidden
    >
      <div
        className={`absolute top-[10%] bottom-[10%] w-px bg-border/60 ${
          onLeft ? "left-0" : "right-0"
        }`}
      />
      <div
        className={`absolute top-1/2 h-px w-1/2 -translate-y-1/2 bg-border/60 ${
          onLeft ? "left-0" : "right-0"
        }`}
      />
    </div>
  );
}

/** Mobile: round-by-round lists sorted by match id. */
function KnockoutBracketRoundList({ bracket }: { bracket: BracketData }) {
  return (
    <div className="flex flex-col gap-4">
      {bracket.rounds.map((round) => (
        <div key={round.name}>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-muted/50">
            {round.shortName}
          </p>
          <div className="flex flex-col gap-0.5">
            {round.matches.map((slot) => (
              <BracketMatch key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
      ))}
      {bracket.thirdPlace && (
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-muted/40">
            3rd
          </p>
          <BracketMatch slot={bracket.thirdPlace} />
        </div>
      )}
    </div>
  );
}

/** Round columns when tree metadata is unavailable. */
function KnockoutBracketFallback({ bracket }: { bracket: BracketData }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>
      <div className="sm:hidden">
        <KnockoutBracketRoundList bracket={bracket} />
      </div>
      <div className="hidden min-h-0 flex-1 flex-col gap-4 sm:flex sm:flex-row sm:gap-2">
        {bracket.rounds.map((round) => (
          <div key={round.name} className="flex min-w-0 flex-col sm:flex-1">
            <p className="mb-1 shrink-0 text-center text-[9px] font-semibold uppercase tracking-widest text-muted/50">
              {round.shortName}
            </p>
            <div className="flex flex-col gap-0.5">
              {round.matches.map((slot) => (
                <BracketMatch key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatchPlaceholder({ matchId }: { matchId: number }) {
  return (
    <div
      className="w-full rounded border border-dashed border-amber-500/40 bg-amber-500/5 px-1.5 py-2"
      title={`Match ${matchId} unavailable`}
    >
      <p className="font-mono text-[8px] font-semibold tabular-nums text-amber-200/70">
        M{matchId}
      </p>
      <p className="text-[9px] text-amber-200/50">Match data unavailable</p>
    </div>
  );
}

function BracketMatch({
  slot,
  large = false,
  compact = false,
}: {
  slot: BracketSlot;
  large?: boolean;
  compact?: boolean;
}) {
  const hasScore = slot.homeGoals !== null && slot.awayGoals !== null;
  const homeWins = hasScore && slot.homeGoals! > slot.awayGoals!;
  const awayWins = hasScore && slot.awayGoals! > slot.homeGoals!;

  const border = slot.isLive
    ? "border-red-500/50 bg-red-500/5"
    : slot.isFinished
      ? "border-border/80 bg-surface/40"
      : "border-border/40 bg-surface/20";

  return (
    <div
      className={`w-full rounded border px-1.5 ${compact ? "py-1" : "py-2 sm:py-1"} ${border} ${large ? "sm:py-1.5" : ""}`}
      title={`Match ${slot.id}`}
    >
      <div className="mb-0.5 flex items-center justify-between gap-1">
        <span className="font-mono text-[8px] font-semibold tabular-nums text-muted/55">
          M{slot.id}
        </span>
        <BroadcastLabel foxChannel={slot.foxChannel} onTubi={slot.onTubi} />
      </div>
      {!compact && (
        <p
          className="mb-0.5 truncate text-[8px] text-muted/45"
          title={formatMatchVenue(slot)}
        >
          {formatMatchVenue(slot)}
        </p>
      )}
      <TeamLine
        name={slot.homeTeam}
        goals={slot.homeGoals}
        wins={homeWins}
        large={large}
        compact={compact}
      />
      <TeamLine
        name={slot.awayTeam}
        goals={slot.awayGoals}
        wins={awayWins}
        large={large}
        compact={compact}
      />
    </div>
  );
}

function TeamLine({
  name,
  goals,
  wins,
  large,
  compact,
}: {
  name: string;
  goals: number | null;
  wins: boolean;
  large?: boolean;
  compact?: boolean;
}) {
  const placeholder = name.startsWith("Match ") || name.startsWith("Group ");

  return (
    <div
      className={`flex items-center justify-between gap-1 leading-tight ${
        large ? "text-xs" : compact ? "text-[9px]" : "text-[10px]"
      }`}
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
