import { computeTimePercent } from "./time-progress";
import { isFinished, type TournamentTimePhase } from "./types";

export type { TournamentTimePhase };

/** Playing minutes in regulation. */
export const REGULAR_TIME_PLAY_MINUTES = 90;

/** Standard FIFA halftime break (wall clock). */
export const HALFTIME_BREAK_MINUTES = 15;

/** Conservative allowance for cooling/hydration breaks. Default 0 — folded into stoppage. */
export const HYDRATION_BREAK_ALLOWANCE_MINUTES = 0;

/** Wall-clock minutes into extra time before all-nines. Default 0 — fight starts ~at full time. */
export const ET_FIGHT_BUFFER_MINUTES = 0;

export const FINAL_OVERTIME_DISPLAY_PERCENT = 99.9999999;

const OVERTIME_RAMP_MS = 60 * 60_000;
const SHAKE_BASE_PERIOD_MS = 400;
const SHAKE_MAX_PERIOD_MS = 180;
const SHAKE_BASE_DISPLACEMENT_PX = 1;
const SHAKE_MAX_DISPLACEMENT_PX = 3;
const SHAKE_BASE_ROTATION_DEG = 0.3;
const SHAKE_MAX_ROTATION_DEG = 1.2;

export function tournamentTimeEndOffsetMinutes(): number {
  return (
    REGULAR_TIME_PLAY_MINUTES +
    HALFTIME_BREAK_MINUTES +
    HYDRATION_BREAK_ALLOWANCE_MINUTES +
    ET_FIGHT_BUFFER_MINUTES
  );
}

/** Final kickoff ISO + composed wall-clock offset. */
export function tournamentTimeEndAt(finalKickoffIso: string): string {
  const kickoff = new Date(finalKickoffIso).getTime();
  const offsetMs = tournamentTimeEndOffsetMinutes() * 60_000;
  return new Date(kickoff + offsetMs).toISOString();
}

export function computeTournamentTimePercent(
  now: number,
  startAt: string,
  endAt: string,
  finalMatch: Pick<{ status: string }, "status"> | null | undefined,
): {
  percent: number;
  phase: TournamentTimePhase;
  shouldShake: boolean;
  overtimeMs: number;
} {
  if (finalMatch && isFinished(finalMatch.status)) {
    return {
      percent: 100,
      phase: "complete",
      shouldShake: false,
      overtimeMs: 0,
    };
  }

  const endMs = new Date(endAt).getTime();
  if (now >= endMs) {
    return {
      percent: FINAL_OVERTIME_DISPLAY_PERCENT,
      phase: "finalOvertime",
      shouldShake: true,
      overtimeMs: now - endMs,
    };
  }

  return {
    percent: computeTimePercent(now, startAt, endAt),
    phase: "normal",
    shouldShake: false,
    overtimeMs: 0,
  };
}

function shakeIntensity(overtimeMs: number): number {
  return Math.min(1, overtimeMs / OVERTIME_RAMP_MS);
}

/** Maps overtime duration to shake params with hard caps (readable at all times). */
export function computeShakeMotion(
  overtimeMs: number,
  now: number,
): { translateX: number; translateY: number; rotateDeg: number } {
  const intensity = shakeIntensity(overtimeMs);
  const displacement =
    SHAKE_BASE_DISPLACEMENT_PX +
    intensity * (SHAKE_MAX_DISPLACEMENT_PX - SHAKE_BASE_DISPLACEMENT_PX);
  const rotation =
    SHAKE_BASE_ROTATION_DEG +
    intensity * (SHAKE_MAX_ROTATION_DEG - SHAKE_BASE_ROTATION_DEG);
  const periodMs =
    SHAKE_BASE_PERIOD_MS -
    intensity * (SHAKE_BASE_PERIOD_MS - SHAKE_MAX_PERIOD_MS);
  const phase = (now / periodMs) * Math.PI * 2;

  return {
    translateX: Math.sin(phase * 1.7) * displacement,
    translateY: Math.cos(phase * 2.3) * displacement * 0.6,
    rotateDeg: Math.sin(phase * 1.1) * rotation,
  };
}

/** Preview demo: ramp overtime so shake is visible immediately. */
export function previewOvertimeMs(now: number): number {
  return 120_000 + (now % 600_000);
}
