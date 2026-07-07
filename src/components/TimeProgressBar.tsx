"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FormattedDate } from "@/components/FormattedDate";
import { ExpGauge } from "@/components/ExpGauge";
import { useTranslation } from "@/contexts/LocaleContext";
import { useFinalePreviewOptional } from "@/contexts/FinalePreviewContext";
import { percentToLevelProgress } from "@/lib/exp-levels";
import { playLevelUpSound } from "@/lib/play-levelup";
import { prefersReducedMotion } from "@/lib/cup-fluid";
import {
  computeShakeMotion,
  computeTournamentTimePercent,
  FINAL_OVERTIME_DISPLAY_PERCENT,
  previewOvertimeMs,
} from "@/lib/tournament-time";

interface TimeProgressBarProps {
  startAt: string;
  endAt: string;
  finalMatchStatus: string;
  nerdMode?: boolean;
  previewActive?: boolean;
}

function resolveTimeState(
  now: number,
  startAt: string,
  endAt: string,
  finalMatchStatus: string,
  previewPhase: "off" | "allNines" | "complete",
  previewActive: boolean,
): {
  percent: number;
  shouldShake: boolean;
  overtimeMs: number;
} {
  if (previewActive && previewPhase === "complete") {
    return { percent: 100, shouldShake: false, overtimeMs: 0 };
  }
  if (previewActive && previewPhase === "allNines") {
    return {
      percent: FINAL_OVERTIME_DISPLAY_PERCENT,
      shouldShake: true,
      overtimeMs: previewOvertimeMs(now),
    };
  }

  const result = computeTournamentTimePercent(now, startAt, endAt, {
    status: finalMatchStatus,
  });
  return {
    percent: result.percent,
    shouldShake: result.shouldShake,
    overtimeMs: result.overtimeMs,
  };
}

function ShakeWrap({
  motion,
  children,
}: {
  motion: CSSProperties;
  children: ReactNode;
}) {
  return <div style={motion}>{children}</div>;
}

export function TimeProgressBar({
  startAt,
  endAt,
  finalMatchStatus,
  nerdMode = false,
  previewActive = false,
}: TimeProgressBarProps) {
  const { t } = useTranslation();
  const preview = useFinalePreviewOptional();
  const previewPhase = preview?.previewPhase ?? "off";

  const [percent, setPercent] = useState(() =>
    resolveTimeState(
      Date.now(),
      startAt,
      endAt,
      finalMatchStatus,
      previewPhase,
      previewActive,
    ).percent,
  );
  const [shakeStyle, setShakeStyle] = useState<CSSProperties>({});

  useEffect(() => {
    let frame = 0;
    let active = true;
    let seeded = false;
    let prevLevel: number | null = null;

    const tick = () => {
      if (!active) return;
      const now = Date.now();
      const state = resolveTimeState(
        now,
        startAt,
        endAt,
        finalMatchStatus,
        previewPhase,
        previewActive,
      );
      setPercent(state.percent);

      if (state.shouldShake && !prefersReducedMotion()) {
        const { translateX, translateY, rotateDeg } = computeShakeMotion(
          state.overtimeMs,
          now,
        );
        setShakeStyle({
          transform: `translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px) rotate(${rotateDeg.toFixed(2)}deg)`,
        });
      } else {
        setShakeStyle({});
      }

      if (nerdMode) {
        const clamped = Math.min(100, Math.max(0, state.percent));
        const level = percentToLevelProgress(clamped).level;
        if (seeded && prevLevel !== null && level > prevLevel) {
          playLevelUpSound();
        }
        seeded = true;
        prevLevel = level;
      }

      if (active) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [
    startAt,
    endAt,
    finalMatchStatus,
    nerdMode,
    previewPhase,
    previewActive,
  ]);

  const clampedPercent = Math.min(100, Math.max(0, percent));

  if (nerdMode) {
    const progress = percentToLevelProgress(clampedPercent);
    return (
      <div className="shrink-0 space-y-2 py-1">
        <ShakeWrap motion={shakeStyle}>
          <ExpGauge
            percent={clampedPercent}
            sectionLabel={t("progress.timeSection", { nerd: true })}
            accent="time"
            size="sm"
            progress={progress}
            showBar={false}
          />
        </ShakeWrap>
        <ShakeWrap motion={shakeStyle}>
          <ExpGauge
            percent={clampedPercent}
            sectionLabel={t("progress.timeSection", { nerd: true })}
            accent="time"
            size="sm"
            progress={progress}
            fillMode="overall"
            showHeader={false}
          />
        </ShakeWrap>
        <div className="flex justify-between text-[10px] text-muted/50">
          <FormattedDate iso={startAt} dateOnly />
          <FormattedDate iso={endAt} dateOnly />
        </div>
        <ShakeWrap motion={shakeStyle}>
          <ExpGauge
            percent={clampedPercent}
            sectionLabel={t("progress.currentLevelSection", { nerd: true })}
            accent="time"
            size="sm"
            progress={progress}
            fillMode="intraLevel"
            headerStyle="compact"
            showHeader
          />
        </ShakeWrap>
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-1.5 py-1">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-dim">
          {t("progress.timeSection", { nerd: false })}
        </span>
        <ShakeWrap motion={shakeStyle}>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold tabular-nums tracking-tight text-sky-400 sm:text-2xl">
              {clampedPercent.toFixed(7)}
            </span>
            <span className="text-xs font-semibold text-sky-400/60 sm:text-sm">
              %
            </span>
          </div>
        </ShakeWrap>
      </div>

      <div className="relative h-5 overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-border">
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-sky-700 via-sky-400 to-cyan-300"
          style={{
            width: `${clampedPercent}%`,
            ...shakeStyle,
          }}
        />
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0.5 bottom-0.5 w-px bg-border/50"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-muted/50">
        <FormattedDate iso={startAt} dateOnly />
        <FormattedDate iso={endAt} dateOnly />
      </div>
    </div>
  );
}
