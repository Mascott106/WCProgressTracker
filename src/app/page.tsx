import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="field-pattern flex min-h-screen flex-col px-4 py-4 sm:px-10 sm:py-5">
      <SiteHeader />

      <ProgressDashboard />

      <p className="mt-auto pt-4 text-center text-[10px] text-muted/40">
        Built by Scott Mendenko
      </p>
    </main>
  );
}
