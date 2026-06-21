import { ProgressDashboard } from "@/components/ProgressDashboard";

export default function Home() {
  return (
    <main className="field-pattern flex min-h-screen flex-col px-4 py-4 sm:px-10 sm:py-5">
      <header className="mb-3 flex shrink-0 flex-col items-start gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
            FIFA World Cup 2026
          </p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Tournament Progress
          </h1>
        </div>
        <p className="text-xs text-muted/70 sm:text-right">
          104 matches · June 11 – July 19
        </p>
      </header>

      <ProgressDashboard />
    </main>
  );
}
