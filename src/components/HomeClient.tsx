"use client";

import { FillTheCup } from "@/components/FillTheCup";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useCupMode } from "@/contexts/CupModeContext";

export function HomeClient() {
  const { cupMode } = useCupMode();

  return (
    <main className="field-pattern flex min-h-screen flex-col px-4 py-4 sm:px-10 sm:py-5">
      <SiteHeader />

      {cupMode === "dashboard" ? (
        <ProgressDashboard />
      ) : (
        <FillTheCup mode={cupMode} />
      )}

      <SiteFooter />
    </main>
  );
}
