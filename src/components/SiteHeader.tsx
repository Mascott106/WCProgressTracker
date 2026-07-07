"use client";

import { useNerdMode } from "@/contexts/NerdModeContext";
import { useFinalePreviewOptional } from "@/contexts/FinalePreviewContext";
import { useTranslation } from "@/contexts/LocaleContext";

export function SiteHeader() {
  const { nerdMode } = useNerdMode();
  const { t } = useTranslation();
  const preview = useFinalePreviewOptional();

  return (
    <header className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
          {t("header.eventName")}
        </p>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {t("progress.pageTitle", { nerd: nerdMode })}
        </h1>
      </div>

      <p className="text-xs text-muted/70 sm:text-right">
        {nerdMode ? (
          t("header.dateRangeNerd")
        ) : (
          <>
            {t("header.dateRangePrefix")}
            <button
              type="button"
              onClick={() => preview?.cyclePreview()}
              className="cursor-default hover:cursor-pointer hover:text-muted"
              aria-label={t("header.previewFinaleAria")}
            >
              {t("header.dateRangeEnd")}
            </button>
          </>
        )}
      </p>
    </header>
  );
}
