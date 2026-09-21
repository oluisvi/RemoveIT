import sharp from "sharp";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;
export type SupportedMime = "image/jpeg" | "image/png" | "image/webp";
export type ImageInfo = { mime: SupportedMime; width: number; height: number; hasAlpha: boolean };

export class ImageValidationError extends Error {
  constructor(public readonly code: "FILE_TOO_LARGE" | "INVALID_IMAGE" | "UNSUPPORTED_FORMAT" | "IMAGE_TOO_LARGE", message: string) {
    super(message); this.name = "ImageValidationError";
  }
}

const mimeByFormat = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export async function validateImage(buffer: Buffer): Promise<ImageInfo> {
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new ImageValidationError("FILE_TOO_LARGE", "A imagem deve ter no máximo 20 MB.");
  try {
    const metadata = await sharp(buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    if (!metadata.format || !(metadata.format in mimeByFormat)) throw new ImageValidationError("UNSUPPORTED_FORMAT", "Use uma imagem JPG, PNG ou WebP.");
    if (!metadata.width || !metadata.height) throw new ImageValidationError("INVALID_IMAGE", "Não foi possível ler as dimensões da imagem.");
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new ImageValidationError("IMAGE_TOO_LARGE", "A imagem possui pixels demais para processamento seguro.");
    return { mime: mimeByFormat[metadata.format as keyof typeof mimeByFormat], width: metadata.width, height: metadata.height, hasAlpha: Boolean(metadata.hasAlpha) };
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageValidationError("INVALID_IMAGE", "O arquivo não contém uma imagem válida.");
  }
}
