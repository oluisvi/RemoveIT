import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileJobStore } from "@/lib/jobs/file-job-store";

describe("FileJobStore", () => {
  let tempDir: string;
  const clock = () => new Date("2026-09-20T12:00:00Z");

  beforeEach(async () => { tempDir = await mkdtemp(join(tmpdir(), "removeit-test-")); });
  afterEach(async () => { await rm(tempDir, { recursive: true, force: true }); });

  it("remove todos os artefatos quando o trabalho expira", async () => {
    const store = new FileJobStore(tempDir, clock);
    const job = await store.create({ sessionId: "s1", expiresAt: "2026-09-20T11:59:00Z" });
    await writeFile(join(tempDir, job.id, "original.png"), "pixels");
    await store.purgeExpired();
    await expect(store.get(job.id, "s1")).resolves.toBeNull();
    expect(await readdir(tempDir)).toEqual([]);
  });

  it("isola trabalhos por sessão", async () => {
    const store = new FileJobStore(tempDir, clock);
    const job = await store.create({ sessionId: "owner", expiresAt: "2026-09-20T13:00:00Z" });
    await expect(store.get(job.id, "intruder")).resolves.toBeNull();
    await expect(store.get(job.id, "owner")).resolves.toMatchObject({ id: job.id });
  });

  it("atualiza e exclui somente o trabalho autorizado", async () => {
    const store = new FileJobStore(tempDir, clock);
    const job = await store.create({ sessionId: "s1", expiresAt: "2026-09-20T13:00:00Z" });
    await expect(store.update(job.id, "s1", { status: "review", confidence: 0.94 })).resolves.toMatchObject({ status: "review", confidence: 0.94 });
    await store.delete(job.id, "s1");
    await expect(store.get(job.id, "s1")).resolves.toBeNull();
  });
});
