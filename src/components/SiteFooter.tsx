"use client";

import { useCupMode } from "@/contexts/CupModeContext";
import { useLocale, useTranslation } from "@/contexts/LocaleContext";
import { useNerdMode } from "@/contexts/NerdModeContext";
import {
  localePickerCode,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/resolve-locale";

const hiddenBtn =
  "cursor-default border-0 bg-transparent p-0 font-inherit text-[10px] text-muted/40 disabled:cursor-default";

export function SiteFooter() {
  const { toggleNerdMode, ready } = useNerdMode();
  const { cycleCupMode } = useCupMode();
  const { locale, setLocale, ready: localeReady } = useLocale();
  const { t } = useTranslation();

  return (
    <p className="mt-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 pt-4 text-center text-[10px] text-muted/40">
      {t("footer.builtBy")}{" "}
      <button
        type="button"
        onClick={toggleNerdMode}
        disabled={!ready}
        suppressHydrationWarning
        className={hiddenBtn}
      >
        Scott Mendenko
      </button>
      <button
        type="button"
        onClick={cycleCupMode}
        className={`ml-1 ${hiddenBtn}`}
        aria-label={t("cup.ariaFillTheCup")}
      >
        🏆
      </button>
      <span className="mx-1 text-muted/25">·</span>
      <label className="inline-flex items-center gap-1">
        <span className="sr-only">{t("footer.language")}</span>
        <select
          value={locale}
          disabled={!localeReady}
          suppressHydrationWarning
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
          className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-inherit text-[10px] uppercase tracking-wide text-muted/50 hover:text-muted/70 disabled:cursor-default"
          aria-label={t("footer.language")}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {localePickerCode(code)}
            </option>
          ))}
        </select>
      </label>
    </p>
  );
}
