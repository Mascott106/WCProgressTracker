export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { clearApiCache } = await import("@/lib/football-data");
  await clearApiCache();
}
