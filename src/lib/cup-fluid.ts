/** Canvas fluid sim clipped to a World Cup trophy silhouette. */

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

const GRAVITY = 0.35;
const DAMPING = 0.92;
const MAX_PARTICLES = 280;
const FILL_EASE = 0.04;
const DRAIN_RATE = 0.025;

/** Draw trophy in unit box (0,0)-(1,1); bowl interior roughly y 0.38–0.88 */
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
    spoutY: h - s * 0.94,
    bowlTop: h - s * 0.88,
    bowlBottom: h - s * 0.12,
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

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const spawnParticle = (bounds: ReturnType<typeof trophyBounds>) => {
    if (particles.length >= MAX_PARTICLES) return;
    particles.push({
      x: bounds.spoutX + (Math.random() - 0.5) * 8,
      y: bounds.spoutY,
      vx: (Math.random() - 0.5) * 1.2,
      vy: Math.random() * 0.5,
    });
  };

  const tick = () => {
    if (!active) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const bounds = trophyBounds(w, h);

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
      if (!reducedMotion && fillLevel < target - 0.008) {
        for (let i = 0; i < 3; i++) spawnParticle(bounds);
      }
    }

    wobble += 0.08;

    if (!reducedMotion) {
      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        const surfaceY =
          bounds.bowlBottom - fillLevel * (bounds.bowlBottom - bounds.bowlTop);

        if (p.x < bounds.left + 4) {
          p.x = bounds.left + 4;
          p.vx *= -0.4;
        }
        if (p.x > bounds.right - 4) {
          p.x = bounds.right - 4;
          p.vx *= -0.4;
        }
        if (p.y > bounds.bowlBottom - 2) {
          p.y = bounds.bowlBottom - 2;
          p.vy *= -0.3;
        }
        if (p.y < bounds.top) {
          p.y = bounds.top;
          p.vy *= -0.2;
        }
        if (p.y >= surfaceY - 2 && p.vy > 0) {
          p.y = surfaceY - 2;
          p.vy *= -0.15;
          p.vx *= 0.85;
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

    // Liquid fill clipped to trophy
    const surfaceY =
      bounds.bowlBottom - fillLevel * (bounds.bowlBottom - bounds.bowlTop);

    ctx.save();
    traceTrophyPath(ctx, w, h);
    ctx.clip();

    const liquidGrad = ctx.createLinearGradient(0, surfaceY, 0, bounds.bowlBottom);
    liquidGrad.addColorStop(0, "rgba(251, 191, 36, 0.95)");
    liquidGrad.addColorStop(0.5, "rgba(234, 179, 8, 0.9)");
    liquidGrad.addColorStop(1, "rgba(180, 83, 9, 0.85)");

    ctx.beginPath();
    ctx.moveTo(bounds.left - 10, bounds.bowlBottom + 5);
    ctx.lineTo(bounds.right + 10, bounds.bowlBottom + 5);
    ctx.lineTo(bounds.right + 10, surfaceY);

    const waveAmp = reducedMotion ? 0 : 3 + Math.sin(wobble) * 2;
    const steps = 24;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = bounds.left + t * (bounds.right - bounds.left);
      const y = surfaceY + Math.sin(t * Math.PI * 4 + wobble) * waveAmp;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = liquidGrad;
    ctx.fill();

    if (!reducedMotion) {
      for (const p of particles) {
        if (p.y >= surfaceY - 4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 237, 180, 0.9)";
          ctx.fill();
        }
      }
    }

    ctx.restore();

    // Pour stream
    if (!reducedMotion && !draining && fillLevel < targetLevel - 0.008) {
      ctx.save();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bounds.spoutX, bounds.spoutY + 4);
      ctx.lineTo(bounds.spoutX + Math.sin(wobble * 2) * 2, surfaceY - 8);
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
