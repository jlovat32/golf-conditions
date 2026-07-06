import { NextRequest, NextResponse } from "next/server";

// Simple in-memory sliding-window rate limiter. Good enough for basic
// abuse prevention as a first line of defense. Notes:
//   - Serverless functions may have many warm instances, so an attacker
//     that spreads requests across instances can bypass this. For real
//     hardening, swap in @upstash/ratelimit backed by Upstash Redis.
//   - Vercel edge / KV / firewall are alternatives once you're on Pro.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Cleanup old buckets periodically so the Map doesn't leak.
function sweep(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

function clientKey(request: NextRequest, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
  prefix: string;
};

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const key = clientKey(request, config.prefix);
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > config.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }
  return null;
}
