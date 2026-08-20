import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authEnabled, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

/**
 * Auth state components — plain wrappers around `useCurrentUserState()`.
 *
 * Auth is ON by default (including the sandbox live preview, which does real
 * sign-in). Visitors are signed out until they authenticate. The shared dev
 * user only appears when auth is explicitly disabled (`VITE_AUTH_ENABLED=false`).
 * While the session is still resolving, gates that care about signed-out state
 * render nothing so there's no signed-out flash on hard reload.
 */

/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
export const SIGN_IN_PATH = "/login";

/** Render children only when a user is present (real session, or the disabled-auth dev user). */
export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

/**
 * Render children only once we KNOW the visitor is signed out (`isPending` has
 * cleared and there is no user). Hidden while the session is still loading.
 */
export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

/**
 * One-shot client-side redirect (TanStack `useNavigate` — NOT a full
 * `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
 * session loading, which feels like a second "Loading…" on /login.
 *
 * WHY AN EFFECT WITH A `fired` GUARD INSTEAD OF `<Navigate>`:
 * When this is rendered *inside* `SiteShell` (every gated route does
 * `<SiteShell><AuthGate>…`), the header/footer subscribe to router state, so
 * each micro-update during the pending navigation re-renders this subtree. The
 * declarative `<Navigate>` re-fires on every one of those renders, restarting
 * the navigation before it can settle — a silent synchronous loop that pegs the
 * main thread (no "Maximum update depth" warning because it is the router's
 * external store re-rendering, not React `setState`). Firing exactly once per
 * mount lets the navigation complete and unmount this subtree.
 *
 * Guard routes by waiting out `isPending` first (see `use-current-user`), then
 * render this.
 */
export function Redirect({ to, replace = true }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void navigate({ to, replace });
  }, [navigate, to, replace]);
  return null;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Redirect to={to} />;
}

/**
 * Minimal signed-in identity chip + sign-out. Restyle freely (see the
 * `design-ui` skill). Sign-out is only shown when auth is enabled (the
 * disabled-auth dev user has nothing to sign out of).
 */
export function UserButton() {
  const user = useCurrentUser();
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-full bg-brass-soft text-[0.7rem] font-semibold tracking-wide text-navy">
        {initials}
      </span>
      <span className="max-w-[10rem] truncate text-sm font-medium">{label}</span>
      {authEnabled && (
        <button
          type="button"
          onClick={() => void signOut()}
          className="h-11 text-sm opacity-70 underline-offset-4 transition-opacity hover:opacity-100 hover:underline"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
