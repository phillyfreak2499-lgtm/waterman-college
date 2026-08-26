import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, errorMessage } from "@/lib/utils";
import {
  METRICS,
  formatMetric,
  periodLabel,
  type MetricPeriod,
} from "@/lib/metrics";
import {
  commitTableauSync,
  previewTableauSync,
  type SyncMatch,
  type SyncPreview,
} from "@/lib/metrics-sync";

export function MetricsSyncPanel({
  period,
  onSynced,
}: {
  period: MetricPeriod;
  onSynced: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [working, setWorking] = useState<"preview" | "commit" | null>(null);

  const matched = useMemo(
    () => (preview?.matches ?? []).filter((m) => m.subjectType !== "skip"),
    [preview],
  );
  const skipped = useMemo(
    () => (preview?.matches ?? []).filter((m) => m.subjectType === "skip"),
    [preview],
  );

  async function runPreview() {
    if (!text.trim()) {
      toast.error("Paste a Tableau or weekly-check-in export first");
      return;
    }
    setWorking("preview");
    try {
      const next = await previewTableauSync({
        data: { text, year: period.year, period: period.period },
      });
      setPreview(next);
      if (next.guessedPeriod && next.guessedPeriod !== period.period) {
        toast.message(`That paste looks like Period ${next.guessedPeriod}`, {
          description: `You're writing Period ${period.period}. Change the period picker if that's wrong.`,
        });
      }
      if (!next.matched) toast.error("Nothing matched a store or locker");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not read that paste");
    } finally {
      setWorking(null);
    }
  }

  async function runCommit() {
    if (!text.trim() || !matched.length) return;
    setWorking("commit");
    try {
      const res = await commitTableauSync({
        data: { text, year: period.year, period: period.period },
      });
      toast.success(
        `Wrote ${res.matched} ${res.matched === 1 ? "row" : "rows"} to ${periodLabel(period.year, period.period)}`,
      );
      setPreview(null);
      setText("");
      onSynced();
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save the sync");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-line bg-surface shadow-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-medium text-ink">Update from Tableau</span>
          <span className="mt-0.5 block text-sm text-muted">
            Paste a period export. Matched stores and lockers update together.
          </span>
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-brass">
          {open ? "Hide" : "Step 1"}
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <p className="max-w-2xl text-sm text-muted">
            Copy the Period Summary from Tableau or the weekly check-in sheet — store
            names in the first column, NSNU / Demo % / Demo Close % in the headers.
            Conversion, arch supports, and ticket stay as they are if the paste
            doesn&rsquo;t include them.
          </p>
          <textarea
            className="field-input mt-3 min-h-36 w-full font-mono text-xs leading-relaxed"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
            placeholder={"Store,NSNU,Demo %,Demo Close %\nPlano,905,87,61\nSouthlake,1006.75,84,74"}
            spellCheck={false}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void runPreview()} disabled={!!working}>
              {working === "preview" ? "Reading…" : "Preview matches"}
            </Button>
            <Button
              size="sm"
              variant="brass"
              onClick={() => void runCommit()}
              disabled={!!working || !matched.length}
            >
              {working === "commit" ? "Writing…" : `Write ${matched.length || ""} to lockers`.replace("  ", " ")}
            </Button>
          </div>
          {preview && (
            <div className="mt-4">
              {preview.warnings.map((w) => (
                <p key={w} className="text-sm text-orange-800">
                  {w}
                </p>
              ))}
              <p className="text-sm text-muted">
                {preview.matched} matched · {preview.skipped} skipped
              </p>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                {preview.matches.map((m) => (
                  <MatchRow key={`${m.subjectType}-${m.label}`} match={m} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: SyncMatch }) {
  const ok = match.subjectType !== "skip";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
      <span>
        <span className="font-medium text-ink">{match.label}</span>
        <span className={cn("ml-2 text-xs", ok ? "text-brass" : "text-muted")}>{match.reason}</span>
      </span>
      <span className="tabular-nums text-muted">
        {METRICS.filter((m) => match.present.includes(m.key))
          .map((m) => `${m.short} ${formatMetric(m.key, match.values[m.key])}`)
          .join(" · ")}
      </span>
    </li>
  );
}
