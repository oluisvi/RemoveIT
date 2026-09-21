export type DetectionResult = { confidence: number; mask: Buffer; warnings: string[] };

export interface InferenceProvider {
  detect(image: Buffer, signal: AbortSignal): Promise<DetectionResult>;
  inpaint(image: Buffer, mask: Buffer, signal: AbortSignal): Promise<Buffer>;
}
