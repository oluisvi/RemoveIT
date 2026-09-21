import { InferenceTimeoutError } from "@/lib/inference/http-provider";
import { jobService, processingLimiter, requestSession } from "@/lib/server/dependencies";
import { RateLimitError } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const session = requestSession(request);
    processingLimiter.consume(session);
    const job = await jobService.redetect(jobId, session);
    return Response.json({
      jobId: job.id,
      status: job.status,
      imageUrl: `/api/jobs/${job.id}/result?asset=original`,
      maskUrl: `/api/jobs/${job.id}/result?asset=mask&v=${encodeURIComponent(job.updatedAt)}`,
      confidence: job.confidence,
      warnings: job.warnings,
    });
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: error instanceof RateLimitError ? 429 : error instanceof InferenceTimeoutError ? 504 : 502 },
    );
  }
}
