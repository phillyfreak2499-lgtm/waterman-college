import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Notice } from "@/components/ui/field";
import { recordLogin, usernameToEmail, readMyAccount } from "@/lib/accounts";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAccess } from "@/components/access-provider";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => pageHead("Sign in", "Sign in to COGS with the username you created."),
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  const { access } = useAccess();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"pending" | "denied" | "deactivated" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const { error: err } = await authClient.signIn.email({
        email: username.includes("@") ? username.trim() : usernameToEmail(username),
        password,
      });
      if (err) throw new Error("That username or password did not match.");
      const account = await readMyAccount();
      await recordLogin().catch(() => undefined);
      if (account.status === "denied") {
        await authClient.signOut();
        setStatus("denied");
        return;
      }
      if (account.status === "deactivated") {
        await authClient.signOut();
        setStatus("deactivated");
        return;
      }
      if (account.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }
      if (account.chancellor) {
        window.location.href = "/chancellor";
        return;
      }
      if (account.status === "pending") {
        await authClient.signOut();
        setStatus("pending");
        return;
      }
      window.location.href = "/training";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl items-stretch gap-0 px-5 py-8 sm:px-8 sm:py-12 md:grid-cols-2 md:py-20">
        <div className="relative overflow-hidden rounded-t-lg shadow-card md:rounded-l-lg md:rounded-tr-none">
          <img
            src="/media/login-fitting.jpg"
            alt="A Good Feet Specialist fitting a client at COGS"
            className="h-48 w-full object-cover object-center sm:h-64 md:h-full md:min-h-[32rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-paper sm:p-8">
            <p className="kicker text-brass-soft">Private campus</p>
            <p className="mt-2 font-display text-2xl leading-tight sm:mt-3 sm:text-3xl">
              Accounts live only here. There is no outside login.
            </p>
          </div>
        </div>
        <div className="rounded-t-none rounded-b-lg border border-line bg-surface p-7 shadow-card sm:p-10 md:rounded-t-lg md:rounded-l-none">
          <p className="kicker">Admission</p>
          <span className="rule-brass mt-3" />
          <h1 className="mt-4 font-display text-4xl leading-none">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Use the username and password you created. Accounts live only on this
            campus — there is no outside login.
          </p>

          {!mounted || isPending ? (
            <div className="mt-8 space-y-3" aria-busy="true" aria-label="Loading sign-in form">
              <div className="h-11 w-full animate-pulse rounded-sm bg-navy/5" />
              <div className="h-11 w-full animate-pulse rounded-sm bg-navy/5" />
              <div className="h-11 w-32 animate-pulse rounded-sm bg-navy/5" />
            </div>
          ) : user && !status ? (
            <div className="mt-8">
              <p className="text-sm">You’re already signed in as {user.displayName}.</p>
              <Button asChild className="mt-5">
                <Link to={access.isChancellor ? "/chancellor" : "/training"} search={access.isChancellor ? undefined : {}}>
                  {access.isChancellor ? "Chancellor’s Office" : "Enter the hall"}
                </Link>
              </Button>
            </div>
          ) : status === "pending" ? (
            <div className="mt-8">
              <Notice kicker="Awaiting the Chancellor" title="Your request is in.">
                The Chancellor’s Office will approve or deny this account. You
                can sign in with this username after they do. The hall stays
                closed until then.
              </Notice>
            </div>
          ) : status === "denied" ? (
            <FormError>
              The office did not approve this account. Ask the training office if
              that was a mistake.
            </FormError>
          ) : status === "deactivated" ? (
            <FormError>
              This account has been deactivated. Ask the Chancellor’s Office to
              restore it.
            </FormError>
          ) : (
            <>
              <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
                <Field label="Username">
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="field-input"
                    autoComplete="username"
                  />
                </Field>
                <Field label="Password">
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    autoComplete="current-password"
                  />
                </Field>
                <FormError>{error}</FormError>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <p className="mt-5 text-sm text-muted">
                New to campus?{" "}
                <Link to="/register" className="text-navy underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </p>
              <p className="mt-2 text-sm text-muted">
                <Link
                  to="/forgot-password"
                  className="text-navy underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
