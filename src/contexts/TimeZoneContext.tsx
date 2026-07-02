"use client";

import {
  getSystemTimeZone,
  setViewerTimeZoneOverride,
} from "@/lib/format-datetime";
import {
  formatTimeZonePickerLabel,
  PICKER_TIMEZONES,
  parseStoredTimeZone,
  TIMEZONE_AUTO,
  type TimeZoneSelection,
} from "@/lib/timezones";
import { localeToIntlTag, type SupportedLocale } from "@/i18n/resolve-locale";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "wc-progress-timezone";

interface TimeZoneContextValue {
  /** Resolved IANA zone used for display and schedule bucketing. */
  timeZone: string;
  /** Picker value: "auto" or a curated IANA zone. */
  selection: TimeZoneSelection;
  setSelection: (selection: TimeZoneSelection) => void;
  ready: boolean;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

function readStoredSelection(): TimeZoneSelection {
  try {
    return parseStoredTimeZone(localStorage.getItem(STORAGE_KEY));
  } catch {
    return TIMEZONE_AUTO;
  }
}

function resolveEffectiveTimeZone(
  selection: TimeZoneSelection,
  systemTimeZone: string,
): string {
  return selection === TIMEZONE_AUTO ? systemTimeZone : selection;
}

export function TimeZoneProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<TimeZoneSelection>(TIMEZONE_AUTO);
  const [systemTimeZone, setSystemTimeZone] = useState(getSystemTimeZone);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelectionState(readStoredSelection());
    setSystemTimeZone(getSystemTimeZone());
    setReady(true);
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = getSystemTimeZone();
      setSystemTimeZone((prev) => (prev === next ? prev : next));
    };

    document.addEventListener("visibilitychange", sync);
    const interval = window.setInterval(sync, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(interval);
    };
  }, []);

  const timeZone = resolveEffectiveTimeZone(selection, systemTimeZone);

  useEffect(() => {
    setViewerTimeZoneOverride(timeZone);
  }, [timeZone]);

  const setSelection = useCallback((next: TimeZoneSelection) => {
    setSelectionState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ timeZone, selection, setSelection, ready }),
    [timeZone, selection, setSelection, ready],
  );

  return (
    <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>
  );
}

export function useTimeZone(): TimeZoneContextValue {
  const ctx = useContext(TimeZoneContext);
  if (!ctx) {
    throw new Error("useTimeZone must be used within TimeZoneProvider");
  }
  return ctx;
}

/** Footer timezone picker options with localized labels. */
export function useTimeZonePickerOptions(locale: SupportedLocale) {
  const intlLocale = localeToIntlTag(locale);
  return useMemo(
    () =>
      PICKER_TIMEZONES.map((zone) => ({
        id: zone,
        label: formatTimeZonePickerLabel(zone, intlLocale),
      })),
    [intlLocale],
  );
}
