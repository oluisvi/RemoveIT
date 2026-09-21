export type Point = { x: number; y: number };
export type MaskData = { width: number; height: number; data: Uint8ClampedArray };
export type MaskTool = "paint" | "erase" | "pan";

export type Size = { width: number; height: number };

export function createMask(width: number, height: number, alpha = 0): MaskData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = 101; data[i + 1] = 88; data[i + 2] = 245; data[i + 3] = alpha; }
  return { width, height, data };
}

export function containSize(container: Size, content: Size): Size {
  if (container.width <= 0 || container.height <= 0 || content.width <= 0 || content.height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(container.width / content.width, container.height / content.height);
  return { width: content.width * scale, height: content.height * scale };
}

export function interpolatePoints(from: Point, to: Point, spacing = 0.5): Point[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.1, spacing)));
  return Array.from({ length: steps }, (_, index) => {
    const progress = (index + 1) / steps;
    return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
  });
}

export function applyStroke(mask: MaskData, points: Point[], diameter: number, mode: "paint" | "erase") {
  const radius = Math.max(0.5, diameter / 2);
  const samples = points.flatMap((point, index) => index === 0 ? [point] : interpolatePoints(points[index - 1], point, Math.max(0.5, radius / 2)));
  for (const point of samples) for (let y = Math.max(0, Math.floor(point.y - radius)); y <= Math.min(mask.height - 1, Math.ceil(point.y + radius)); y++) for (let x = Math.max(0, Math.floor(point.x - radius)); x <= Math.min(mask.width - 1, Math.ceil(point.x + radius)); x++) {
    if ((x + 0.5 - point.x) ** 2 + (y + 0.5 - point.y) ** 2 <= radius ** 2) {
      const offset = (y * mask.width + x) * 4;
      const value = mode === "paint" ? 255 : 0;
      mask.data[offset] = value;
      mask.data[offset + 1] = value;
      mask.data[offset + 2] = value;
      mask.data[offset + 3] = 255;
    }
  }
}

export function binarizeMask(image: ImageData, threshold = 128): ImageData {
  for (let index = 0; index < image.data.length; index += 4) {
    const alpha = image.data[index + 3];
    const luminance = image.data[index] * 0.2126 + image.data[index + 1] * 0.7152 + image.data[index + 2] * 0.0722;
    const value = alpha >= threshold && luminance >= threshold ? 255 : 0;
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  return image;
}
