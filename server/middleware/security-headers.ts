/**
 * Baseline security response headers for deployed builds.
 *
 * This lives in its own middleware rather than inside `grok-pwa.ts` so the two
 * concerns compose independently: the PWA middleware owns the manifest, the
 * install page and head injection, while this one owns transport security. An
 * earlier revision folded these headers into the PWA middleware, and they were
 * lost wholesale the next time that file was replaced.
 *
 * Nitro auto-registers everything in `server/middleware/` because
 * `vite.config.ts` sets `serverDir: "./server"`.
 *
 * The policy below is deliberately explicit about what the app actually needs:
 *
 *   - `script-src 'self' 'unsafe-inline'` — TanStack Start injects an inline
 *                                  <script> for the $_TSR hydration payload.
 *                                  Without 'unsafe-inline' the browser blocks
 *                                  it → window.$_TSR is undefined → blank page.
 *   - `style-src` + Google Fonts — the brand faces load from fonts.googleapis
 *                                  (see README "Typography"); `unsafe-inline`
 *                                  covers Tailwind's injected style element.
 *   - `font-src` + fonts.gstatic — where the woff2 files are served from.
 *   - `img-src 'self' data: blob:` — CMS media is stored as data URLs and the
 *                                  service worker caches blobs.
 *   - `connect-src 'self'`       — server functions and the push endpoint are
 *                                  all same-origin.
 *   - `worker-src 'self'`        — required for `/sw.js` to register.
 *   - `frame-ancestors 'none'`   — this is a private staff system; it should
 *                                  never be embedded.
 *
 * Self-hosting the fonts would let `style-src`/`font-src` drop back to `'self'`.
 */
type HeaderEvent = { url?: { protocol?: string } };

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self'",
  "img-src 'self' data: blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self'",
].join("; ");

export default async function securityHeadersMiddleware(
  event: HeaderEvent,
  next: () => unknown | Promise<unknown>,
) {
  const result = await next();
  if (!(result instanceof Response)) return result;

  const headers = new Headers(result.headers);
  if (!headers.has("content-security-policy")) {
    headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  }
  if (!headers.has("referrer-policy")) {
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
  }
  if (!headers.has("x-content-type-options")) {
    headers.set("x-content-type-options", "nosniff");
  }
  if (!headers.has("x-frame-options")) {
    headers.set("x-frame-options", "DENY");
  }
  if (!headers.has("permissions-policy")) {
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  }
  // Only advertise HSTS over a secure connection — never on local http dev.
  if (event?.url?.protocol === "https:" && !headers.has("strict-transport-security")) {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }

  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
