import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { jobSchema, type CreateJobInput, type Job, type JobPatch } from "@/lib/contracts/job";
import { JobNotFoundError, type JobStore } from "@/lib/jobs/job-store";

type Clock = () => Date;

export class FileJobStore implements JobStore {
  private readonly root: string;

  constructor(root: string, private readonly clock: Clock = () => new Date()) {
    this.root = resolve(root);
  }

  async create(input: CreateJobInput): Promise<Job> {
    const now = this.clock().toISOString();
    const job: Job = jobSchema.parse({ id: randomUUID(), status: "detecting", createdAt: now, updatedAt: now, warnings: [], ...input });
    await mkdir(this.jobDir(job.id), { recursive: true });
    await this.writeJob(job);
    return job;
  }

  async get(id: string, sessionId: string): Promise<Job | null> {
    try {
      const job = jobSchema.parse(JSON.parse(await readFile(join(this.jobDir(id), "job.json"), "utf8")));
      if (job.sessionId !== sessionId) return null;
      if (new Date(job.expiresAt) <= this.clock()) { await this.removeDir(id); return null; }
      return job;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async update(id: string, sessionId: string, patch: JobPatch): Promise<Job> {
    const current = await this.get(id, sessionId);
    if (!current) throw new JobNotFoundError();
    const job = jobSchema.parse({ ...current, ...patch, updatedAt: this.clock().toISOString() });
    await this.writeJob(job);
    return job;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const current = await this.get(id, sessionId);
    if (!current) return;
    await this.removeDir(id);
  }

  async purgeExpired(now = this.clock()): Promise<number> {
    await mkdir(this.root, { recursive: true });
    let removed = 0;
    for (const entry of await readdir(this.root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const job = jobSchema.parse(JSON.parse(await readFile(join(this.jobDir(entry.name), "job.json"), "utf8")));
        if (new Date(job.expiresAt) <= now) { await this.removeDir(entry.name); removed += 1; }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return removed;
  }

  private jobDir(id: string): string {
    const target = resolve(this.root, id);
    const rel = relative(this.root, target);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Caminho de trabalho inseguro.");
    return target;
  }

  private async writeJob(job: Job): Promise<void> {
    const dir = this.jobDir(job.id);
    await mkdir(dir, { recursive: true });
    const temp = join(dir, `job-${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(job), { encoding: "utf8", flag: "wx" });
    await rename(temp, join(dir, "job.json"));
  }

  private async removeDir(id: string): Promise<void> {
    await rm(this.jobDir(id), { recursive: true, force: true });
  }
}
