"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "wc-progress-nerd-mode";

interface NerdModeContextValue {
  nerdMode: boolean;
  setNerdMode: (value: boolean) => void;
  toggleNerdMode: () => void;
  ready: boolean;
}

const NerdModeContext = createContext<NerdModeContextValue | null>(null);

export function NerdModeProvider({ children }: { children: ReactNode }) {
  const [nerdMode, setNerdModeState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setNerdModeState(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* private browsing */
    }
    setReady(true);
  }, []);

  const setNerdMode = useCallback((value: boolean) => {
    setNerdModeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleNerdMode = useCallback(() => {
    setNerdModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <NerdModeContext.Provider
      value={{ nerdMode, setNerdMode, toggleNerdMode, ready }}
    >
      {children}
    </NerdModeContext.Provider>
  );
}

export function useNerdMode(): NerdModeContextValue {
  const ctx = useContext(NerdModeContext);
  if (!ctx) {
    throw new Error("useNerdMode must be used within NerdModeProvider");
  }
  return ctx;
}
