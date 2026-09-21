import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validateImage } from "@/lib/images/validate-image";

describe("validateImage", () => {
  it("rejeita extensão jpg quando o conteúdo não é uma imagem", async () => {
    const malicious = Buffer.from("MZ executable payload");
    await expect(validateImage(malicious)).rejects.toMatchObject({ code: "INVALID_IMAGE" });
  });

  it("rejeita conteúdo acima de 20 MB antes de decodificar", async () => {
    await expect(validateImage(Buffer.alloc(20 * 1024 * 1024 + 1)))
      .rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it.each(["jpeg", "png", "webp"] as const)("aceita conteúdo %s válido", async (format) => {
    const buffer = await sharp({ create: { width: 2, height: 3, channels: 3, background: "#6558f5" } }).toFormat(format).toBuffer();
    await expect(validateImage(buffer)).resolves.toMatchObject({ width: 2, height: 3 });
  });
});
