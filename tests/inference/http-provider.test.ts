import { expect, it, vi } from "vitest";
import { HttpInferenceProvider, InferenceRejectedError } from "@/lib/inference/http-provider";

it("envia token e valida uma detecção", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ confidence: .8, maskDataUrl: "data:image/png;base64,aGVsbG8=", warnings: [] }), { status: 200, headers: { "content-type": "application/json" } }));
  const provider = new HttpInferenceProvider("http://ai", "secret", fetcher);
  await expect(provider.detect(Buffer.from("image"), AbortSignal.timeout(1000))).resolves.toMatchObject({ confidence: .8 });
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer secret");
});

it("converte rejeição do serviço em erro de domínio", async () => {
  const provider = new HttpInferenceProvider("http://ai", "secret", vi.fn().mockResolvedValue(new Response("bad", { status: 422 })));
  await expect(provider.inpaint(Buffer.from("i"), Buffer.from("m"), AbortSignal.timeout(1000))).rejects.toBeInstanceOf(InferenceRejectedError);
});
