import type { CreateJobInput, Job, JobPatch } from "@/lib/contracts/job";

export interface JobStore {
  create(input: CreateJobInput): Promise<Job>;
  get(id: string, sessionId: string): Promise<Job | null>;
  update(id: string, sessionId: string, patch: JobPatch): Promise<Job>;
  delete(id: string, sessionId: string): Promise<void>;
  purgeExpired(now?: Date): Promise<number>;
}

export class JobNotFoundError extends Error {
  constructor() { super("Trabalho não encontrado."); this.name = "JobNotFoundError"; }
}
