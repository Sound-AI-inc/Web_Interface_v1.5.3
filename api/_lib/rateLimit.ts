import type { IncomingMessage } from "node:http";
import type { AuthenticatedUser } from "./auth";
import { HttpError } from "./http";

type LimitRule = {
  windowMs: number;
  ipLimit: number;
  userLimit: number;
};

const routeRules: Record<string, Record<AuthenticatedUser["tier"], LimitRule>> = {
  "/api/generate": {
    free: { windowMs: 60_000, ipLimit: 20, userLimit: 6 },
    premium: { windowMs: 60_000, ipLimit: 80, userLimit: 30 },
    enterprise: { windowMs: 60_000, ipLimit: 300, userLimit: Number(process.env.ENTERPRISE_RATE_LIMIT_PER_MINUTE ?? 120) },
  },
};

function clientIp(request: IncomingMessage): string {
  const forwarded = request.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || request.socket.remoteAddress || "unknown";
}

async function redisPipeline(commands: unknown[][]): Promise<unknown[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.VERCEL_ENV === "production") {
      throw new HttpError(503, "RATE_LIMIT_UNAVAILABLE", "Rate limiter is not configured");
    }
    return [];
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) throw new HttpError(503, "RATE_LIMIT_UNAVAILABLE", "Rate limiter failed");
  return (await response.json()) as unknown[];
}

function resultNumber(results: unknown[], index: number): number {
  const item = results[index] as { result?: unknown } | undefined;
  const value = item?.result;
  return typeof value === "number" ? value : Number(value ?? 0);
}

async function checkSlidingWindow(key: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();
  const member = `${now}:${crypto.randomUUID()}`;
  const results = await redisPipeline([
    ["ZREMRANGEBYSCORE", key, 0, now - windowMs],
    ["ZCARD", key],
    ["ZADD", key, now, member],
    ["PEXPIRE", key, windowMs],
  ]);

  if (results.length === 0) return;
  if (resultNumber(results, 1) >= limit) {
    throw new HttpError(429, "RATE_LIMITED", "Too many requests");
  }
}

export async function applyRateLimit(request: IncomingMessage, user: AuthenticatedUser, route = "/api/generate"): Promise<void> {
  const rule = routeRules[route]?.[user.tier] ?? routeRules["/api/generate"].free;
  const ip = clientIp(request);
  await Promise.all([
    checkSlidingWindow(`rl:${route}:ip:${ip}`, rule.ipLimit, rule.windowMs),
    checkSlidingWindow(`rl:${route}:user:${user.id}`, rule.userLimit, rule.windowMs),
  ]);
}
