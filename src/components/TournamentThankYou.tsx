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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-surface px-5 py-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="thank-you-title"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          {t("thankYou.title")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("thankYou.body")}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40 hover:text-accent"
          >
            {t("thankYou.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
