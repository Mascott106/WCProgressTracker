"use client";

import { FillTheCup } from "@/components/FillTheCup";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useCupMode } from "@/contexts/CupModeContext";
import {
  FinalePreviewProvider,
  useFinalePreview,
} from "@/contexts/FinalePreviewContext";
import { useEffect } from "react";

function HomeContent() {
  const { cupMode } = useCupMode();
  const { resetPreview } = useFinalePreview();

  useEffect(() => {
    if (cupMode !== "dashboard") {
      resetPreview();
    }
  }, [cupMode, resetPreview]);

  return (
    <main className="field-pattern flex min-h-screen w-full flex-col px-4 py-4 sm:px-10 sm:py-5">
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

export function HomeClient() {
  return (
    <FinalePreviewProvider>
      <HomeContent />
    </FinalePreviewProvider>
  );
}
