import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { jobStore } from "@/lib/server/dependencies";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const a = Buffer.from(token), b = Buffer.from(env.CLEANUP_SECRET);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  return Response.json({ removed: await jobStore.purgeExpired() });
}
