import { jobStore, requestSession } from "@/lib/server/dependencies";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await jobStore.get(jobId, requestSession(request));
  if (!job) return Response.json({ error: "Trabalho não encontrado ou expirado." }, { status: 404 });
  return Response.json({ id: job.id, status: job.status, confidence: job.confidence, warnings: job.warnings, error: job.error, resultUrl: job.status === "complete" ? `/api/jobs/${job.id}/result` : undefined });
}

export async function DELETE(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  await jobStore.delete(jobId, requestSession(request));
  return new Response(null, { status: 204 });
}
