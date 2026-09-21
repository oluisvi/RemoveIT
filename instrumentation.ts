export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { jobStore } = await import("@/lib/server/dependencies");
  const timer = setInterval(() => void jobStore.purgeExpired(), 5 * 60_000);
  timer.unref();
}
