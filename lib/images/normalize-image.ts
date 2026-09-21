import sharp from "sharp";
import { validateImage, type SupportedMime } from "@/lib/images/validate-image";

export type NormalizedImage = { buffer: Buffer; mime: SupportedMime; width: number; height: number };

export async function normalizeImage(input: Buffer): Promise<NormalizedImage> {
  const source = await validateImage(input);
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const buffer = source.hasAlpha
    ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
    : await pipeline.jpeg({ quality: 95, mozjpeg: true }).toBuffer();
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) throw new Error("A imagem normalizada não possui dimensões válidas.");
  return { buffer, mime: source.hasAlpha ? "image/png" : "image/jpeg", width: metadata.width, height: metadata.height };
}
