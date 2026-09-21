import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UploadPanel } from "@/components/upload/upload-panel";

it("não envia sem confirmação de autorização", async () => {
  const user = userEvent.setup();
  const fetcher = vi.fn();
  render(<UploadPanel onCreated={vi.fn()} fetcher={fetcher} />);
  await user.upload(screen.getByLabelText(/escolher imagem/i), new File(["image"], "foto.png", { type: "image/png" }));
  await user.click(screen.getByRole("button", { name: /analisar imagem/i }));
  expect(screen.getByText(/confirme que possui/i)).toBeVisible();
  expect(fetcher).not.toHaveBeenCalled();
});
