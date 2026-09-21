import { expect, it } from "vitest";
import { applyStroke, createMask } from "@/components/editor/mask-canvas";

it("a borracha remove pixels locais sem alterar o restante", () => {
  const mask = createMask(20, 20, 255);
  applyStroke(mask, [{ x: 5, y: 5 }, { x: 8, y: 5 }], 3, "erase");
  expect(mask.data[(5 * 20 + 6) * 4 + 3]).toBe(0);
  expect(mask.data[(18 * 20 + 18) * 4 + 3]).toBe(255);
});
