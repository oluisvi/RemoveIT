import { InferenceTimeoutError } from "@/lib/inference/http-provider";
import { jobService, requestSession } from "@/lib/server/dependencies";

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const job = await jobService.process(jobId, requestSession(request));
    return Response.json({ id: job.id, status: job.status, resultUrl: `/api/jobs/${job.id}/result` });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: error instanceof InferenceTimeoutError ? 504 : 502 });
  }
}
