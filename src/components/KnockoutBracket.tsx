"use client";

import type { ReactNode } from "react";
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
const COLUMN_WIDTH = "7.25rem";

export function KnockoutBracket({ bracket }: { bracket: BracketData }) {
  if (!bracket.active) return null;

  if (!bracket.gridLayout) {
    return <KnockoutBracketFallback bracket={bracket} />;
  }

  const slotsById = new Map<number, BracketSlot>();
  for (const round of bracket.rounds) {
    for (const slot of round.matches) {
      slotsById.set(slot.id, slot);
    }
  }

  const { rows, cells } = bracket.gridLayout;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-max flex-col gap-2">
          <div className="flex gap-x-2">
            {BRACKET_SPLIT_LABELS.map((label, index) => (
              <p
                key={`${label}-${index}`}
                className={`shrink-0 text-center text-[9px] font-semibold uppercase tracking-widest ${
                  index === FINAL_COLUMN ? "text-accent/70" : "text-muted/50"
                }`}
                style={{ width: COLUMN_WIDTH }}
              >
                {label}
              </p>
            ))}
          </div>

          <div
            className="flex items-stretch gap-x-2"
            style={{ minHeight: `${rows * 2.5}rem` }}
          >
            {Array.from({ length: BRACKET_COLUMNS }, (_, columnIndex) => (
              <BracketColumn
                key={columnIndex}
                columnIndex={columnIndex}
                cells={cells}
                rows={rows}
                slotsById={slotsById}
              />
            ))}
          </div>

          {bracket.thirdPlace && (
            <div className="flex gap-x-2">
              {Array.from({ length: BRACKET_COLUMNS }, (_, index) => (
                <div
                  key={index}
                  className="shrink-0"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {index === FINAL_COLUMN && (
                    <>
                      <p className="mb-0.5 text-center text-[8px] uppercase tracking-widest text-muted/40">
                        3rd
                      </p>
                      <BracketMatch slot={bracket.thirdPlace!} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketColumn({
  columnIndex,
  cells,
  rows,
  slotsById,
}: {
  columnIndex: number;
  cells: BracketGridCell[];
  rows: number;
  slotsById: Map<number, BracketSlot>;
}) {
  const colCells = cells
    .filter((cell) => cell.column === columnIndex)
    .sort((a, b) => a.rowStart - b.rowStart);

  const parts: ReactNode[] = [];
  let cursor = 1;

  for (const cell of colCells) {
    const gap = cell.rowStart - cursor;
    if (gap > 0) {
      parts.push(
        <div
          key={`gap-${columnIndex}-${cursor}`}
          aria-hidden
          className="min-h-0"
          style={{ flex: `${gap} 1 0` }}
        />,
      );
    }

    const slot = slotsById.get(cell.matchId);
    if (slot) {
      const span = cell.rowEnd - cell.rowStart;
      parts.push(
        <div
          key={cell.matchId}
          className="relative flex min-h-0 items-center overflow-hidden"
          style={{ flex: `${span} 1 0` }}
        >
          {cell.side !== "center" && (
            <BracketConnector
              side={cell.side}
              rowSpan={span}
              emphasize={cell.matchId === FINAL_MATCH_ID}
            />
          )}
          <BracketMatch
            slot={slot}
            large={cell.matchId === FINAL_MATCH_ID}
            compact={span > 2}
          />
        </div>,
      );
    }

    cursor = cell.rowEnd;
  }

  const tail = rows + 1 - cursor;
  if (tail > 0) {
    parts.push(
      <div
        key={`tail-${columnIndex}`}
        aria-hidden
        className="min-h-0"
        style={{ flex: `${tail} 1 0` }}
      />,
    );
  }

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden"
      style={{ width: COLUMN_WIDTH }}
    >
      {parts}
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

/** Column layout fallback if grid metadata is missing. */
function KnockoutBracketFallback({ bracket }: { bracket: BracketData }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface-elevated/60 px-3 py-2">
      <h2 className="mb-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        Knockout Bracket
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-2">
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
