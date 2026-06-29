"use client";

import type { BracketData, BracketSlot } from "@/lib/types";
import { formatMatchVenue } from "@/lib/types";
import {
  BRACKET_COLUMNS,
  BRACKET_SPLIT_LABELS,
  FINAL_COLUMN,
  type BracketGridCell,
  type BracketSide,
} from "@/lib/bracket-layout";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";

const FINAL_MATCH_ID = 104;

const DESKTOP_GRID_COLUMNS = `repeat(${BRACKET_COLUMNS}, minmax(0, 1fr))`;

export function KnockoutBracket({ bracket }: { bracket: BracketData }) {
  if (!bracket.active) return null;

  if (!bracket.gridLayout) {
    return <KnockoutBracketFallback bracket={bracket} />;
  }

  const slotsById = buildSlotsById(bracket);
  const { rows, cells } = bracket.gridLayout;
  const gridRows = `repeat(${rows}, minmax(3.25rem, auto))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>

      <div className="sm:hidden">
        <KnockoutBracketRoundList bracket={bracket} />
      </div>

      <div className="hidden w-full sm:block">
        <div
          className="mb-1 grid gap-x-2"
          style={{ gridTemplateColumns: DESKTOP_GRID_COLUMNS }}
        >
          {BRACKET_SPLIT_LABELS.map((label, index) => (
            <p
              key={`${label}-${index}`}
              className={`text-center text-[9px] font-semibold uppercase tracking-widest ${
                index === FINAL_COLUMN ? "text-accent/70" : "text-muted/50"
              }`}
            >
              {label}
            </p>
          ))}
        </div>

        <div
          className="grid w-full gap-x-2"
          style={{
            gridTemplateColumns: DESKTOP_GRID_COLUMNS,
            gridTemplateRows: gridRows,
          }}
        >
          {cells.map((cell) => (
            <BracketGridCell
              key={cell.matchId}
              cell={cell}
              slot={slotsById.get(cell.matchId)}
            />
          ))}
        </div>

        {bracket.thirdPlace && (
          <div
            className="mt-2 grid gap-x-2"
            style={{ gridTemplateColumns: DESKTOP_GRID_COLUMNS }}
          >
            <div style={{ gridColumn: FINAL_COLUMN + 1 }}>
              <p className="mb-0.5 text-center text-[8px] uppercase tracking-widest text-muted/40">
                3rd
              </p>
              <BracketMatch slot={bracket.thirdPlace} />
            </div>
          </div>
        )}
      </div>
    </div>
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

function BracketGridCell({
  cell,
  slot,
}: {
  cell: BracketGridCell;
  slot: BracketSlot | undefined;
}) {
  const rowSpan = cell.rowEnd - cell.rowStart;

  return (
    <div
      className="relative flex items-center self-stretch py-0.5"
      style={{
        gridColumn: cell.column + 1,
        gridRow: `${cell.rowStart} / ${cell.rowEnd}`,
      }}
    >
      {cell.side !== "center" && (
        <BracketConnector
          side={cell.side}
          rowSpan={rowSpan}
          emphasize={cell.matchId === FINAL_MATCH_ID}
        />
      )}
      {slot ? (
        <BracketMatch
          slot={slot}
          large={cell.matchId === FINAL_MATCH_ID}
          compact={rowSpan > 2}
        />
      ) : (
        <BracketMatchPlaceholder matchId={cell.matchId} />
      )}
    </div>
  );
}

function BracketConnector({
  side,
  rowSpan,
  emphasize,
}: {
  side: Exclude<BracketSide, "center">;
  rowSpan: number;
  emphasize?: boolean;
}) {
  const lineClass = emphasize ? "bg-accent/40" : "bg-border/70";
  const onLeft = side === "right";

  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-10 w-3 ${onLeft ? "left-0" : "right-0"}`}
      aria-hidden
    >
      <div
        className={`absolute top-1/2 h-px w-2 -translate-y-1/2 ${lineClass} ${
          onLeft ? "left-0" : "right-0"
        }`}
      />
      {rowSpan > 2 && (
        <div
          className={`absolute top-0 h-full w-px ${lineClass} ${
            onLeft ? "left-0" : "right-0"
          }`}
        />
      )}
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

/** Round columns when grid metadata is unavailable. */
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
