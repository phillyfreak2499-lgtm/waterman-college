import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { confirmOwnPasswordChange } from "@/lib/accounts";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/change-password")({ component: ChangePasswordPage });

function ChangePasswordPage() {
  return (
    <SiteShell>
      <AuthGate>
        <ChangePasswordForm />
      </AuthGate>
    </SiteShell>
  );
}

function ChangePasswordForm() {
  const { access } = useAccess();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 12) {
      toast.error("Use at least 12 characters for the new password.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error("The current password did not match.");
      await confirmOwnPasswordChange();
      toast.success("Password changed.");
      window.location.href = access.isChancellor ? "/chancellor" : "/locker";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-16 sm:px-8 sm:py-24">
      <PageIntro
        kicker="Account security"
        title="Choose a new password"
        lede="Your first password is temporary. Change it before entering the college."
      />
      <form className="mt-8 space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Current password">
          <input
            required
            type="password"
            autoComplete="current-password"
            className="field-input"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>
        <Field label="New password" hint="At least 12 characters.">
          <input
            required
            type="password"
            minLength={12}
            autoComplete="new-password"
            className="field-input"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            required
            type="password"
            minLength={12}
            autoComplete="new-password"
            className="field-input"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </Button>
      </form>
    </main>
  );
}
