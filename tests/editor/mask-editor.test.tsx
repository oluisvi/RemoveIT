import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MaskEditor } from "@/components/editor/mask-editor";

it("expõe ferramentas e confiança sem depender somente de cor", () => {
  render(<MaskEditor imageUrl="/original" maskUrl="/mask" confidence={.94} onProcess={() => undefined} />);
  expect(screen.getByRole("button", { name: /adicionar máscara/i })).toBeVisible();
  expect(screen.getByText(/confiança alta.*94%/i)).toBeVisible();
});
