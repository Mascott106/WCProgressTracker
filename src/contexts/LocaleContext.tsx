"use client";

import { getMessage } from "@/i18n/get-message";
import { translateRoundName } from "@/i18n/rounds";
import { translateStatus } from "@/i18n/status";
import {
  localeToIntlTag,
  resolveLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/resolve-locale";
import { setViewerLocaleOverride } from "@/lib/format-datetime";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "wc-progress-locale";

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  ready: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
  } catch {
    /* private browsing */
  }
  return null;
}

function detectLocale(): SupportedLocale {
  if (typeof navigator !== "undefined" && navigator.language) {
    return resolveLocale(navigator.language);
  }
  return "en";
}

function HtmlLang({ locale }: { locale: SupportedLocale }) {
  useEffect(() => {
    document.documentElement.lang = localeToIntlTag(locale);
  }, [locale]);
  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored ?? detectLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    setViewerLocaleOverride(localeToIntlTag(locale));
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, ready }),
    [locale, setLocale, ready],
  );

  return (
    <LocaleContext.Provider value={value}>
      <HtmlLang locale={locale} />
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useTranslation() {
  const { locale, setLocale, ready } = useLocale();

  const t = useCallback(
    (
      path: string,
      options?: {
        nerd?: boolean;
        count?: number;
        vars?: Record<string, string | number>;
      },
    ) => getMessage(locale, path, options),
    [locale],
  );

  const scheduleMatchCount = useCallback(
    (count: number, nerdMode: boolean) =>
      getMessage(locale, nerdMode ? "schedule.matchCountNerd" : "schedule.matchCount", {
        count,
      }),
    [locale],
  );

  const translateRound = useCallback(
    (round: string) => translateRoundName(round, locale),
    [locale],
  );

  const translateStatusLabel = useCallback(
    (status: string) => translateStatus(status, locale),
    [locale],
  );

  return {
    locale,
    setLocale,
    ready,
    t,
    scheduleMatchCount,
    translateRound,
    translateStatus: translateStatusLabel,
  };
}
