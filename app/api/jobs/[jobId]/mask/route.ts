import { jobService, requestSession } from "@/lib/server/dependencies";

export async function PUT(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const job = await jobService.saveMask(jobId, requestSession(request), Buffer.from(await request.arrayBuffer()));
    return Response.json({ id: job.id, status: job.status });
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 422 }); }
}
