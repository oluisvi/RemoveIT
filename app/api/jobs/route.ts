import { env } from "@/lib/env";
import { jobService, requestSession } from "@/lib/server/dependencies";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    if (form.get("authorized") !== "true") return Response.json({ error: "Confirme que possui ou tem autorização para editar esta imagem." }, { status: 400 });
    const file = form.get("image");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    const job = await jobService.create(requestSession(request), Buffer.from(await file.arrayBuffer()), file.name, env.JOB_TTL_MINUTES);
    return Response.json({ jobId: job.id, status: job.status, imageUrl: `/api/jobs/${job.id}/result?asset=original`, maskUrl: `/api/jobs/${job.id}/result?asset=mask`, confidence: job.confidence, warnings: job.warnings });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 422 });
  }
}
