"use client";

import { CupModeProvider } from "@/contexts/CupModeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { NerdModeProvider } from "@/contexts/NerdModeContext";
import { TimeZoneProvider } from "@/contexts/TimeZoneContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <TimeZoneProvider>
        <NerdModeProvider>
          <CupModeProvider>{children}</CupModeProvider>
        </NerdModeProvider>
      </TimeZoneProvider>
    </LocaleProvider>
  );
}
