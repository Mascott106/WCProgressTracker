"use client";

import {
  formatExp,
  percentToLevelProgress,
  type LevelProgress,
} from "@/lib/exp-levels";

type ExpGaugeAccent = "match" | "time";

const ACCENT_STYLES: Record<
  ExpGaugeAccent,
  { number: string; suffix: string; bar: string; label: string }
> = {
  match: {
    number: "text-accent",
    suffix: "text-accent/60",
    bar: "from-accent-dim via-accent to-yellow-300",
    label: "text-muted-dim",
  },
  time: {
    number: "text-sky-400",
    suffix: "text-sky-400/60",
    bar: "from-sky-700 via-sky-400 to-cyan-300",
    label: "text-muted-dim",
  },
};

type ExpGaugeFillMode = "overall" | "intraLevel";
type ExpGaugeHeaderStyle = "full" | "compact";

interface ExpGaugeProps {
  percent: number;
  sectionLabel: string;
  accent: ExpGaugeAccent;
  size?: "lg" | "sm";
  progress?: LevelProgress;
  fillMode?: ExpGaugeFillMode;
  headerStyle?: ExpGaugeHeaderStyle;
  /** When false, render only the level / EXP header (bar omitted). */
  showBar?: boolean;
  /** When false, render only the bar (header omitted). */
  showHeader?: boolean;
  /** Vertical tick positions on the bar (percent). Defaults to 25/50/75. */
  barMarks?: number[];
}

export function ExpGauge({
  percent,
  sectionLabel,
  accent,
  size = "lg",
  progress: progressProp,
  fillMode = "intraLevel",
  headerStyle = "full",
  showBar = true,
  showHeader = true,
  barMarks = [25, 50, 75],
}: ExpGaugeProps) {
  const progress = progressProp ?? percentToLevelProgress(percent);
  const styles = ACCENT_STYLES[accent];
  const isLarge = size === "lg";
  const fillWidth =
    fillMode === "overall"
      ? Math.min(100, Math.max(0, percent))
      : Math.min(100, Math.max(0, progress.levelFillPercent));
  const levelFraction = progress.isMaxLevel
    ? "MAX"
    : `${formatExp(progress.expInLevel)} / ${formatExp(progress.expToNextLevel)}`;

  return (
    <div className="min-w-0 space-y-1.5">
      {showHeader && headerStyle === "full" && (
        <div className="space-y-1">
          <span
            className={`block text-[10px] font-medium uppercase tracking-wider ${styles.label}`}
          >
            {sectionLabel}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span
              className={`font-mono font-bold tabular-nums tracking-tight ${styles.number} ${
                isLarge ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
              }`}
            >
              Lv {progress.level}
            </span>
            <span
              className={`font-mono tabular-nums ${styles.number} ${
                isLarge ? "text-sm sm:text-base" : "text-xs sm:text-sm"
              } opacity-90`}
            >
              {formatExp(progress.totalExp)} EXP
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted/60 sm:text-xs">
              {levelFraction}
            </span>
          </div>
        </div>
      )}

      {showHeader && headerStyle === "compact" && (
        <span
          className={`block text-[10px] font-medium uppercase tracking-wider ${styles.label}`}
        >
          {sectionLabel}
        </span>
      )}

      {showBar && (
        <div
          className={`relative overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-border ${
            isLarge ? "h-8 rounded-xl" : "h-5"
          }`}
        >
          {barMarks.map((mark) => (
            <div
              key={mark}
              className={`absolute z-0 w-px bg-border/40 ${
                isLarge ? "top-1 bottom-1" : "top-0.5 bottom-0.5"
              }`}
              style={{ left: `${mark}%` }}
            />
          ))}
          <div
            className={`absolute inset-y-0 left-0 z-10 bg-gradient-to-r ${styles.bar} transition-[width] duration-700 ease-out ${
              isLarge ? "rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "rounded-lg"
            }`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}
