import { resolve } from "node:path";
import { env } from "@/lib/env";
import { HttpInferenceProvider } from "@/lib/inference/http-provider";
import { FileJobStore } from "@/lib/jobs/file-job-store";
import { JobService } from "@/lib/jobs/job-service";
import { newSessionToken, verifySessionToken } from "@/lib/session/session-id";
import { MemoryRateLimiter } from "@/lib/security/rate-limit";

const root = resolve(env.REMOVEIT_TMP_DIR);
export const jobStore = new FileJobStore(root);
export const inferenceProvider = new HttpInferenceProvider(env.INFERENCE_SERVICE_URL, env.INFERENCE_SERVICE_TOKEN);
export const jobService = new JobService(jobStore, inferenceProvider, root, env.INFERENCE_TIMEOUT_MS);
export const creationLimiter = new MemoryRateLimiter(5, 60_000);

export function requestSession(request: Request): string {
  const token = request.headers.get("cookie")?.match(/(?:^|; )removeit_session=([^;]+)/)?.[1];
  return token ? verifySessionToken(decodeURIComponent(token), env.SESSION_SECRET) || "invalid" : request.headers.get("x-removeit-session") || "anonymous";
}
export function issueSession() { const token = newSessionToken(env.SESSION_SECRET); return { id: verifySessionToken(token, env.SESSION_SECRET)!, cookie: `removeit_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}` }; }
