import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Regression guard for the redirect loop that froze /quad and /directory.
 *
 * Gated routes render `<SiteShell><AuthGate>…`. AuthGate used a declarative
 * TanStack `<Navigate>` to send signed-out (and must-change-password) visitors
 * away. Because the shell's header/footer subscribe to router state, that
 * `<Navigate>` re-fired on every router tick and restarted the navigation
 * before it settled — a silent synchronous loop that pegged the main thread and
 * crashed the tab (no "Maximum update depth" warning, since it is the router's
 * external store, not React setState).
 *
 * The fix replaced it with a one-shot `Redirect` (useNavigate in an effect
 * guarded by a `fired` ref). These are cheap source-invariant checks — no
 * server or browser needed — that fail if the `<Navigate>` pattern is
 * reintroduced in the gating code.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");

test("gates.tsx exposes a one-shot Redirect, not a declarative <Navigate>", () => {
  const src = read("src/lib/auth/gates.tsx");
  assert.doesNotMatch(
    src,
    /import\s*\{[^}]*\bNavigate\b[^}]*\}\s*from\s*["']@tanstack\/react-router["']/,
    "gates.tsx must not import the declarative Navigate from @tanstack/react-router",
  );
  assert.match(src, /export function Redirect\b/, "gates.tsx must export a Redirect component");
  assert.match(src, /useNavigate\(\)/, "Redirect must navigate imperatively via useNavigate()");
  assert.match(src, /useEffect\(/, "Redirect must navigate from an effect, not during render");
  assert.match(src, /fired\b/, "Redirect must guard re-firing with a `fired` ref");
});

test("auth-gate.tsx redirects via <Redirect>, never a raw <Navigate>", () => {
  const src = read("src/components/auth-gate.tsx");
  assert.doesNotMatch(src, /<Navigate\b/, "auth-gate.tsx must not render <Navigate>");
  assert.match(src, /<Redirect\b/, "auth-gate.tsx must redirect via <Redirect>");
});

test("chancellor.tsx redirects via <Redirect>, never a raw <Navigate>", () => {
  const src = read("src/routes/chancellor.tsx");
  assert.doesNotMatch(src, /<Navigate\b/, "chancellor.tsx must not render <Navigate>");
  assert.match(src, /<Redirect\b/, "chancellor.tsx must redirect via <Redirect>");
});
