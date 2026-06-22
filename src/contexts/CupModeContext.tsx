"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type CupMode = "dashboard" | "cup-match" | "cup-time";

const CYCLE: CupMode[] = ["dashboard", "cup-match", "cup-time"];

interface CupModeContextValue {
  cupMode: CupMode;
  cycleCupMode: () => void;
}

const CupModeContext = createContext<CupModeContextValue | null>(null);

export function CupModeProvider({ children }: { children: ReactNode }) {
  const [cupMode, setCupMode] = useState<CupMode>("dashboard");

  const cycleCupMode = useCallback(() => {
    setCupMode((prev) => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length]!;
    });
  }, []);

  return (
    <CupModeContext.Provider value={{ cupMode, cycleCupMode }}>
      {children}
    </CupModeContext.Provider>
  );
}

export function useCupMode(): CupModeContextValue {
  const ctx = useContext(CupModeContext);
  if (!ctx) {
    throw new Error("useCupMode must be used within CupModeProvider");
  }
  return ctx;
}
