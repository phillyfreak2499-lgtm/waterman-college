import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { useProgress } from "@/components/progress-provider";
import type { RoleId } from "@/lib/content";
import { continueLesson, ledgerProgress } from "@/lib/progress-stats";
import { cn } from "@/lib/utils";

export function ProgressPanel({ role }: { role: RoleId }) {
  const { rows, ready } = useProgress();
  const { catalog } = useCatalog();
  const { access } = useAccess();
  const path = catalog.tracks.filter(
    (t) => t.role === role || access.assignedTrackIds.includes(t.id),
  );
  const ledger = ledgerProgress(rows, path);
  const next = continueLesson(rows, role, path);
  const label = ledger.done === 0 ? "Open the ledger" : ledger.left === 0 ? "Review" : "Continue";
  const pct = ready && ledger.total > 0 ? Math.round((ledger.done / ledger.total) * 100) : 0;

  if (!path.length) return null;

  return (
    <section className="rounded-lg border border-line bg-surface px-5 py-6 shadow-card sm:px-6">
      <p className="kicker">Training ledger</p>
      <p className="mt-2 font-display text-2xl leading-[1.1] sm:text-3xl">
        {ready ? ledger.line : "Opening the ledger…"}
      </p>
      {ready && ledger.total > 0 && (
        <div className="mt-4">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs tabular-nums text-muted">{pct}% of this path</p>
        </div>
      )}
      {ready && ledger.weeks > 0 && ledger.total > 0 && (
        <ol className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: Math.min(ledger.weeks, 8) }, (_, i) => {
            const week = i + 1;
            const state = ledger.left === 0 || week < ledger.week ? "done" : week === ledger.week ? "now" : "later";
            return (
              <li
                key={week}
                className={cn(
                  "flex h-9 min-w-14 items-center justify-center rounded-sm border px-2 text-[0.7rem] font-medium uppercase tracking-[0.12em]",
                  state === "done" && "border-navy bg-navy text-paper",
                  state === "now" && "border-brass bg-paper-2 text-brass",
                  state === "later" && "border-line text-muted",
                )}
              >
                Week {week}
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {next && ready && ledger.left > 0 ? (
          <p className="min-w-0 truncate text-sm text-muted">
            Next up: <span className="text-navy">{next.title}</span>
          </p>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to="/training/$track/$lesson"
            params={{ track: next.trackId, lesson: next.lessonSlug }}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-navy px-4 text-sm font-medium text-paper hover:bg-navy-deep"
          >
            {label}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
