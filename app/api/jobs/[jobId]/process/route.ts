import { InferenceTimeoutError } from "@/lib/inference/http-provider";
import { jobService, processingLimiter, requestSession } from "@/lib/server/dependencies";
import { RateLimitError } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const session = requestSession(request); processingLimiter.consume(session);
    const job = await jobService.process(jobId, session);
    return Response.json({ id: job.id, status: job.status, resultUrl: `/api/jobs/${job.id}/result` });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: error instanceof RateLimitError ? 429 : error instanceof InferenceTimeoutError ? 504 : 502 });
  }
}
