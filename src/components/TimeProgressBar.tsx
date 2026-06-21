"use client";

import { useEffect, useState } from "react";
import { FormattedDate } from "@/components/FormattedDate";
import { ExpGauge } from "@/components/ExpGauge";
import { percentToLevelProgress } from "@/lib/exp-levels";
import { label } from "@/lib/nerd-mode-labels";

interface TimeProgressBarProps {
  startAt: string;
  endAt: string;
  nerdMode?: boolean;
}

function computePercent(now: number, startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

export function TimeProgressBar({
  startAt,
  endAt,
  nerdMode = false,
}: TimeProgressBarProps) {
  const [percent, setPercent] = useState(() =>
    computePercent(Date.now(), startAt, endAt),
  );

  useEffect(() => {
    let frame = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      setPercent(computePercent(Date.now(), startAt, endAt));
      if (active) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [startAt, endAt]);

  const clampedPercent = Math.min(100, Math.max(0, percent));

  if (nerdMode) {
    const progress = percentToLevelProgress(clampedPercent);
    return (
      <div className="shrink-0 space-y-1.5 py-1">
        <ExpGauge
          percent={clampedPercent}
          sectionLabel={label("timeSection", true)}
          accent="time"
          size="sm"
          progress={progress}
        />
        <div className="flex justify-between text-[10px] text-muted/50">
          <FormattedDate iso={startAt} dateOnly />
          <FormattedDate iso={endAt} dateOnly />
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-1.5 py-1">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-dim">
          {label("timeSection", false)}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-xl font-bold tabular-nums tracking-tight text-sky-400 sm:text-2xl">
            {clampedPercent.toFixed(7)}
          </span>
          <span className="text-xs font-semibold text-sky-400/60 sm:text-sm">%</span>
        </div>
      </div>

      <div className="relative h-5 overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-border">
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-sky-700 via-sky-400 to-cyan-300"
          style={{ width: `${clampedPercent}%` }}
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
