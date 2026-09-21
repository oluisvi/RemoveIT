import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ResultView } from "@/components/result/result-view";

it("oferece comparação acessível e download", () => {
  render(<ResultView originalUrl="/before" resultUrl="/after" onEdit={() => undefined} onReset={() => undefined} />);
  expect(screen.getByRole("slider", { name: /comparar imagem/i })).toBeVisible();
  expect(screen.getByRole("link", { name: /baixar resultado/i })).toHaveAttribute("download");
});
