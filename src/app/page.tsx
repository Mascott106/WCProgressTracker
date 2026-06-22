import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="field-pattern flex min-h-screen flex-col px-4 py-4 sm:px-10 sm:py-5">
      <SiteHeader />

      <ProgressDashboard />

      <SiteFooter />
    </main>
  );
}
