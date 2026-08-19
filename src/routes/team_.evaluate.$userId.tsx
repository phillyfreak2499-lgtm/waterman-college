import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { EvalSummary } from "@/components/eval-summary";
import {
  EVAL_SECTIONS,
  submitPresentationEval,
  type EvalAnswers,
  type EvalField,
} from "@/lib/presentation-eval";
import { pageHead } from "@/lib/page-title";
import { cn, errorMessage } from "@/lib/utils";

export const Route = createFileRoute("/team_/evaluate/$userId")({
  component: EvaluatePage,
  head: () =>
    pageHead(
      "Presentation Evaluation",
      "Observe a presentation, coach the Specialist, and save the eval for trends.",
    ),
});

function EvaluatePage() {
  return (
    <SiteShell>
      <AuthGate>
        <EvaluateForm />
      </AuthGate>
    </SiteShell>
  );
}

function EvaluateForm() {
  const { userId } = Route.useParams();
  const { access, ready } = useAccess();
  const [presenterName, setPresenterName] = useState("");
  const [store, setStore] = useState("");
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<EvalAnswers>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !access.canManagePeople) return;
    let cancelled = false;
    // Lightweight: resolve name/store from directory-style people list via team health path
    import("@/lib/org")
      .then(({ getTeam }) => getTeam())
      .then((snap) => {
        if (cancelled) return;
        const person = snap.people.find((p) => p.id === userId);
        if (!person) {
          setLoadError("That person is not on your team.");
          return;
        }
        setPresenterName(person.name);
        setStore(person.store || "");
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load this Specialist.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, access.canManagePeople, userId]);

  const section = EVAL_SECTIONS[sectionIdx];
  const isLast = sectionIdx === EVAL_SECTIONS.length - 1;

  function setField(key: string, value: string | string[] | number | null) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    setBusy(true);
    try {
      await submitPresentationEval({
        data: {
          presenterId: userId,
          store,
          evalDate,
          clientName: typeof answers.client_name === "string" ? answers.client_name : undefined,
          floorLeader:
            typeof answers.floor_leader === "string" ? answers.floor_leader : undefined,
          startTime: typeof answers.start_time === "string" ? answers.start_time : undefined,
          partySize: typeof answers.party_size === "string" ? answers.party_size : undefined,
          answers,
        },
      });
      setDone(true);
      toast.success("Presentation evaluation saved");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save evaluation");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  if (!access.canManagePeople) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="kicker">Presentation Evaluation</p>
        <h1 className="mt-3 font-display text-4xl">Leaders only</h1>
        <p className="mt-4 text-muted">
          Managers, regional managers, and trainers submit presentation evaluations.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/team">Back to Team</Link>
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="kicker">Presentation Evaluation</p>
        <h1 className="mt-3 font-display text-4xl">Unavailable</h1>
        <p className="mt-4 text-muted">{loadError}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/team">Back to Team</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    const clientName =
      typeof answers.client_name === "string" ? answers.client_name : undefined;
    const floorLeader =
      typeof answers.floor_leader === "string" ? answers.floor_leader : undefined;
    const startTime =
      typeof answers.start_time === "string" ? answers.start_time : undefined;
    const partySize =
      typeof answers.party_size === "string" ? answers.party_size : undefined;

    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Screen-only actions */}
        <div className="print:hidden mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">Saved · Coaching brief</p>
            <p className="mt-1 text-sm text-muted">
              Review together, then print or save for the Specialist.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => window.print()}>
              Print brief
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/team">Back to Team</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/team/health">Training Health</Link>
            </Button>
          </div>
        </div>

        <EvalSummary
          meta={{
            presenterName: presenterName || "Specialist",
            store,
            evalDate,
            clientName,
            floorLeader,
            startTime,
            partySize,
          }}
          answers={answers}
        />

        <div className="print:hidden mt-10 rounded-lg border border-brass/30 bg-paper-2 px-5 py-5">
          <p className="kicker">Practice now</p>
          <p className="mt-2 text-sm text-muted">
            The eval is only data until you practice. Spend two minutes on the weakest phase
            before the next Client.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/floor">Open Floor Mode</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/locker">See suggested lessons</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
      >
        <ArrowLeft className="size-3.5" /> Team
      </Link>

      <p className="kicker mt-8">Presentation Evaluation 2026</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">
        {presenterName || "Specialist"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        Coaching, not just scoring. Walk through strengths and gaps, then practice the improved
        version together.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Date</span>
          <input
            type="date"
            className="field-input mt-1"
            value={evalDate}
            onChange={(e) => setEvalDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Store</span>
          <input
            className="field-input mt-1"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Store"
          />
        </label>
      </div>

      {/* Section progress */}
      <div className="mt-8 flex flex-wrap gap-1.5">
        {EVAL_SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSectionIdx(i)}
            className={cn(
              "rounded-sm px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] transition-colors",
              i === sectionIdx
                ? "bg-navy text-paper"
                : "bg-paper-2 text-muted hover:text-navy",
            )}
          >
            {s.title.split(" ")[0]}
          </button>
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-line bg-surface px-5 py-6 shadow-card">
        {section.kicker && <p className="kicker">{section.kicker}</p>}
        <h2 className="mt-2 font-display text-2xl leading-none">{section.title}</h2>
        {section.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted">{section.description}</p>
        )}

        <div className="mt-6 space-y-6">
          {section.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={answers[field.key]}
              onChange={(v) => setField(field.key, v)}
            />
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sectionIdx === 0}
          onClick={() => setSectionIdx((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        <p className="text-xs tabular-nums text-muted">
          {sectionIdx + 1} of {EVAL_SECTIONS.length}
        </p>
        {isLast ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void onSubmit()}>
            <Check className="size-3.5" />
            {busy ? "Saving…" : "Save evaluation"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => setSectionIdx((i) => Math.min(EVAL_SECTIONS.length - 1, i + 1))}
          >
            Next section
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EvalField;
  value: string | string[] | number | boolean | null | undefined;
  onChange: (v: string | string[] | number | null) => void;
}) {
  if (field.type === "yesno") {
    const v = typeof value === "string" ? value : "";
    return (
      <fieldset>
        <legend className="text-sm font-medium text-ink">
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        <div className="mt-2 flex gap-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "h-10 min-w-[4.5rem] rounded-sm border px-3 text-sm font-medium transition-colors",
                v === opt
                  ? "border-navy bg-navy text-paper"
                  : "border-line bg-paper text-navy hover:border-navy/30",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "dropdown" && field.options) {
    const v = typeof value === "string" ? value : "";
    return (
      <label className="block">
        <span className="text-sm font-medium text-ink">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <select
          className="field-input mt-2"
          value={v}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Choose</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkboxes" && field.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="text-sm font-medium text-ink">{field.label}</legend>
        <div className="mt-2 space-y-2">
          {field.options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-start gap-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => {
                    if (checked) onChange(selected.filter((s) => s !== opt));
                    else onChange([...selected, opt]);
                  }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "scale") {
    const v = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
    return (
      <fieldset>
        <legend className="text-sm font-medium text-ink">
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "grid size-9 place-items-center rounded-sm border text-sm font-medium tabular-nums transition-colors",
                v === n
                  ? "border-navy bg-navy text-paper"
                  : "border-line bg-paper text-navy hover:border-navy/30",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    const v = typeof value === "string" ? value : "";
    return (
      <label className="block">
        <span className="text-sm font-medium text-ink">{field.label}</span>
        <textarea
          className="field-input mt-2 min-h-[5rem] resize-y"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </label>
    );
  }

  if (field.type === "time") {
    const v = typeof value === "string" ? value : "";
    return (
      <label className="block">
        <span className="text-sm font-medium text-ink">{field.label}</span>
        <input
          type="time"
          className="field-input mt-2"
          value={v}
          onChange={(e) => onChange(e.target.value || null)}
        />
      </label>
    );
  }

  // text
  const v = typeof value === "string" ? value : "";
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      <input
        className="field-input mt-2"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
