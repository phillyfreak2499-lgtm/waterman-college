import { createServerFn } from "@tanstack/react-start";

/**
 * Minimal, dependency-free client error reporting.
 *
 * Uncaught errors and unhandled promise rejections in the browser are forwarded
 * to the server and written to the process log (visible in the Render logs), so
 * a future break surfaces without waiting for a user to report it. This is a
 * lightweight stand-in for a hosted tracker — wire up Sentry (VITE_SENTRY_DSN)
 * later for dashboards and alerting; the client installer below can call it too.
 */
export const logClientError = createServerFn({ method: "POST" })
  .validator((input: { message?: string; stack?: string; url?: string; kind?: string }) => {
    const message = String(input?.message ?? "").trim().slice(0, 1000);
    if (!message) throw new Error("Empty error report.");
    return {
      message,
      stack: input?.stack ? String(input.stack).slice(0, 4000) : "",
      url: input?.url ? String(input.url).slice(0, 500) : "",
      kind: input?.kind === "unhandledrejection" ? "unhandledrejection" : "error",
    };
  })
  .handler(async ({ data }) => {
    // Unauthenticated (errors happen signed-out too) — rate-limit per client.
    const { assertRateLimit, requestFingerprint } = await import("@/lib/rate-limit.server");
    try {
      assertRateLimit("client-error", requestFingerprint(), { max: 30, windowMs: 60_000 });
    } catch {
      return { ok: false };
    }
    console.error(
      `[client-error] ${data.kind} @ ${data.url || "?"}: ${data.message}` +
        (data.stack ? `\n${data.stack}` : ""),
    );
    return { ok: true };
  });

let installed = false;

/**
 * Hook `window` error + unhandledrejection once. De-duplicated and capped so a
 * loop of the same error can never flood the endpoint. Safe to call on the
 * server (no-op) and to call more than once (idempotent).
 */
export function installClientErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  let sent = 0;
  const seen = new Set<string>();
  const send = (kind: "error" | "unhandledrejection", message: string, stack?: string) => {
    if (!message || sent >= 25) return;
    const key = `${kind}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;
    void logClientError({
      data: { message, stack, url: window.location.pathname, kind },
    }).catch(() => undefined);
  };

  window.addEventListener("error", (event) => {
    send("error", String(event.message || event.error?.message || "Error"), event.error?.stack);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { message?: string; stack?: string } | undefined;
    send(
      "unhandledrejection",
      String(reason?.message || reason || "Unhandled rejection"),
      reason?.stack,
    );
  });
}
