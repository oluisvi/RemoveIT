import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

it("apresenta a promessa e a ação principal em português", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /fotos limpas/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /escolher imagem/i })).toBeEnabled();
});

