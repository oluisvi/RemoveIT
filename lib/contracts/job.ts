import { z } from "zod";

export const jobStatusSchema = z.enum(["detecting", "review", "processing", "complete", "failed", "canceled"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const jobSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().min(1),
  status: jobStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  originalPath: z.string().optional(),
  maskPath: z.string().optional(),
  resultPath: z.string().optional(),
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string()).default([]),
  error: z.string().optional(),
});

export type Job = z.infer<typeof jobSchema>;
export type CreateJobInput = Pick<Job, "sessionId" | "expiresAt"> & Partial<Pick<Job, "mime" | "width" | "height">>;
export type JobPatch = Partial<Omit<Job, "id" | "sessionId" | "createdAt">>;
