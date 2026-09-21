import { env } from "@/lib/env";
import { creationLimiter, issueSession, jobService, jobStore, originLimiter, requestSession } from "@/lib/server/dependencies";
import { RateLimitError } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    if (form.get("authorized") !== "true") return Response.json({ error: "Confirme que possui ou tem autorização para editar esta imagem." }, { status: 400 });
    const file = form.get("image");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    await jobStore.purgeExpired();
    const current = requestSession(request); const session = current === "anonymous" || current === "invalid" ? issueSession() : { id: current, cookie: undefined };
    originLimiter.consume(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local");
    creationLimiter.consume(session.id);
    const job = await jobService.create(session.id, Buffer.from(await file.arrayBuffer()), file.name, env.JOB_TTL_MINUTES);
    const response = Response.json({ jobId: job.id, status: job.status, imageUrl: `/api/jobs/${job.id}/result?asset=original`, maskUrl: `/api/jobs/${job.id}/result?asset=mask`, confidence: job.confidence, warnings: job.warnings });
    if (session.cookie) response.headers.set("Set-Cookie", session.cookie); return response;
  } catch (error) {
    const status = error instanceof RateLimitError ? 429 : 422; const response = Response.json({ error: (error as Error).message }, { status }); if (error instanceof RateLimitError) response.headers.set("Retry-After", String(error.retryAfter)); return response;
  }
}
