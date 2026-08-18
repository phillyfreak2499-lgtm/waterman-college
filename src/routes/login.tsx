import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SITE } from "@/lib/content";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message ?? "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      window.location.href = "/training";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl items-stretch gap-0 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:py-20">
        <div className="hidden overflow-hidden rounded-l-lg border border-r-0 border-line lg:block">
          <img
            src="/media/classroom-circle.jpg"
            alt=""
            className="h-full min-h-[32rem] w-full object-cover"
          />
        </div>
        <div className="rounded-lg border border-line bg-surface p-7 sm:p-10 lg:rounded-l-none">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
            Employee access
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none">
            {mode === "in" ? "Sign in" : "Create an account"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            For employees of {SITE.company} only. After you register, start with
            Specialist Training.
          </p>

          {isPending ? (
            <div className="mt-8 h-24 animate-pulse rounded-md bg-navy/5" />
          ) : user ? (
            <div className="mt-8">
              <p className="text-sm">
                You’re signed in as {user.displayName ?? user.primaryEmail}.
              </p>
              <Button asChild className="mt-5">
                <Link to="/training">Go to campus</Link>
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {mode === "up" && (
                  <Field label="Full name">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy"
                      autoComplete="name"
                    />
                  </Field>
                )}
                <Field label="Work email">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Password">
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy"
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                </Field>
                {error && (
                  <p className="text-sm text-red-800" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-4 text-sm text-muted underline-offset-4 hover:underline"
                onClick={() => {
                  setMode((m) => (m === "in" ? "up" : "in"));
                  setError(null);
                }}
              >
                {mode === "in"
                  ? "New Specialist? Create an account"
                  : "Already have an account? Sign in"}
              </button>

              {authEnabled && (
                <div className="mt-8 border-t border-line pt-6">
                  <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">
                    Or continue with
                  </p>
                  <div className="grid gap-2">
                    {GROK_PROVIDERS.map((p) => (
                      <Button
                        key={p.providerId}
                        type="button"
                        variant="outline"
                        onClick={() => void signIn(p.providerId, { callbackURL: "/training" })}
                      >
                        Continue with {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
