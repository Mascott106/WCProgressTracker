"use client";

import { CupModeProvider } from "@/contexts/CupModeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { NerdModeProvider } from "@/contexts/NerdModeContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <NerdModeProvider>
        <CupModeProvider>{children}</CupModeProvider>
      </NerdModeProvider>
    </LocaleProvider>
  );
}
