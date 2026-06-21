"use client";

import { NerdModeProvider } from "@/contexts/NerdModeContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <NerdModeProvider>{children}</NerdModeProvider>;
}
