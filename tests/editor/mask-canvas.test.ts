import { expect, it } from "vitest";
import { applyStroke, binarizeMask, containSize, createMask } from "@/components/editor/mask-canvas";

it("a borracha remove pixels locais sem alterar o restante", () => {
  const mask = createMask(20, 20, 255);
  applyStroke(mask, [{ x: 5.5, y: 5.5 }, { x: 8.5, y: 5.5 }], 6, "erase");
  expect(mask.data[(5 * 20 + 6) * 4]).toBe(0);
  expect(mask.data[(18 * 20 + 18) * 4 + 3]).toBe(255);
});

it("interpola um traço fino de 1 px sem lacunas", () => {
  const mask = createMask(30, 4, 0);
  applyStroke(mask, [{ x: .5, y: 1.5 }, { x: 28.5, y: 1.5 }], 1, "paint");
  for (let x = 0; x < 29; x++) expect(mask.data[(1 * 30 + x) * 4]).toBe(255);
});

it("exporta a máscara como pixels binários opacos", () => {
  const image = { data: new Uint8ClampedArray([250, 250, 250, 255, 40, 40, 40, 255, 255, 255, 255, 0]), width: 3, height: 1 } as ImageData;
  const result = binarizeMask(image);
  expect(Array.from(result.data)).toEqual([255,255,255,255,0,0,0,255,0,0,0,255]);
});

it("calcula o contain sem distorcer imagem vertical", () => {
  expect(containSize({ width: 800, height: 500 }, { width: 1000, height: 2000 })).toEqual({ width: 250, height: 500 });
});
