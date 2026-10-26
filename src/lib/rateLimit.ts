// Sliding-window rate limiter (in-memory, per server instance).
// NOTE: on serverless hosts each instance has its own memory, so this is a
// best-effort guard. Swap `RateLimiter` for a KV/Redis-backed implementation
// (same interface) in production.

export interface RateLimiter {
  /** Returns true if the request is allowed, false if the limit is exceeded. */
  check(key: string): boolean;
}

export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    // Opportunistic cleanup to keep the map bounded.
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) {
        if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
      }
    }
    return true;
  }
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}
