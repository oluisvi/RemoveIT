import { expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session/session-id";

it("rejeita token adulterado", () => {
  const token = createSessionToken("id-1", "secret");
  expect(verifySessionToken(token, "secret")).toBe("id-1");
  expect(verifySessionToken(`${token}x`, "secret")).toBeNull();
});
