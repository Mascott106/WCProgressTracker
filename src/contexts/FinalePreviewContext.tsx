"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type FinalePreviewPhase = "off" | "allNines" | "complete";

interface FinalePreviewContextValue {
  previewPhase: FinalePreviewPhase;
  cyclePreview: () => void;
  resetPreview: () => void;
}

const FinalePreviewContext = createContext<FinalePreviewContextValue | null>(
  null,
);

const CYCLE: FinalePreviewPhase[] = ["off", "allNines", "complete"];

export function FinalePreviewProvider({ children }: { children: ReactNode }) {
  const [previewPhase, setPreviewPhase] = useState<FinalePreviewPhase>("off");

  const cyclePreview = useCallback(() => {
    setPreviewPhase((prev) => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length]!;
    });
  }, []);

  const resetPreview = useCallback(() => {
    setPreviewPhase("off");
  }, []);

  return (
    <FinalePreviewContext.Provider
      value={{ previewPhase, cyclePreview, resetPreview }}
    >
      {children}
    </FinalePreviewContext.Provider>
  );
}

export function useFinalePreview(): FinalePreviewContextValue {
  const ctx = useContext(FinalePreviewContext);
  if (!ctx) {
    throw new Error("useFinalePreview must be used within FinalePreviewProvider");
  }
  return ctx;
}

export function useFinalePreviewOptional(): FinalePreviewContextValue | null {
  return useContext(FinalePreviewContext);
}
