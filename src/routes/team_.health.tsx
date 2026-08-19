import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  listStoreHealth,
  type HealthSnapshot,
  type PersonHealth,
  type RiskLevel,
  type StoreHealth,
} from "@/lib/store-health";
import {
  getStoreHuddlePack,
  listNeedsEvalThisWeek,
  listObserverCalibration,
} from "@/lib/presentation-eval";
import { pageHead } from "@/lib/page-title";
import { cn, errorMessage } from "@/lib/utils";

export const Route = createFileRoute("/team_/health")({
  component: HealthPage,
  head: () =>
    pageHead(
      "Training Health",
      "Store-level training completion, overdue, new-hire ramp, and risk flags.",
    ),
});

function HealthPage() {
  return (
    <SiteShell>
      <AuthGate>
        <HealthDesk />
      </AuthGate>
    </SiteShell>
  );
}

function HealthDesk() {
  const { access, ready } = useAccess();
  const [snap, setSnap] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [needsEval, setNeedsEval] = useState<string[]>([]);
  const [calibration, setCalibration] = useState<Awaited<ReturnType<typeof listObserverCalibration>>>([]);
  const [huddleStore, setHuddleStore] = useState("");
  const [huddle, setHuddle] = useState<Awaited<ReturnType<typeof getStoreHuddlePack>> | null>(null);
  const [huddleBusy, setHuddleBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [next, needs, cal] = await Promise.all([
        listStoreHealth(),
        listNeedsEvalThisWeek().catch(() => [] as string[]),
        listObserverCalibration().catch(() => []),
      ]);
      setSnap(next);
      setNeedsEval(needs);
      setCalibration(cal);
    } catch (err) {
      setSnap(null);
      setError(errorMessage(err) || "Could not load training health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !access.canManagePeople) return;
    void load();
  }, [ready, access.canManagePeople, access.userId, load]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  if (!access.canManagePeople) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="kicker">Training Health</p>
        <h1 className="mt-3 font-display text-4xl">Leaders only</h1>
        <p className="mt-4 text-muted">
          Store training health is available to managers and leadership.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/training">Back to Training</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
          >
            <ArrowLeft className="size-3.5" /> Team
          </Link>
          <p className="kicker mt-6">Leadership</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">
            Training Health
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Store-level completion, overdue assignments, new-hire ramp, and risk
            flags — the closed loop from Team assignments and Locker activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          {snap && (
            <Button
              type="button"
              variant="brass"
              size="sm"
              onClick={() => exportCsv(snap)}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-lg border border-danger/30 bg-danger/5 px-5 py-4 text-sm text-danger">
          {error}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-3"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      )}

      {loading && !snap ? (
        <div className="mt-10 space-y-4">
          <div className="h-24 animate-pulse rounded-lg bg-navy/5" />
          <div className="h-48 animate-pulse rounded-lg bg-navy/5" />
        </div>
      ) : snap ? (
        <>
          {/* Summary cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="People in view" value={String(snap.totals.staff)} />
            <SummaryCard label="Avg path complete" value={`${snap.totals.avgPct}%`} />
            <SummaryCard
              label="Overdue assignments"
              value={String(snap.totals.overdue)}
              tone={snap.totals.overdue > 0 ? "warn" : "ok"}
            />
            <SummaryCard label="New hires" value={String(snap.totals.newHires)} />
            <SummaryCard
              label="Stores at risk"
              value={String(snap.totals.atRiskStores)}
              tone={snap.totals.atRiskStores > 0 ? "risk" : "ok"}
            />
            <SummaryCard
              label="Needs eval this week"
              value={String(needsEval.length)}
              tone={needsEval.length > 0 ? "warn" : "ok"}
            />
          </div>

          {/* Store table */}
          <section className="mt-12">
            <p className="kicker">By store</p>
            <span className="rule-brass mt-3" />
            {snap.stores.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                No store assignments in your view yet. Place people on stores from
                the Team desk.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3 font-medium">Store</th>
                      <th className="px-3 py-3 font-medium">Staff</th>
                      <th className="px-3 py-3 font-medium">Path %</th>
                      <th className="px-3 py-3 font-medium">Overdue</th>
                      <th className="px-3 py-3 font-medium">New hires</th>
                      <th className="px-3 py-3 font-medium">7d velocity</th>
                      <th className="px-3 py-3 font-medium">Risk</th>
                      <th className="px-3 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {snap.stores.map((s) => (
                      <StoreRow
                        key={s.store}
                        store={s}
                        expanded={expanded === s.store}
                        onToggle={() =>
                          setExpanded((cur) => (cur === s.store ? null : s.store))
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Unassigned */}
          {snap.unassigned.length > 0 && (
            <section className="mt-12">
              <p className="kicker">No store assigned</p>
              <span className="rule-brass mt-3" />
              <div className="mt-5 space-y-2">
                {snap.unassigned.map((p) => (
                  <PersonRow key={p.id} person={p} />
                ))}
              </div>
            </section>
          )}


          {/* 2-minute huddle pack */}
          <section className="mt-12">
            <p className="kicker">Huddle pack</p>
            <span className="rule-brass mt-3" />
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Pick a store. Get the weakest presentation phase, three talking points,
              and a practice prompt for the morning huddle.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                className="field-input max-w-xs"
                value={huddleStore}
                onChange={(e) => setHuddleStore(e.target.value)}
              >
                <option value="">Choose store</option>
                {snap.stores.map((s) => (
                  <option key={s.store} value={s.store}>
                    {s.store}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={!huddleStore || huddleBusy}
                onClick={() => {
                  setHuddleBusy(true);
                  getStoreHuddlePack({ data: { store: huddleStore } })
                    .then(setHuddle)
                    .catch((err) => toast.error(errorMessage(err) || "Could not build huddle"))
                    .finally(() => setHuddleBusy(false));
                }}
              >
                {huddleBusy ? "Building…" : "Build pack"}
              </Button>
            </div>
            {huddle && (
              <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-5 shadow-card">
                <p className="font-medium text-ink">
                  {huddle.store}
                  {huddle.weakestPhase
                    ? ` · Focus: ${huddle.weakestPhase} (${huddle.weakestAvg}/10)`
                    : " · Not enough eval data yet"}
                </p>
                {huddle.talkingPoints.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
                    {huddle.talkingPoints.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                {huddle.practicePrompt && (
                  <p className="mt-4 rounded-sm bg-paper-2 px-3 py-2 text-sm">
                    <span className="font-medium text-brass">Practice: </span>
                    {huddle.practicePrompt}
                  </p>
                )}
                {huddle.suggestedLessons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted">
                      Suggested lessons
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {huddle.suggestedLessons.map((s) => (
                        <li key={`${s.trackId}-${s.lessonSlug}`}>
                          <Link
                            to="/training/$track/$lesson"
                            params={{ track: s.trackId, lesson: s.lessonSlug }}
                            className="text-brass hover:text-navy"
                          >
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Observer calibration */}
          {calibration.length > 0 && (
            <section className="mt-12">
              <p className="kicker">Observer calibration</p>
              <span className="rule-brass mt-3" />
              <p className="mt-3 max-w-2xl text-sm text-muted">
                Average phase grades given by each observer. Use this to spot hard vs soft
                scoring — not to rank people.
              </p>
              <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                      <th className="px-4 py-3 font-medium">Observer</th>
                      <th className="px-3 py-3 font-medium">Evals</th>
                      <th className="px-3 py-3 font-medium">Avg grade given</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calibration.map((c) => (
                      <tr key={c.observerId} className="border-b border-line/80">
                        <td className="px-4 py-3 font-medium">{c.observerName}</td>
                        <td className="px-3 py-3 tabular-nums">{c.evalCount}</td>
                        <td className="px-3 py-3 tabular-nums">
                          {c.overallAvg != null ? `${c.overallAvg}/10` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="mt-10 text-xs text-muted">
            Generated {new Date(snap.generatedAt).toLocaleString()}. Risk flags
            are guidance only — use Team to adjust assignments and due dates.
          </p>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "risk";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-4 shadow-card",
        tone === "risk" && "border-danger/30 bg-danger/5",
        tone === "warn" && "border-brass/40 bg-paper-2",
        tone === "ok" && "border-line bg-surface",
        tone === "neutral" && "border-line bg-surface",
      )}
    >
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl leading-none tabular-nums">{value}</p>
    </div>
  );
}

function StoreRow({
  store: s,
  expanded,
  onToggle,
}: {
  store: StoreHealth;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-line/80 transition-colors",
          s.risk === "risk" && "bg-danger/[0.03]",
          s.risk === "watch" && "bg-paper-2/60",
        )}
      >
        <td className="px-4 py-3 font-medium text-ink">{s.store}</td>
        <td className="px-3 py-3 tabular-nums">{s.staffCount}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="progress-track w-16">
              <div
                className={cn(
                  "progress-fill",
                  s.pathPct < 40 ? "bg-danger/80" : s.pathPct < 70 ? "bg-brass" : "bg-navy",
                )}
                style={{ width: `${s.pathPct}%` }}
              />
            </div>
            <span className="tabular-nums text-xs">{s.pathPct}%</span>
          </div>
        </td>
        <td
          className={cn(
            "px-3 py-3 tabular-nums",
            s.overdueCount > 0 && "font-medium text-danger",
          )}
        >
          {s.overdueCount}
        </td>
        <td className="px-3 py-3 tabular-nums">{s.newHireCount}</td>
        <td className="px-3 py-3 tabular-nums">{s.velocityLessons7d}</td>
        <td className="px-3 py-3">
          <RiskBadge risk={s.risk} />
        </td>
        <td className="px-3 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="text-xs uppercase tracking-[0.12em] text-brass hover:text-navy"
          >
            {expanded ? "Hide" : "People"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-line bg-paper/80">
          <td colSpan={8} className="px-4 py-4">
            {s.riskFlags.length > 0 && (
              <p className="mb-3 text-xs text-muted">
                Flags: {s.riskFlags.join(" · ")}
              </p>
            )}
            <div className="space-y-2">
              {s.people.map((p) => (
                <PersonRow key={p.id} person={p} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PersonRow({ person: p }: { person: PersonHealth }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-sm border px-3 py-2.5",
        p.risk === "risk"
          ? "border-danger/25 bg-danger/[0.04]"
          : p.risk === "watch"
            ? "border-brass/30 bg-paper-2"
            : "border-line bg-surface",
      )}
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">{p.name}</p>
        <p className="text-xs text-muted">
          {p.roleLabel}
          {p.isNewHire ? " · New hire" : ""}
          {p.riskReasons.length > 0 ? ` · ${p.riskReasons.join(", ")}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs tabular-nums text-muted">
        <span>
          {p.done}/{p.total} · {p.pct}%
        </span>
        {p.overdueCount > 0 && (
          <span className="font-medium text-danger">{p.overdueCount} overdue</span>
        )}
        <RiskBadge risk={p.risk} />
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em]",
        risk === "risk" && "bg-danger/10 text-danger",
        risk === "watch" && "bg-brass/15 text-brass",
        risk === "ok" && "bg-navy/5 text-muted",
      )}
    >
      {risk === "ok" ? "On track" : risk === "watch" ? "Watch" : "At risk"}
    </span>
  );
}

function exportCsv(snap: HealthSnapshot) {
  const lines: string[] = [
    "store,staff,path_pct,overdue,new_hires,velocity_7d,risk,flags",
  ];
  for (const s of snap.stores) {
    lines.push(
      [
        csvEscape(s.store),
        s.staffCount,
        s.pathPct,
        s.overdueCount,
        s.newHireCount,
        s.velocityLessons7d,
        s.risk,
        csvEscape(s.riskFlags.join("; ")),
      ].join(","),
    );
  }
  lines.push("");
  lines.push("store,name,role,pct,done,total,overdue,risk,reasons");
  for (const s of snap.stores) {
    for (const p of s.people) {
      lines.push(
        [
          csvEscape(s.store),
          csvEscape(p.name),
          csvEscape(p.roleLabel),
          p.pct,
          p.done,
          p.total,
          p.overdueCount,
          p.risk,
          csvEscape(p.riskReasons.join("; ")),
        ].join(","),
      );
    }
  }
  for (const p of snap.unassigned) {
    lines.push(
      [
        "(unassigned)",
        csvEscape(p.name),
        csvEscape(p.roleLabel),
        p.pct,
        p.done,
        p.total,
        p.overdueCount,
        p.risk,
        csvEscape(p.riskReasons.join("; ")),
      ].join(","),
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waterman-training-health-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded");
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
