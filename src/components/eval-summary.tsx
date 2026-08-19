import {
  EVAL_SECTIONS,
  extractPhaseScores,
  GRADED_PHASES,
  type EvalAnswers,
  type EvalField,
} from "@/lib/presentation-eval";
import { cn } from "@/lib/utils";

export type EvalSummaryMeta = {
  presenterName: string;
  observerName?: string;
  store?: string;
  evalDate: string;
  clientName?: string;
  floorLeader?: string;
  startTime?: string;
  partySize?: string;
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return false;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return value.length === 0;
  return true;
}

function formatValue(field: EvalField, value: unknown): string | string[] | null {
  if (isEmpty(value)) return null;
  if (field.type === "checkboxes" && Array.isArray(value)) {
    return value.map(String);
  }
  if (field.type === "scale") {
    return `${value} / 10`;
  }
  if (field.type === "yesno") {
    return String(value);
  }
  return String(value).trim();
}

/** Coaching-first printable brief: only answered fields, grouped by phase. */
export function EvalSummary({
  meta,
  answers,
  className,
}: {
  meta: EvalSummaryMeta;
  answers: EvalAnswers;
  className?: string;
}) {
  const score =
    typeof answers.reflection_score === "number"
      ? answers.reflection_score
      : typeof answers.reflection_score === "string" && answers.reflection_score
        ? Number(answers.reflection_score)
        : null;

  const sectionsWithAnswers = EVAL_SECTIONS.map((section) => {
    const rows = section.fields
      .map((field) => {
        const formatted = formatValue(field, answers[field.key]);
        if (formatted == null) return null;
        return { field, formatted };
      })
      .filter(Boolean) as { field: EvalField; formatted: string | string[] }[];
    return { section, rows };
  }).filter((s) => s.rows.length > 0);

  // Pull coaching highlights to the top when present
  const excel =
    (typeof answers.part1_excel === "string" && answers.part1_excel.trim()) ||
    (typeof answers.part2_excel === "string" && answers.part2_excel.trim()) ||
    null;
  const improve =
    (typeof answers.part1_improve === "string" && answers.part1_improve.trim()) ||
    (typeof answers.part2_flow_improve === "string" && answers.part2_flow_improve.trim()) ||
    (typeof answers.part2_close_advice === "string" && answers.part2_close_advice.trim()) ||
    null;

  return (
    <article
      className={cn(
        "eval-summary mx-auto max-w-2xl bg-paper text-ink",
        className,
      )}
    >
      {/* Header */}
      <header className="border-b border-line pb-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brass">
          Presentation Evaluation · Coaching brief
        </p>
        <h1 className="mt-2 font-display text-3xl leading-none tracking-tight sm:text-4xl">
          {meta.presenterName}
        </h1>
        <dl className="mt-4 grid gap-1 text-sm text-muted sm:grid-cols-2">
          {meta.evalDate && (
            <div>
              <span className="text-ink/70">Date: </span>
              {meta.evalDate}
            </div>
          )}
          {meta.store && (
            <div>
              <span className="text-ink/70">Store: </span>
              {meta.store}
            </div>
          )}
          {meta.observerName && (
            <div>
              <span className="text-ink/70">Observer: </span>
              {meta.observerName}
            </div>
          )}
          {meta.clientName && (
            <div>
              <span className="text-ink/70">Client: </span>
              {meta.clientName}
            </div>
          )}
          {meta.floorLeader && (
            <div>
              <span className="text-ink/70">Floor leader: </span>
              {meta.floorLeader}
            </div>
          )}
          {meta.startTime && (
            <div>
              <span className="text-ink/70">Start: </span>
              {meta.startTime}
            </div>
          )}
          {meta.partySize && (
            <div>
              <span className="text-ink/70">Party size: </span>
              {meta.partySize}
            </div>
          )}
        </dl>
        {score != null && Number.isFinite(score) && (
          <p className="mt-4 inline-flex items-baseline gap-2 rounded-sm border border-brass/40 bg-paper-2 px-3 py-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brass">
              Self-score
            </span>
            <span className="font-display text-2xl leading-none tabular-nums text-navy">
              {score}/10
            </span>
          </p>
        )}
      </header>

      {/* Manager phase grades */}
      {(() => {
        const phases = extractPhaseScores(answers);
        const entries = GRADED_PHASES.filter((p) => phases[p.key] != null);
        if (!entries.length) return null;
        const avg =
          entries.reduce((n, p) => n + (phases[p.key] || 0), 0) / entries.length;
        return (
          <section className="mt-6 rounded-md border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brass">
                Manager grades by phase
              </p>
              <p className="font-display text-2xl leading-none tabular-nums text-navy">
                {Math.round(avg * 10) / 10}
                <span className="text-sm text-muted"> / 10 avg</span>
              </p>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entries.map((p) => (
                <li
                  key={p.key}
                  className="flex items-center justify-between rounded-sm bg-paper-2 px-3 py-2 text-sm"
                >
                  <span className="text-muted">{p.label}</span>
                  <span className="font-medium tabular-nums text-navy">
                    {phases[p.key]}/10
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {/* Coaching highlights */}
      {(excel || improve) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {excel && (
            <div className="rounded-md border border-navy/15 bg-surface px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brass">
                Excelled at
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{excel}</p>
            </div>
          )}
          {improve && (
            <div className="rounded-md border border-brass/30 bg-paper-2 px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brass">
                Focus next
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{improve}</p>
            </div>
          )}
        </section>
      )}

      {/* Phase-by-phase answers only */}
      <div className="mt-8 space-y-7">
        {sectionsWithAnswers.map(({ section, rows }) => (
          <section key={section.id} className="break-inside-avoid">
            <h2 className="font-display text-xl leading-none text-navy">
              {section.title}
            </h2>
            {section.kicker && (
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-brass">
                {section.kicker}
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {rows.map(({ field, formatted }) => (
                <li key={field.key} className="text-sm leading-relaxed">
                  <p className="font-medium text-ink/80">{field.label}</p>
                  {Array.isArray(formatted) ? (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">
                      {formatted.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className={cn(
                        "mt-0.5 whitespace-pre-wrap",
                        field.type === "yesno" &&
                          formatted === "No" &&
                          "font-medium text-danger",
                        field.type === "yesno" &&
                          formatted === "Yes" &&
                          "text-navy",
                      )}
                    >
                      {formatted}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {sectionsWithAnswers.length === 0 && (
        <p className="mt-8 text-sm text-muted">No answers were recorded on this evaluation.</p>
      )}

      <footer className="mt-10 border-t border-line pt-4 text-xs text-muted">
        Waterman College · Coaching brief · Print or save for the Specialist’s next shift
      </footer>
    </article>
  );
}
