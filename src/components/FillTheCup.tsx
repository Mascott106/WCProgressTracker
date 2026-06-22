"use client";

import { useEffect, useRef, useState } from "react";
import type { CupMode } from "@/contexts/CupModeContext";
import { useProgressData } from "@/hooks/useProgressData";
import {
  createCupFluid,
  prefersReducedMotion,
  type CupFluidController,
} from "@/lib/cup-fluid";
import { computeTimePercent } from "@/lib/time-progress";

interface FillTheCupProps {
  mode: Extract<CupMode, "cup-match" | "cup-time">;
}

export function FillTheCup({ mode }: FillTheCupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<CupFluidController | null>(null);
  const prevModeRef = useRef<CupMode | null>(null);
  const { data, loading, error, refresh, setLoading } = useProgressData();
  const [displayPercent, setDisplayPercent] = useState(0);
  const [activeMetric, setActiveMetric] = useState<"match" | "time">(
    mode === "cup-time" ? "time" : "match",
  );
  const [transitioning, setTransitioning] = useState(false);
  const [timeFillReady, setTimeFillReady] = useState(mode === "cup-time");
  const [fluidReady, setFluidReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || !data) return;

    const fluid = createCupFluid({
      canvas,
      reducedMotion: prefersReducedMotion(),
      onFillLevelChange: (level) => {
        setDisplayPercent(Math.round(level * 1000) / 10);
      },
    });
    fluidRef.current = fluid;
    setFluidReady(true);
    prevModeRef.current = null;

    return () => {
      fluid.destroy();
      fluidRef.current = null;
      setFluidReady(false);
      prevModeRef.current = null;
    };
  }, [loading, data]);

  useEffect(() => {
    const fluid = fluidRef.current;
    if (!fluid || !data || !fluidReady) return;

    const prev = prevModeRef.current;

    if (prev === mode) {
      if (mode === "cup-match") {
        fluid.setTargetPercent(data.progressPercent);
      }
      return;
    }

    if (mode === "cup-match") {
      fluid.reset();
      fluid.setTargetPercent(data.progressPercent);
      setActiveMetric("match");
      setTransitioning(false);
      setTimeFillReady(false);
    } else if (mode === "cup-time") {
      setTimeFillReady(false);
      if (prev === "cup-match") {
        setTransitioning(true);
        fluid.triggerDrain();
        let frame = 0;
        let raf = 0;
        const waitDrain = () => {
          frame++;
          if (fluid.getFillLevel() <= 0.02 || frame > 150) {
            const pct = computeTimePercent(
              Date.now(),
              data.timeProgress.startAt,
              data.timeProgress.endAt,
            );
            fluid.setTargetPercent(pct);
            setActiveMetric("time");
            setTransitioning(false);
            setTimeFillReady(true);
            return;
          }
          raf = requestAnimationFrame(waitDrain);
        };
        raf = requestAnimationFrame(waitDrain);
        prevModeRef.current = mode;
        return () => cancelAnimationFrame(raf);
      }
      const pct = computeTimePercent(
        Date.now(),
        data.timeProgress.startAt,
        data.timeProgress.endAt,
      );
      fluid.setTargetPercent(pct);
      setActiveMetric("time");
      setTransitioning(false);
      setTimeFillReady(true);
    }

    prevModeRef.current = mode;
  }, [mode, data, fluidReady]);

  useEffect(() => {
    if (mode !== "cup-time" || !data || !timeFillReady) return;

    let raf = 0;
    const tick = () => {
      const fluid = fluidRef.current;
      if (!fluid || fluid.isDraining()) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const pct = computeTimePercent(
        Date.now(),
        data.timeProgress.startAt,
        data.timeProgress.endAt,
      );
      fluid.setTargetPercent(pct);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, data, timeFillReady]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            refresh(true);
          }}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:bg-surface-elevated"
        >
          Retry
        </button>
      </div>
    );
  }

  const label =
    activeMetric === "match" ? "Game Progress" : "Campaign Time";

  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 py-6">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
          Fill The Cup
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
          {label}
        </h2>
        {transitioning ? (
          <p className="mt-1 text-sm text-muted/60">Emptying cup…</p>
        ) : (
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-accent sm:text-4xl">
            {displayPercent.toFixed(1)}
            <span className="text-lg text-accent/60 sm:text-2xl">%</span>
          </p>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="h-[min(52vh,420px)] w-full max-w-md shrink-0"
        aria-label={`Trophy filling to ${displayPercent.toFixed(1)} percent ${label}`}
      />

      <p className="text-[10px] text-muted/40">
        Click 🏆 to switch — game progress, campaign time, then dashboard
      </p>
    </div>
  );
}
