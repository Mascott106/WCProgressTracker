"use client";

import { CupModeProvider } from "@/contexts/CupModeContext";
import { NerdModeProvider } from "@/contexts/NerdModeContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NerdModeProvider>
      <CupModeProvider>{children}</CupModeProvider>
    </NerdModeProvider>
  );
}
