import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EvalSummary } from "@/components/eval-summary";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { upsertLockerNote } from "@/lib/locker";
import {
  getPresentationEval,
  type PresentationEval,
} from "@/lib/presentation-eval";
import { pageHead } from "@/lib/page-title";
import { errorMessage } from "@/lib/utils";

export const Route = createFileRoute("/team_/evaluate/brief/$evalId")({
  component: BriefPage,
  head: () =>
    pageHead("Coaching brief", "Printable presentation evaluation summary."),
});

function BriefPage() {
  return (
    <SiteShell>
      <AuthGate>
        <BriefDesk />
      </AuthGate>
    </SiteShell>
  );
}

function BriefDesk() {
  const { evalId } = Route.useParams();
  const { access, ready } = useAccess();
  const [ev, setEv] = useState<PresentationEval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getPresentationEval({ data: { id: evalId } })
      .then((row) => {
        if (!cancelled) setEv(row);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err) || "Could not load brief");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, evalId]);

  async function saveToLocker() {
    if (!ev) return;
    setSaving(true);
    try {
      const lines = [
        `Coaching brief — ${ev.presenterName} — ${ev.evalDate}`,
        ev.store ? `Store: ${ev.store}` : "",
        ev.specialistScore != null ? `Self-score: ${ev.specialistScore}/10` : "",
        "",
        "Open full brief on campus when needed.",
      ].filter(Boolean);
      await upsertLockerNote({ data: { body: lines.join("\n") } });
      toast.success("Brief note saved to your Locker");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save to Locker");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || (!ev && !error)) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="kicker">Coaching brief</p>
        <h1 className="mt-3 font-display text-4xl">Unavailable</h1>
        <p className="mt-4 text-muted">{error || "Not found"}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/team">Back to Team</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="print:hidden mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
        >
          <ArrowLeft className="size-3.5" /> Team
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => window.print()}>
            Print brief
          </Button>
          {access.userId === ev.presenterId || access.canManagePeople ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => void saveToLocker()}
            >
              {saving ? "Saving…" : "Save note to Locker"}
            </Button>
          ) : null}
        </div>
      </div>
      <EvalSummary
        meta={{
          presenterName: ev.presenterName,
          observerName: ev.observerName,
          store: ev.store || undefined,
          evalDate: ev.evalDate,
          clientName: ev.clientName || undefined,
          floorLeader: ev.floorLeader || undefined,
          startTime: ev.startTime || undefined,
          partySize: ev.partySize || undefined,
        }}
        answers={ev.answers}
      />
    </div>
  );
}
