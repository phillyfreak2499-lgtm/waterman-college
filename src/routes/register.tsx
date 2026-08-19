import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Notice } from "@/components/ui/field";
import { requestAccount } from "@/lib/accounts";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => pageHead("Create an account", "Ask to join Waterman College. The office approves each person."),
});

function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [store, setStore] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await requestAccount({
        data: { fullName, username, password, store, title },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl items-stretch gap-0 px-5 py-12 sm:px-8 md:grid-cols-2 md:py-20">
        <div className="relative hidden overflow-hidden rounded-l-lg shadow-card md:block">
          <img
            src="/media/campus-lawn.jpg"
            alt="The Waterman College lawn"
            className="h-full min-h-[32rem] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-paper">
            <p className="kicker text-brass-soft">Ask to join</p>
            <p className="mt-3 font-display text-3xl leading-tight">
              The office approves each person. Then the hall opens.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-7 shadow-card sm:p-10 md:rounded-l-none">
          <p className="kicker">Admission</p>
          <span className="rule-brass mt-3" />
          <h1 className="mt-4 font-display text-4xl leading-none">Create an account</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Ask to join the college. The office will approve or deny the request.
            Your username and password stay on this website.
          </p>

          {sent ? (
            <div className="mt-8">
              <Notice kicker="Request sent" title="The office has it.">
                <p>
                  When they approve you, sign in with the username and password you
                  just chose. Until then the hall stays closed.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/login">Go to sign in</Link>
                </Button>
              </Notice>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
              <Field label="Full name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="field-input"
                  autoComplete="name"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Store">
                  <input
                    required
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="field-input"
                  />
                </Field>
                <Field label="Title">
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="field-input"
                  />
                </Field>
              </div>
              <Field label="Username" hint="At least 3 characters. This is how you will sign in.">
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="field-input"
                  autoComplete="username"
                  minLength={3}
                />
              </Field>
              <Field label="Password" hint="At least 12 characters.">
                <input
                  required
                  type="password"
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm password">
                <input
                  required
                  type="password"
                  minLength={12}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="field-input"
                  autoComplete="new-password"
                />
              </Field>
              <FormError>{error}</FormError>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send to the office"}
              </Button>
              <p className="text-sm text-muted">
                Already approved?{" "}
                <Link to="/login" className="text-navy underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
