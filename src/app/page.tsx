import { ProgressDashboard } from "@/components/ProgressDashboard";

export default function Home() {
  return (
    <main className="field-pattern flex min-h-screen flex-col px-10 py-5">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
            FIFA World Cup 2026
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Tournament Progress</h1>
        </div>
        <p className="text-right text-xs text-muted/70">
          104 matches · June 11 – July 19
        </p>
      </header>

      <ProgressDashboard />
    </main>
  );
}
