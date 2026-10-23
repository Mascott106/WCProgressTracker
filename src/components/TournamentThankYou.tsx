"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/contexts/LocaleContext";

interface TournamentThankYouProps {
  show: boolean;
  onClose: () => void;
}

export function TournamentThankYou({ show, onClose }: TournamentThankYouProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!show) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="thank-you-backdrop fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
      onClick={onClose}
    >
      <div
        className="thank-you-panel relative w-full max-w-md overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-b from-surface-elevated via-surface to-[#0a1f14] px-6 py-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-12 h-44 w-44 rounded-full bg-muted-dim/10 blur-3xl"
          aria-hidden
        />

        <p className="thank-you-flag relative text-5xl leading-none sm:text-6xl" aria-hidden>
          🇧🇷
        </p>

        <p className="relative mt-3 text-[10px] font-medium uppercase tracking-[0.28em] text-accent">
          FIFA World Cup 2026
        </p>

        <h2
          id="thank-you-title"
          className="thank-you-title-shimmer relative mt-2 text-xl font-bold tracking-tight sm:text-2xl"
        >
          {t("thankYou.title")}
        </h2>

        <p className="relative mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">
          {t("thankYou.body")}
        </p>

        <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
          <span aria-hidden>⚽</span>
          {t("thankYou.badge")}
        </div>

        <div className="relative mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gradient-to-r from-accent-dim via-accent to-yellow-300 px-5 py-2.5 text-sm font-bold text-background shadow-[0_0_24px_rgba(251,191,36,0.35)] transition hover:brightness-110"
          >
            {t("thankYou.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
