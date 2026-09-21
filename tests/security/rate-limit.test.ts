import { expect, it } from "vitest";
import { MemoryRateLimiter, RateLimitError } from "@/lib/security/rate-limit";

it("bloqueia acima do limite e informa retry", () => {
  const limiter = new MemoryRateLimiter(2, 60_000, () => 0);
  limiter.consume("s"); limiter.consume("s");
  expect(() => limiter.consume("s")).toThrow(RateLimitError);
});
