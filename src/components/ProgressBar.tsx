"use client";

interface ProgressBarProps {
  percent: number;
  completed: number;
  live: number;
  remaining: number;
  total: number;
}

export function ProgressBar({
  percent,
  completed,
  live,
  remaining,
  total,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="shrink-0 space-y-3 py-2">
      <div className="flex items-center gap-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-5xl font-bold tabular-nums tracking-tight text-accent">
            {clampedPercent.toFixed(1)}
          </span>
          <span className="text-xl font-semibold text-accent/60">%</span>
        </div>

        <div className="flex gap-2">
          <StatPill label="Done" value={completed} accent />
          <StatPill label="Live" value={live} live={live > 0} />
          <StatPill label="Left" value={remaining} />
        </div>

        <span className="ml-auto font-mono text-base text-muted">
          {completed}
          <span className="text-muted/40"> / </span>
          {total}
        </span>
      </div>

      <div className="relative h-8 overflow-hidden rounded-xl bg-surface-elevated ring-1 ring-border">
        <div
          className="progress-glow absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-accent-dim via-accent to-yellow-300 transition-all duration-1000 ease-out"
          style={{ width: `${clampedPercent}%` }}
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-1 bottom-1 w-px bg-border/50"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-muted/50">
        <span>Group Stage</span>
        <span>Knockout</span>
        <span>Final</span>
      </div>
    </div>
  );
}

function StatPill({
  label,
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
        {label}
      </span>
    </div>
  );
}
