import { expect, test } from "@playwright/test";

const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("conclui upload, revisão, remoção e download", async ({ page }) => {
  await page.route("**/api/jobs", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobId: "j1", status: "review", imageUrl: "/mock-original", maskUrl: "/mock-mask", confidence: .94, warnings: [] }) }));
  await page.route("**/api/jobs/j1/process", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "complete", resultUrl: "/mock-result" }) }));
  await page.route(/mock-(original|mask|result)/, (route) => route.fulfill({ status: 200, contentType: "image/png", body: pixel }));
  await page.goto("/");
  await page.getByLabel(/possuo ou tenho autorização/i).check();
  await page.getByLabel(/escolher imagem/i).setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: pixel });
  await page.getByRole("button", { name: /analisar imagem/i }).click();
  await expect(page.getByText(/confiança alta.*94%/i)).toBeVisible();
  await page.getByRole("button", { name: /remover marca/i }).click();
  await expect(page.getByRole("slider", { name: /comparar imagem/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /baixar resultado/i })).toBeVisible();
});

test("não cria overflow em celular", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
