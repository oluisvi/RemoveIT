export type Point = { x: number; y: number };
export type MaskData = { width: number; height: number; data: Uint8ClampedArray };
export type MaskTool = "paint" | "erase" | "pan";

export function createMask(width: number, height: number, alpha = 0): MaskData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = 101; data[i + 1] = 88; data[i + 2] = 245; data[i + 3] = alpha; }
  return { width, height, data };
}

export function applyStroke(mask: MaskData, points: Point[], radius: number, mode: "paint" | "erase") {
  for (const point of points) for (let y = Math.max(0, point.y - radius); y <= Math.min(mask.height - 1, point.y + radius); y++) for (let x = Math.max(0, point.x - radius); x <= Math.min(mask.width - 1, point.x + radius); x++) {
    if ((x - point.x) ** 2 + (y - point.y) ** 2 <= radius ** 2) mask.data[(y * mask.width + x) * 4 + 3] = mode === "paint" ? 255 : 0;
  }
}
