"use client";

import { label } from "@/lib/nerd-mode-labels";
import { matchProgressKnockoutPercent } from "@/lib/types";
import { ExpGauge } from "@/components/ExpGauge";

interface ProgressBarProps {
  percent: number;
  completed: number;
  live: number;
  remaining: number;
  total: number;
  nerdMode?: boolean;
}

const KNOCKOUT_START_PERCENT = matchProgressKnockoutPercent();
const MATCH_BAR_MARKS = [25, KNOCKOUT_START_PERCENT, 75];

export function ProgressBar({
  percent,
  completed,
  live,
  remaining,
  total,
  nerdMode = false,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="shrink-0 space-y-3 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        {nerdMode ? (
          <ExpGauge
            percent={clampedPercent}
            sectionLabel={label("matchSection", true)}
            accent="match"
            size="lg"
            showBar={false}
          />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold tabular-nums tracking-tight text-accent sm:text-5xl">
              {clampedPercent.toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-accent/60 sm:text-xl">%</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <StatPill
            label={label("statDone", nerdMode)}
            value={completed}
            accent
          />
          <StatPill
            label={label("statLive", nerdMode)}
            value={live}
            live={live > 0}
          />
          <StatPill
            label={label("statLeft", nerdMode)}
            value={remaining}
          />
          <span className="font-mono text-base text-muted">
            {completed}
            <span className="text-muted/40"> / </span>
            {total}
          </span>
        </div>
      </div>

      {nerdMode ? (
        <>
          <ExpGauge
            percent={clampedPercent}
            sectionLabel={label("matchSection", true)}
            accent="match"
            size="lg"
            fillMode="overall"
            showHeader={false}
            barMarks={MATCH_BAR_MARKS}
          />
          <MatchProgressAxis nerdMode />
        </>
      ) : (
        <>
          <div className="relative h-8 overflow-hidden rounded-xl bg-surface-elevated ring-1 ring-border">
            <div
              className="progress-glow absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-accent-dim via-accent to-yellow-300 transition-all duration-1000 ease-out"
              style={{ width: `${clampedPercent}%` }}
            />
            {MATCH_BAR_MARKS.map((mark) => (
              <div
                key={mark}
                className="absolute top-1 bottom-1 w-px bg-border/50"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>

          <MatchProgressAxis nerdMode={false} />
        </>
      )}
    </div>
  );
}

function MatchProgressAxis({ nerdMode }: { nerdMode: boolean }) {
  return (
    <div className="relative h-3 text-[10px] text-muted/50">
      <span className="absolute left-0 top-0">
        {label("matchAxisStart", nerdMode)}
      </span>
      <span
        className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
        style={{ left: `${KNOCKOUT_START_PERCENT}%` }}
      >
        {label("matchAxisMid", nerdMode)}
      </span>
      <span className="absolute right-0 top-0">
        {label("matchAxisEnd", nerdMode)}
      </span>
    </div>
  );
}

function StatPill({
  label: pillLabel,
  value,
  accent,
  live,
}: {
  label: string;
  value: number;
  accent?: boolean;
  live?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${
        live
          ? "border-red-500/40 bg-red-500/10"
          : "border-border bg-surface"
      }`}
    >
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          accent ? "text-accent" : live ? "text-red-400" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted/70">
        {pillLabel}
      </span>
    </div>
  );
}
