import { getRequest } from "@tanstack/react-start/server";

type Attempt = { at: number };
const globalLimits = globalThis as typeof globalThis & {
  __watermanRateLimits__?: Map<string, Attempt[]>;
};
const limits: Map<string, Attempt[]> =
  (globalLimits.__watermanRateLimits__ ??= new Map<string, Attempt[]>());

export function requestFingerprint(fallback = "unknown") {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request?.headers.get("x-real-ip")?.trim() || fallback;
}

export function assertRateLimit(
  bucket: string,
  identity: string,
  options: { max: number; windowMs: number },
) {
  const now = Date.now();
  const key = `${bucket}:${identity}`;
  const recent = (limits.get(key) ?? []).filter((item) => now - item.at < options.windowMs);
  if (recent.length >= options.max) {
    throw new Error("Too many attempts. Please wait and try again.");
  }
  recent.push({ at: now });
  limits.set(key, recent);

  if (limits.size > 2_000) {
    for (const [candidate, attempts] of limits) {
      if (!attempts.some((item) => now - item.at < options.windowMs)) limits.delete(candidate);
    }
  }
}
