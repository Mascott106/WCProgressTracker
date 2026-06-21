export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { warmProgressCacheOnStartup } = await import("@/lib/football-data");
  await warmProgressCacheOnStartup();
}
