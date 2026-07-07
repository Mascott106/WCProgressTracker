"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { prefersReducedMotion } from "@/lib/cup-fluid";

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

const DURATION_MS = 7500;
const BURST_INTERVAL_MS = 450;

interface TournamentFireworksProps {
  show: boolean;
  onDone?: () => void;
}

export function TournamentFireworks({ show, onDone }: TournamentFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!show || !mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let active = true;
    const start = performance.now();
    let lastBurst = start;
    let particles: FireworkParticle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnBurst = (x: number, y: number) => {
      const count = reduced ? 12 : 36;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = reduced ? 1.5 : 2.5 + Math.random() * 3;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 900 + Math.random() * 700,
          hue: 35 + Math.random() * 50,
          size: reduced ? 2 : 2 + Math.random() * 2,
        });
      }
    };

    if (reduced) {
      spawnBurst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    }

    const tick = (now: number) => {
      if (!active) return;
      const elapsed = now - start;
      if (elapsed >= DURATION_MS) {
        active = false;
        onDoneRef.current?.();
        return;
      }

      if (!reduced && now - lastBurst >= BURST_INTERVAL_MS) {
        lastBurst = now;
        const x = window.innerWidth * (0.15 + Math.random() * 0.7);
        const y = window.innerHeight * (0.15 + Math.random() * 0.45);
        spawnBurst(x, y);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => {
        p.life += 16;
        p.vy += 0.04;
        p.x += p.vx;
        p.y += p.vy;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [show, mounted]);

  if (!show || !mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>,
    document.body,
  );
}