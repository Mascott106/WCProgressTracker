"use client";

import { useCupMode } from "@/contexts/CupModeContext";
import { useLocale, useTranslation } from "@/contexts/LocaleContext";
import { useNerdMode } from "@/contexts/NerdModeContext";
import {
  useTimeZone,
  useTimeZonePickerOptions,
} from "@/contexts/TimeZoneContext";
import {
  localePickerCode,
  localeToIntlTag,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/resolve-locale";
import {
  TIMEZONE_AUTO,
  timeZonePickerCode,
  type TimeZoneSelection,
} from "@/lib/timezones";

const hiddenBtn =
  "cursor-default border-0 bg-transparent p-0 font-inherit text-[10px] text-muted/40 disabled:cursor-default";

const selectClass =
  "min-w-0 max-w-[9rem] cursor-pointer appearance-none truncate border-0 bg-transparent p-0 font-inherit text-[10px] uppercase tracking-wide text-muted/50 hover:text-muted/70 disabled:cursor-default";

export function SiteFooter() {
  const { toggleNerdMode, ready } = useNerdMode();
  const { cycleCupMode } = useCupMode();
  const { locale, setLocale, ready: localeReady } = useLocale();
  const { selection, setSelection, timeZone, nowMs, ready: timeZoneReady } =
    useTimeZone();
  const { t } = useTranslation();
  const timeZoneOptions = useTimeZonePickerOptions(locale);
  const intlLocale = localeToIntlTag(locale);

  const autoLabel =
    selection === TIMEZONE_AUTO
      ? `${t("footer.timezoneAuto")} (${timeZonePickerCode(timeZone, intlLocale, nowMs)})`
      : t("footer.timezoneAuto");

  return (
    <footer className="mt-auto w-full self-stretch pt-4 text-center">
      <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-[10px] text-muted/40">
        <span>{t("footer.builtBy")}</span>
        <button
          type="button"
          onClick={toggleNerdMode}
          disabled={!ready}
          suppressHydrationWarning
          className={`${hiddenBtn} hover:cursor-pointer hover:text-muted/70`}
        >
          Scott Mendenko
        </button>
        <button
          type="button"
          onClick={cycleCupMode}
          className={hiddenBtn}
          aria-label={t("cup.ariaFillTheCup")}
        >
          🏆
        </button>
        <span className="text-muted/25">·</span>
        <label className="inline-flex min-w-0 max-w-full items-center gap-1">
          <span className="sr-only">{t("footer.language")}</span>
          <select
            value={locale}
            disabled={!localeReady}
            suppressHydrationWarning
            onChange={(e) => setLocale(e.target.value as SupportedLocale)}
            className={selectClass}
            aria-label={t("footer.language")}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {localePickerCode(code)}
              </option>
            ))}
          </select>
        </label>
        <span className="text-muted/25">·</span>
        <label className="inline-flex min-w-0 max-w-full items-center gap-1">
          <span className="sr-only">{t("footer.timezone")}</span>
          <select
            value={selection}
            disabled={!timeZoneReady}
            suppressHydrationWarning
            onChange={(e) =>
              setSelection(e.target.value as TimeZoneSelection)
            }
            className={selectClass}
            aria-label={t("footer.timezone")}
          >
            <option value={TIMEZONE_AUTO}>{autoLabel}</option>
            {timeZoneOptions.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </footer>
  );
}
