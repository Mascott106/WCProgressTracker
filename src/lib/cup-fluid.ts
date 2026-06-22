/** Canvas fluid sim clipped to a trophy cup silhouette. */

export interface CupFluidController {
  setTargetPercent(percent: number): void;
  triggerDrain(): void;
  reset(): void;
  getFillLevel(): number;
  isDraining(): boolean;
  destroy(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface CreateCupFluidOptions {
  canvas: HTMLCanvasElement;
  reducedMotion?: boolean;
  onFillLevelChange?: (level: number) => void;
}

const GRAVITY = 0.42;
const DAMPING = 0.9;
const MAX_PARTICLES = 320;
const FILL_EASE = 0.035;
const DRAIN_RATE = 0.028;
const POUR_SPAWN_RATE = 5;
const AREA_STEPS = 240;

interface CupAreaProfile {
  yBottom: number;
  yTop: number;
  samples: { y: number; cumArea: number }[];
  totalArea: number;
}

function traceTrophyPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.5;
  const s = Math.min(w, h);

  ctx.beginPath();
  // Base
  ctx.moveTo(cx - s * 0.22, h - s * 0.02);
  ctx.lineTo(cx + s * 0.22, h - s * 0.02);
  ctx.lineTo(cx + s * 0.18, h - s * 0.08);
  // Stem
  ctx.lineTo(cx + s * 0.06, h - s * 0.28);
  ctx.lineTo(cx + s * 0.06, h - s * 0.38);
  // Bowl right
  ctx.bezierCurveTo(
    cx + s * 0.42,
    h - s * 0.38,
    cx + s * 0.44,
    h - s * 0.72,
    cx + s * 0.28,
    h - s * 0.88,
  );
  // Rim
  ctx.bezierCurveTo(cx, h - s * 0.92, cx - s * 0.28, h - s * 0.88, cx - s * 0.28, h - s * 0.88);
  // Bowl left
  ctx.bezierCurveTo(
    cx - s * 0.44,
    h - s * 0.72,
    cx - s * 0.42,
    h - s * 0.38,
    cx - s * 0.06,
    h - s * 0.38,
  );
  ctx.lineTo(cx - s * 0.06, h - s * 0.28);
  ctx.lineTo(cx - s * 0.18, h - s * 0.08);
  ctx.closePath();
}

function trophyBounds(w: number, h: number) {
  const s = Math.min(w, h);
  const cx = w * 0.5;
  return {
    left: cx - s * 0.4,
    right: cx + s * 0.4,
    top: h - s * 0.9,
    bottom: h - s * 0.04,
    spoutX: cx,
    spoutY: Math.max(8, h - s * 0.98),
    bowlTop: h - s * 0.88,
    bowlBottom: h - s * 0.02,
  };
}

/** Precompute cross-section area from bottom to top so fill % matches visible area. */
function buildCupAreaProfile(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): CupAreaProfile {
  const bounds = trophyBounds(w, h);
  const yBottom = bounds.bowlBottom;
  const yTop = bounds.bowlTop;

  traceTrophyPath(ctx, w, h);

  const yCoords: number[] = [];
  const widths: number[] = [];

  for (let i = 0; i <= AREA_STEPS; i++) {
    const y = yBottom - (i / AREA_STEPS) * (yBottom - yTop);
    yCoords.push(y);

    let minX = bounds.right;
    let maxX = bounds.left;
    for (let x = bounds.left; x <= bounds.right; x += 2) {
      if (ctx.isPointInPath(x, y)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
    widths.push(maxX > minX ? maxX - minX : 0);
  }

  const samples: { y: number; cumArea: number }[] = [{ y: yBottom, cumArea: 0 }];
  let cum = 0;
  for (let i = 1; i <= AREA_STEPS; i++) {
    const dy = Math.abs(yCoords[i - 1] - yCoords[i]);
    cum += ((widths[i - 1] + widths[i]) / 2) * dy;
    samples.push({ y: yCoords[i], cumArea: cum });
  }

  return { yBottom, yTop, samples, totalArea: cum };
}

function surfaceYForFillLevel(profile: CupAreaProfile, fillLevel: number): number {
  const level = Math.min(1, Math.max(0, fillLevel));
  if (level <= 0) return profile.yBottom;
  if (level >= 1) return profile.yTop;

  const target = level * profile.totalArea;
  for (let i = 1; i < profile.samples.length; i++) {
    const prev = profile.samples[i - 1];
    const curr = profile.samples[i];
    if (curr.cumArea >= target) {
      const span = curr.cumArea - prev.cumArea;
      const t = span > 0 ? (target - prev.cumArea) / span : 0;
      return prev.y + t * (curr.y - prev.y);
    }
  }
  return profile.yTop;
}

/** Liquid rises from the bottom; fillLevel maps to cross-section area, not height. */
function liquidBounds(
  profile: CupAreaProfile,
  bounds: ReturnType<typeof trophyBounds>,
  fillLevel: number,
) {
  return {
    top: surfaceYForFillLevel(profile, fillLevel),
    bottom: bounds.bowlBottom,
  };
}

export function createCupFluid({
  canvas,
  reducedMotion = false,
  onFillLevelChange,
}: CreateCupFluidOptions): CupFluidController {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      setTargetPercent: () => {},
      triggerDrain: () => {},
      reset: () => {},
      getFillLevel: () => 0,
      isDraining: () => false,
      destroy: () => {},
    };
  }

  let targetLevel = 0;
  let fillLevel = 0;
  let draining = false;
  let particles: Particle[] = [];
  let frame = 0;
  let active = true;
  let wobble = 0;
  let lastReported = -1;
  let areaProfile: CupAreaProfile | null = null;
  let areaKey = "";

  const getAreaProfile = (w: number, h: number) => {
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (areaProfile && areaKey === key) return areaProfile;
    areaProfile = buildCupAreaProfile(ctx, w, h);
    areaKey = key;
    return areaProfile;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    areaKey = "";
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const spawnParticle = (bounds: ReturnType<typeof trophyBounds>) => {
    if (particles.length >= MAX_PARTICLES) return;
    particles.push({
      x: bounds.spoutX + (Math.random() - 0.5) * 10,
      y: bounds.spoutY + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.2 + Math.random() * 1.5,
    });
  };

  const tick = () => {
    if (!active) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const bounds = trophyBounds(w, h);
    const profile = getAreaProfile(w, h);

    if (draining) {
      fillLevel = Math.max(0, fillLevel - DRAIN_RATE);
      particles = particles.filter(() => Math.random() > 0.15);
      if (fillLevel <= 0.01) {
        draining = false;
        particles = [];
        fillLevel = 0;
      }
    } else {
      const target = Math.min(1, Math.max(0, targetLevel));
      fillLevel += (target - fillLevel) * FILL_EASE;
      if (!reducedMotion && fillLevel < target - 0.006) {
        for (let i = 0; i < POUR_SPAWN_RATE; i++) spawnParticle(bounds);
      }
    }

    wobble += 0.08;

    const liquid = liquidBounds(profile, bounds, fillLevel);
    const surfaceY = liquid.top;
    const hasLiquid = fillLevel > 0.004;

    if (!reducedMotion) {
      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < bounds.left + 4) {
          p.x = bounds.left + 4;
          p.vx *= -0.35;
        }
        if (p.x > bounds.right - 4) {
          p.x = bounds.right - 4;
          p.vx *= -0.35;
        }
        if (p.y > bounds.bowlBottom - 2) {
          p.y = bounds.bowlBottom - 2;
          p.vy *= -0.25;
          p.vx *= 0.9;
        }
        if (p.y < bounds.top) {
          p.y = bounds.top;
          p.vy *= 0.2;
        }

        const catchSurface = hasLiquid ? surfaceY : bounds.bowlBottom;
        if (p.y >= catchSurface - 3 && p.vy > 0) {
          p.y = catchSurface - 3;
          p.vy *= -0.1;
          p.vx *= 0.88;
        }
      }
    }

    ctx.clearRect(0, 0, w, h);

    // Trophy outline
    traceTrophyPath(ctx, w, h);
    ctx.save();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.75)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(15, 46, 31, 0.85)";
    ctx.fill();
    ctx.restore();

    // Liquid fill clipped to trophy — rises from the bottom
    ctx.save();
    traceTrophyPath(ctx, w, h);
    ctx.clip();

    if (hasLiquid) {
      const liquidGrad = ctx.createLinearGradient(
        0,
        liquid.top,
        0,
        liquid.bottom,
      );
      liquidGrad.addColorStop(0, "rgba(255, 220, 120, 0.98)");
      liquidGrad.addColorStop(0.35, "rgba(251, 191, 36, 0.95)");
      liquidGrad.addColorStop(1, "rgba(180, 83, 9, 0.9)");

      const waveAmp = reducedMotion ? 0 : 2.5 + Math.sin(wobble) * 2;
      const steps = 28;

      ctx.beginPath();
      ctx.moveTo(bounds.left - 12, liquid.bottom + 4);
      ctx.lineTo(bounds.right + 12, liquid.bottom + 4);
      ctx.lineTo(bounds.right + 12, liquid.top);

      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const x = bounds.left + t * (bounds.right - bounds.left);
        const y = liquid.top + Math.sin(t * Math.PI * 4 + wobble) * waveAmp;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = liquidGrad;
      ctx.fill();
    }

    if (!reducedMotion) {
      for (const p of particles) {
        const showAbove = hasLiquid ? surfaceY : bounds.bowlBottom;
        if (p.y <= showAbove + 10) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.vy > 2 ? 2.4 : 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 237, 180, 0.92)";
          ctx.fill();
        }
      }
    }

    ctx.restore();

    // Pour stream from above into the cup
    if (!reducedMotion && !draining && fillLevel < targetLevel - 0.006) {
      const pourTargetY = hasLiquid ? surfaceY : bounds.bowlBottom;
      const streamX = bounds.spoutX + Math.sin(wobble * 2.5) * 2;

      ctx.save();
      const pourGrad = ctx.createLinearGradient(
        0,
        bounds.spoutY,
        0,
        pourTargetY,
      );
      pourGrad.addColorStop(0, "rgba(255, 237, 180, 0.15)");
      pourGrad.addColorStop(0.15, "rgba(251, 191, 36, 0.75)");
      pourGrad.addColorStop(1, "rgba(251, 191, 36, 0.95)");

      ctx.strokeStyle = pourGrad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(streamX, bounds.spoutY);
      ctx.lineTo(streamX + Math.sin(wobble * 3) * 1.5, pourTargetY);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.moveTo(streamX - 1, bounds.spoutY);
      ctx.lineTo(streamX - 1, pourTargetY - 6);
      ctx.stroke();
      ctx.restore();
    }

    const rounded = Math.round(fillLevel * 1000) / 10;
    if (rounded !== lastReported) {
      lastReported = rounded;
      onFillLevelChange?.(fillLevel);
    }

    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    setTargetPercent(percent: number) {
      targetLevel = Math.min(100, Math.max(0, percent)) / 100;
    },
    triggerDrain() {
      draining = true;
      targetLevel = 0;
    },
    reset() {
      draining = false;
      fillLevel = 0;
      targetLevel = 0;
      particles = [];
    },
    getFillLevel() {
      return fillLevel;
    },
    isDraining() {
      return draining;
    },
    destroy() {
      active = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
    },
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
