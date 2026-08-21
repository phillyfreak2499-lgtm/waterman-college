import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Award, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Redirect } from "@/lib/auth/gates";
import { isLeader } from "@/lib/access";
import { pageHead } from "@/lib/page-title";
import { cn, errorMessage } from "@/lib/utils";
import {
  METRICS,
  metricColor,
  bandClass,
  COLOR_LABEL,
  COLOR_SEVERITY,
  formatMetric,
  suggestLessonsForMetrics,
  currentPeriod,
  periodLabel,
  periodRange,
  loadMetricsBoard,
  type BoardPerson,
  type MetricColor,
  type MetricKey,
  type MetricsBoard,
} from "@/lib/metrics";

export const Route = createFileRoute("/huddle")({
  component: HuddlePage,
  head: () =>
    pageHead(
      "Daily Huddle",
      "A two-minute morning briefing: who to coach, wins to celebrate, and how each store is doing.",
    ),
});

function HuddlePage() {
  return (
    <SiteShell>
      <AuthGate>
        <HuddleGate />
      </AuthGate>
    </SiteShell>
  );
}

function HuddleGate() {
  const { access, ready } = useAccess();
  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <div className="h-40 animate-pulse rounded-lg bg-navy/5" />
      </div>
    );
  }
  if (!isLeader(access.role)) return <Redirect to="/locker" />;
  return <HuddleView />;
}

type Improvement = { label: string; from: MetricColor; to: MetricColor };

function weakChips(p: BoardPerson): { key: MetricKey; label: string; color: MetricColor }[] {
  return METRICS.map((m) => ({ key: m.key, label: m.short, color: metricColor(m.key, p.values[m.key]) }))
    .filter((x): x is { key: MetricKey; label: string; color: MetricColor } =>
      x.color === "red" || x.color === "orange",
    )
    .sort((a, b) => COLOR_SEVERITY[b.color] - COLOR_SEVERITY[a.color]);
}

function improvements(p: BoardPerson): Improvement[] {
  if (!p.prior) return [];
  const out: Improvement[] = [];
  for (const m of METRICS) {
    const cur = metricColor(m.key, p.values[m.key]);
    const pri = metricColor(m.key, p.prior[m.key]);
    if (cur && pri && COLOR_SEVERITY[cur] < COLOR_SEVERITY[pri]) {
      out.push({ label: m.short, from: pri, to: cur });
    }
  }
  return out;
}

function allGreen(p: BoardPerson): boolean {
  const entered = METRICS.map((m) => metricColor(m.key, p.values[m.key])).filter(Boolean) as MetricColor[];
  return entered.length >= 4 && entered.every((c) => c === "green");
}

function HuddleView() {
  const period = useMemo(() => currentPeriod(), []);
  const [board, setBoard] = useState<MetricsBoard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await loadMetricsBoard({ data: { year: period.year, period: period.period } }));
    } catch (err) {
      toast.error(errorMessage(err) || "Could not load the huddle");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const people = board?.people ?? [];

  const coach = useMemo(
    () =>
      people
        .map((p) => ({ p, weak: weakChips(p) }))
        .filter((x) => x.weak.some((w) => w.color === "red"))
        .sort(
          (a, b) =>
            b.weak.reduce((s, w) => s + COLOR_SEVERITY[w.color], 0) -
            a.weak.reduce((s, w) => s + COLOR_SEVERITY[w.color], 0),
        ),
    [people],
  );

  const wins = useMemo(
    () =>
      people
        .map((p) => ({ p, ups: improvements(p), star: allGreen(p) }))
        .filter((x) => x.ups.length > 0 || x.star)
        .sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || b.ups.length - a.ups.length),
    [people],
  );

  const pulse = useMemo(() => {
    const byStore = new Map<string, { name: string; red: number; watch: number; people: number }>();
    for (const p of people) {
      const id = p.storeId ?? "—";
      const row = byStore.get(id) ?? { name: p.storeName ?? "—", red: 0, watch: 0, people: 0 };
      const weak = weakChips(p);
      const hasRed = weak.some((w) => w.color === "red");
      row.people++;
      if (hasRed) row.red++;
      else if (weak.length > 0) row.watch++;
      byStore.set(id, row);
    }
    return [...byStore.values()].sort((a, b) => b.red - a.red || b.watch - a.watch);
  }, [people]);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    [],
  );
  const range = periodRange(period.year, period.period);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{today}</p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">
            Daily Huddle
          </h1>
          <p className="mt-2 text-sm text-muted">
            {periodLabel(period.year, period.period)} · {fmtRange(range)}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/metrics">Full board</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-navy/5" />
          <div className="h-24 animate-pulse rounded-lg bg-navy/5" />
        </div>
      ) : people.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line bg-paper px-6 py-12 text-center">
          <p className="font-display text-xl">No metrics entered yet.</p>
          <p className="mt-2 text-sm text-muted">
            Once the team logs this period&rsquo;s numbers, the huddle fills in automatically.
          </p>
          <Button asChild className="mt-5" variant="brass">
            <Link to="/metrics">Open the board</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Coach today */}
          <section>
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-danger" aria-hidden />
              <p className="kicker">Coach today</p>
            </div>
            <span className="rule-brass mt-3" />
            {coach.length === 0 ? (
              <p className="mt-4 rounded-md border border-line bg-surface px-4 py-4 text-sm text-muted shadow-card">
                No red metrics on the floor right now. Keep the momentum.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {coach.map(({ p, weak }) => {
                  const lesson = suggestLessonsForMetrics(p.values, 1)[0];
                  return (
                    <li
                      key={p.userId}
                      className="rounded-lg border border-line bg-surface px-4 py-3 shadow-card"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{p.name}</p>
                          <p className="text-xs text-muted">{p.storeName ?? "—"}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {weak.map((w) => (
                            <span key={w.key} className={cn("metric-band", bandClass(w.color))}>
                              <span className="metric-dot" aria-hidden />
                              {w.label} {formatMetric(w.key, p.values[w.key])}
                            </span>
                          ))}
                        </div>
                      </div>
                      {lesson && (
                        <Link
                          to="/training/$track/$lesson"
                          params={{ track: lesson.trackId, lesson: lesson.lessonSlug }}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brass hover:underline"
                        >
                          Coach with: {lesson.title}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Wins */}
          <section>
            <div className="flex items-center gap-2">
              <Award className="size-4 text-brass" aria-hidden />
              <p className="kicker">Wins to celebrate</p>
            </div>
            <span className="rule-brass mt-3" />
            {wins.length === 0 ? (
              <p className="mt-4 rounded-md border border-line bg-surface px-4 py-4 text-sm text-muted shadow-card">
                No movement up yet this period — a chance to set the tone.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {wins.map(({ p, ups, star }) => (
                  <li
                    key={p.userId}
                    className="rounded-lg border border-line bg-surface px-4 py-3 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.name}</p>
                        <p className="truncate text-xs text-muted">{p.storeName ?? "—"}</p>
                      </div>
                      {star && (
                        <span className="metric-band band-green shrink-0">
                          <span className="metric-dot" aria-hidden />
                          All green
                        </span>
                      )}
                    </div>
                    {ups.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {ups.map((u) => (
                          <li key={u.label} className="flex items-center gap-1 text-xs text-ink">
                            <ArrowUpRight className="size-3.5 text-navy" aria-hidden />
                            {u.label}: {COLOR_LABEL[u.from]} → {COLOR_LABEL[u.to]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Store pulse */}
          <section>
            <p className="kicker">Store pulse</p>
            <span className="rule-brass mt-3" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {pulse.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 shadow-card"
                >
                  <span className="min-w-0 truncate font-medium text-ink">{s.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs">
                    {s.red > 0 && (
                      <span className="metric-band band-red">
                        <span className="metric-dot" aria-hidden />
                        {s.red} to coach
                      </span>
                    )}
                    {s.watch > 0 && (
                      <span className="metric-band band-orange">
                        <span className="metric-dot" aria-hidden />
                        {s.watch} watch
                      </span>
                    )}
                    {s.red === 0 && s.watch === 0 && (
                      <span className="metric-band band-green">
                        <span className="metric-dot" aria-hidden />
                        Clear
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function fmtRange(r: { start: string; end: string }) {
  const f = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  return `${f(r.start)}–${f(r.end)}`;
}
