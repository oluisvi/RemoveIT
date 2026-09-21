import { readFile } from "node:fs/promises";
import { jobService, requestSession } from "@/lib/server/dependencies";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    const job = await jobService.require(jobId, requestSession(request));
    const asset = new URL(request.url).searchParams.get("asset");
    const path = asset === "original" ? job.originalPath : asset === "mask" ? job.maskPath : job.resultPath;
    if (!path) return Response.json({ error: "Resultado indisponível." }, { status: 404 });
    return new Response(new Uint8Array(await readFile(path)), { headers: { "Content-Type": asset === "original" ? (job.mime || "image/png") : "image/png", "Cache-Control": "private, no-store" } });
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 404 }); }
}
