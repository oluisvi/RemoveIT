import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MaskEditor } from "@/components/editor/mask-editor";

it("expõe ferramentas e confiança sem depender somente de cor", () => {
  render(<MaskEditor imageUrl="/original" maskUrl="/mask" confidence={.94} onProcess={() => undefined} />);
  expect(screen.getByRole("button", { name: /adicionar máscara/i })).toBeVisible();
  expect(screen.getByText(/confiança alta.*94%/i)).toBeVisible();
});

it("permite pincel de 1 px, zoom e prepara a redetecção", async () => {
  const onRedetect = vi.fn();
  render(<MaskEditor imageUrl="/original" maskUrl="/mask" confidence={.5} onProcess={() => undefined} onRedetect={onRedetect} />);
  const brush = screen.getByRole("slider", { name: /tamanho do pincel/i });
  expect(brush).toHaveAttribute("min", "1");
  fireEvent.click(screen.getByRole("button", { name: /aumentar zoom/i }));
  expect(screen.getByText("125%")).toBeVisible();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /^redetectar$/i })));
  expect(onRedetect).toHaveBeenCalledOnce();
});
