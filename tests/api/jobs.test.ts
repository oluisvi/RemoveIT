import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, expect, it, vi } from "vitest";
import { FileJobStore } from "@/lib/jobs/file-job-store";
import { JobService } from "@/lib/jobs/job-service";
import { InferenceTimeoutError } from "@/lib/inference/http-provider";

let root = "";
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }); });

it("mantém a máscara e volta à revisão após timeout", async () => {
  root = await mkdtemp(join(tmpdir(), "removeit-api-"));
  const store = new FileJobStore(root);
  const provider = { detect: vi.fn(), inpaint: vi.fn().mockRejectedValue(new InferenceTimeoutError()) };
  const service = new JobService(store, provider, root);
  const job = await store.create({ sessionId: "s1", expiresAt: new Date(Date.now() + 60_000).toISOString(), width: 2, height: 2, mime: "image/png" });
  const originalPath = join(root, job.id, "original.png");
  const maskPath = join(root, job.id, "mask.png");
  await writeFile(originalPath, await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer());
  await writeFile(maskPath, await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).greyscale().png().toBuffer());
  await store.update(job.id, "s1", { status: "review", originalPath, maskPath });
  await expect(service.process(job.id, "s1")).rejects.toBeInstanceOf(InferenceTimeoutError);
  expect((await store.get(job.id, "s1"))?.status).toBe("review");
  expect((await readFile(maskPath)).byteLength).toBeGreaterThan(0);
});
