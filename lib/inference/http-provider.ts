import { z } from "zod";
import type { DetectionResult, InferenceProvider } from "@/lib/inference/provider";

export class InferenceTimeoutError extends Error { constructor() { super("A IA demorou mais que o esperado."); this.name = "InferenceTimeoutError"; } }
export class InferenceUnavailableError extends Error { constructor() { super("O serviço de IA está indisponível."); this.name = "InferenceUnavailableError"; } }
export class InferenceRejectedError extends Error { constructor() { super("O serviço de IA rejeitou a imagem ou máscara."); this.name = "InferenceRejectedError"; } }

const detectionSchema = z.object({ confidence: z.number().min(0).max(1), maskDataUrl: z.string().startsWith("data:image/png;base64,"), warnings: z.array(z.string()) });
type Fetcher = typeof fetch;

export class HttpInferenceProvider implements InferenceProvider {
  constructor(private readonly baseUrl: string, private readonly token: string, private readonly fetcher: Fetcher = fetch) {}

  async detect(image: Buffer, signal: AbortSignal): Promise<DetectionResult> {
    const form = new FormData();
    form.set("image", new Blob([new Uint8Array(image)], { type: "image/png" }), "image.png");
    const response = await this.request("/v1/detect", form, signal);
    const data = detectionSchema.parse(await response.json());
    return { confidence: data.confidence, mask: Buffer.from(data.maskDataUrl.split(",")[1], "base64"), warnings: data.warnings };
  }

  async inpaint(image: Buffer, mask: Buffer, signal: AbortSignal): Promise<Buffer> {
    const form = new FormData();
    form.set("image", new Blob([new Uint8Array(image)], { type: "image/png" }), "image.png");
    form.set("mask", new Blob([new Uint8Array(mask)], { type: "image/png" }), "mask.png");
    const response = await this.request("/v1/inpaint", form, signal);
    return Buffer.from(await response.arrayBuffer());
  }

  private async request(path: string, body: FormData, signal: AbortSignal): Promise<Response> {
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, { method: "POST", body, signal, headers: { Authorization: `Bearer ${this.token}` } });
      if (response.status === 422) throw new InferenceRejectedError();
      if (!response.ok) throw new InferenceUnavailableError();
      return response;
    } catch (error) {
      if (error instanceof InferenceRejectedError || error instanceof InferenceUnavailableError) throw error;
      if ((error as Error).name === "AbortError" || (error as Error).name === "TimeoutError") throw new InferenceTimeoutError();
      throw new InferenceUnavailableError();
    }
  }
}
