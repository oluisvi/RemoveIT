import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import type { Job } from "@/lib/contracts/job";
import { normalizeImage } from "@/lib/images/normalize-image";
import type { InferenceProvider } from "@/lib/inference/provider";
import type { JobStore } from "@/lib/jobs/job-store";

export class JobService {
  constructor(private readonly store: JobStore, private readonly provider: InferenceProvider, private readonly root: string, private readonly timeoutMs = 90_000) {}

  async create(sessionId: string, input: Buffer, filename: string, ttlMinutes = 30): Promise<Job> {
    const normalized = await normalizeImage(input);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
    const job = await this.store.create({ sessionId, expiresAt, mime: normalized.mime, width: normalized.width, height: normalized.height });
    const dir = join(this.root, job.id);
    await mkdir(dir, { recursive: true });
    const originalPath = join(dir, normalized.mime === "image/png" ? "original.png" : "original.jpg");
    await writeFile(originalPath, normalized.buffer);
    const detection = await this.provider.detect(normalized.buffer, AbortSignal.timeout(this.timeoutMs));
    const maskPath = join(dir, "mask.png");
    await writeFile(maskPath, detection.mask);
    return this.store.update(job.id, sessionId, { status: "review", originalPath, maskPath, confidence: detection.confidence, warnings: detection.warnings });
  }

  async saveMask(id: string, sessionId: string, mask: Buffer): Promise<Job> {
    const job = await this.require(id, sessionId);
    if (!job.width || !job.height || !job.maskPath) throw new Error("Trabalho incompleto.");
    const metadata = await sharp(mask).metadata();
    if (metadata.width !== job.width || metadata.height !== job.height) throw new Error("A máscara deve ter as mesmas dimensões da imagem.");
    await writeFile(job.maskPath, await sharp(mask).greyscale().png().toBuffer());
    return this.store.update(id, sessionId, { status: "review" });
  }

  async redetect(id: string, sessionId: string): Promise<Job> {
    const job = await this.require(id, sessionId);
    if (!job.originalPath || !job.maskPath) throw new Error("Trabalho incompleto.");
    const detection = await this.provider.detect(await readFile(job.originalPath), AbortSignal.timeout(this.timeoutMs));
    await writeFile(job.maskPath, detection.mask);
    return this.store.update(id, sessionId, {
      status: "review",
      confidence: detection.confidence,
      warnings: detection.warnings,
      error: undefined,
    });
  }

  async process(id: string, sessionId: string): Promise<Job> {
    const job = await this.require(id, sessionId);
    if (!job.originalPath || !job.maskPath) throw new Error("Trabalho incompleto.");
    await this.store.update(id, sessionId, { status: "processing", error: undefined });
    try {
      const result = await this.provider.inpaint(await readFile(job.originalPath), await readFile(job.maskPath), AbortSignal.timeout(this.timeoutMs));
      const resultPath = join(dirname(job.originalPath), "result.png");
      await writeFile(resultPath, result);
      return await this.store.update(id, sessionId, { status: "complete", resultPath });
    } catch (error) {
      await this.store.update(id, sessionId, { status: "review", error: (error as Error).message });
      throw error;
    }
  }

  async require(id: string, sessionId: string): Promise<Job> {
    const job = await this.store.get(id, sessionId);
    if (!job) throw new Error("Trabalho não encontrado.");
    return job;
  }
}
