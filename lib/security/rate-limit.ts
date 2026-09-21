export class RateLimitError extends Error { constructor(public readonly retryAfter: number) { super("Muitas tentativas. Aguarde um pouco."); this.name = "RateLimitError"; } }
export class MemoryRateLimiter {
  private buckets = new Map<string, number[]>();
  constructor(private limit: number, private windowMs: number, private now = () => Date.now()) {}
  consume(key: string) { const time = this.now(); const hits = (this.buckets.get(key) || []).filter((hit) => time - hit < this.windowMs); if (hits.length >= this.limit) throw new RateLimitError(Math.ceil((this.windowMs - (time - hits[0])) / 1000)); hits.push(time); this.buckets.set(key, hits); }
}
