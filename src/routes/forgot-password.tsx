import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Notice } from "@/components/ui/field";
import { requestPasswordReset } from "@/lib/accounts";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await requestPasswordReset({ data: username });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-lg px-5 py-16 sm:px-8 sm:py-24">
        <PageIntro
          kicker="Account help"
          title="Reset your password"
          lede="The training office will verify your request and provide a temporary password."
        />
        {sent ? (
          <div className="mt-8">
            <Notice kicker="Received" title="Request received">
              <p>
                If that account exists, the training office can now issue a temporary password. You
                will choose a new password when you sign in.
              </p>
              <Button asChild className="mt-6">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </Notice>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={(event) => void submit(event)}>
            <Field label="Username">
              <input
                required
                autoComplete="username"
                className="field-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>
            <FormError>{error}</FormError>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Request a reset"}
            </Button>
          </form>
        )}
      </main>
    </SiteShell>
  );
}
