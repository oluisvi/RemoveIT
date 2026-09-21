import { expect, it } from "vitest";
import sharp from "sharp";
import { normalizeImage } from "@/lib/images/normalize-image";

it("remove metadados e preserva alpha", async () => {
  const source = await sharp({ create: { width: 4, height: 3, channels: 4, background: { r: 10, g: 20, b: 30, alpha: .5 } } })
    .withMetadata({ orientation: 1, exif: { IFD0: { Artist: "Sensitive Author" } } })
    .png().toBuffer();
  const output = await normalizeImage(source);
  const metadata = await sharp(output.buffer).metadata();
  expect(output).toMatchObject({ mime: "image/png", width: 4, height: 3 });
  expect(metadata.hasAlpha).toBe(true);
  expect(metadata.exif).toBeUndefined();
});
