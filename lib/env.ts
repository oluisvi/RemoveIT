import { z } from "zod";

const schema = z.object({
  REMOVEIT_TMP_DIR: z.string().default(".removeit-tmp"),
  INFERENCE_SERVICE_URL: z.string().url().default("http://127.0.0.1:8000"),
  INFERENCE_SERVICE_TOKEN: z.string().default("local-development"),
  INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
  JOB_TTL_MINUTES: z.coerce.number().int().positive().default(30),
});

export const env = schema.parse(process.env);
