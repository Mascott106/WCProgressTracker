"use client";

import { useEffect, useState } from "react";
import { FormattedDate } from "@/components/FormattedDate";

interface TimeProgressBarProps {
  startAt: string;
  endAt: string;
  initialPercent: number;
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
  initialPercent,
}: TimeProgressBarProps) {
  const [percent, setPercent] = useState(initialPercent);

  useEffect(() => {
    const update = () => setPercent(computePercent(Date.now(), startAt, endAt));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startAt, endAt]);

  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="shrink-0 space-y-1.5 py-1">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-dim">
          Real time
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-sky-400">
            {clampedPercent.toFixed(7)}
          </span>
          <span className="text-sm font-semibold text-sky-400/60">%</span>
        </div>
      </div>

      <div className="relative h-5 overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-border">
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-sky-700 via-sky-400 to-cyan-300 transition-all duration-1000 ease-linear"
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
