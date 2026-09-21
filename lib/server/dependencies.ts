import { resolve } from "node:path";
import { env } from "@/lib/env";
import { HttpInferenceProvider } from "@/lib/inference/http-provider";
import { FileJobStore } from "@/lib/jobs/file-job-store";
import { JobService } from "@/lib/jobs/job-service";

const root = resolve(env.REMOVEIT_TMP_DIR);
export const jobStore = new FileJobStore(root);
export const inferenceProvider = new HttpInferenceProvider(env.INFERENCE_SERVICE_URL, env.INFERENCE_SERVICE_TOKEN);
export const jobService = new JobService(jobStore, inferenceProvider, root, env.INFERENCE_TIMEOUT_MS);

export function requestSession(request: Request): string {
  return request.headers.get("x-removeit-session") || "anonymous";
}
