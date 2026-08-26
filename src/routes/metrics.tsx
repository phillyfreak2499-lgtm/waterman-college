import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Copy,
  Download,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { MetricSuggestions } from "@/components/metrics-panel";
import { MetricsSyncPanel } from "@/components/metrics-sync-panel";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Redirect } from "@/lib/auth/gates";
import { isLeader, roleRank } from "@/lib/access";
import { pageHead } from "@/lib/page-title";
import { cn, errorMessage } from "@/lib/utils";
import {
  METRICS,
  metricColor,
  bandClass,
  formatMetric,
  metricTrend,
  droppedBand,
  rowSeverity,
  recentPeriods,
  periodLabel,
  periodRange,
  currentPeriod,
  COLOR_LABEL,
  loadMetricsBoard,
  getPersonTrend,
  savePersonMetrics,
  type MetricColor,
  type MetricKey,
  type MetricPeriod,
  type MetricValues,
  type BoardPerson,
  type MetricsBoard,
  type TrendPoint,
} from "@/lib/metrics";
import { loadStoreMetricsBoard, type StoreMetricRow } from "@/lib/metrics-sync";

export const Route = createFileRoute("/metrics")({
  component: MetricsPage,
  head: () =>
    pageHead(
      "Team Metrics",
      "Search, filter, and coach on performance across the floor — colors and trends at a glance.",
    ),
});

function MetricsPage() {
  return (
    <SiteShell>
      <AuthGate>
        <BoardGate />
      </AuthGate>
    </SiteShell>
  );
}

function BoardGate() {
  const { access, ready } = useAccess();
  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="h-40 animate-pulse rounded-lg bg-navy/5" />
      </div>
    );
  }
  if (!isLeader(access.role)) return <Redirect to="/locker" />;
  return <BoardView />;
}

const ALL_COLORS: MetricColor[] = ["green", "blue", "orange", "red"];

type SortKey = "severity" | "name" | "store";

function BoardView() {
  const { access } = useAccess();
  const canSync = roleRank(access.role) >= 3;
  const periods = useMemo(() => recentPeriods(8), []);
  const [period, setPeriod] = useState<MetricPeriod>(() => currentPeriod());
  const [board, setBoard] = useState<MetricsBoard | null>(null);
  const [stores, setStores] = useState<StoreMetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [metricKey, setMetricKey] = useState<MetricKey | "">("");
  const [colors, setColors] = useState<Set<MetricColor>>(new Set());
  const [droppedOnly, setDroppedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [openUser, setOpenUser] = useState<string | null>(null);

  const load = useCallback(async (p: MetricPeriod) => {
    setLoading(true);
    try {
      const [nextBoard, storeBoard] = await Promise.all([
        loadMetricsBoard({ data: { year: p.year, period: p.period } }),
        loadStoreMetricsBoard({ data: { year: p.year, period: p.period } }).catch(() => null),
      ]);
      setBoard(nextBoard);
      setStores(storeBoard?.stores ?? []);
    } catch (err) {
      toast.error(errorMessage(err) || "Could not load the board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  function toggleColor(c: MetricColor) {
    setColors((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function clearFilters() {
    setName("");
    setStoreId("");
    setRegionId("");
    setMetricKey("");
    setColors(new Set());
    setDroppedOnly(false);
  }

  function coachingPreset() {
    clearFilters();
    setColors(new Set<MetricColor>(["red", "orange"]));
    setDroppedOnly(false);
    setSortKey("severity");
    toast.message("Coaching list", { description: "Everyone with a Red or Orange metric, worst first." });
  }

  const people = board?.people ?? [];

  // color match: does this person have any metric in the selected colors?
  // If a specific metric is chosen, only that metric counts.
  const matchesColor = useCallback(
    (p: BoardPerson) => {
      if (colors.size === 0) return true;
      const keys = metricKey ? [metricKey] : METRICS.map((m) => m.key);
      return keys.some((k) => {
        const c = metricColor(k, p.values[k]);
        return c != null && colors.has(c);
      });
    },
    [colors, metricKey],
  );

  const matchesDropped = useCallback(
    (p: BoardPerson) => {
      if (!droppedOnly) return true;
      if (!p.prior) return false;
      const keys = metricKey ? [metricKey] : METRICS.map((m) => m.key);
      return keys.some((k) =>
        droppedBand(metricColor(k, p.values[k]), metricColor(k, p.prior![k])),
      );
    },
    [droppedOnly, metricKey],
  );

  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase();
    const list = people.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (storeId && p.storeId !== storeId) return false;
      if (regionId && p.regionId !== regionId) return false;
      if (!matchesColor(p)) return false;
      if (!matchesDropped(p)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "store")
        return (a.storeName ?? "").localeCompare(b.storeName ?? "") || a.name.localeCompare(b.name);
      // severity: worst first
      return rowSeverity(b.values) - rowSeverity(a.values) || a.name.localeCompare(b.name);
    });
    return list;
  }, [people, name, storeId, regionId, matchesColor, matchesDropped, sortKey]);

  const stats = useMemo(() => {
    let reds = 0;
    let dropped = 0;
    for (const p of filtered) {
      if (METRICS.some((m) => metricColor(m.key, p.values[m.key]) === "red")) reds++;
      if (p.prior && METRICS.some((m) => droppedBand(metricColor(m.key, p.values[m.key]), metricColor(m.key, p.prior![m.key]))))
        dropped++;
    }
    return { shown: filtered.length, reds, dropped };
  }, [filtered]);

  function exportCsv() {
    if (!filtered.length) {
      toast.error("Nothing to export");
      return;
    }
    const csv = toDelimited(filtered, period, ",");
    downloadText(csv, `team-metrics-${period.year}-p${period.period}.csv`, "text/csv");
    toast.success(`Exported ${filtered.length} ${filtered.length === 1 ? "person" : "people"}`);
  }

  async function copyList() {
    if (!filtered.length) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(toDelimited(filtered, period, "\t"));
      toast.success("Copied — paste into a sheet or message");
    } catch {
      toast.error("Could not copy");
    }
  }

  const hasFilters =
    name || storeId || regionId || metricKey || colors.size > 0 || droppedOnly;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <p className="kicker">Leadership</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">
        Team Metrics
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Everyone&rsquo;s numbers for the period, graded by color. Filter to who needs attention,
        drill into trends, and walk away with a coaching list. Store totals come from Tableau
        when you paste an export — lockers update with the same write.
      </p>

      {canSync && <MetricsSyncPanel period={period} onSynced={() => void load(period)} />}

      {/* Period + primary actions */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <label htmlFor="board-period" className="text-sm font-medium text-ink">
          Period
        </label>
        <select
          id="board-period"
          className="field-input h-10 w-auto min-w-[14rem] text-sm"
          value={`${period.year}-${period.period}`}
          onChange={(e) => {
            const [y, n] = e.target.value.split("-").map(Number);
            setOpenUser(null);
            setPeriod({ year: y, period: n });
          }}
        >
          {periods.map((p) => (
            <option key={`${p.year}-${p.period}`} value={`${p.year}-${p.period}`}>
              {periodLabel(p.year, p.period)} ({fmtRange(periodRange(p.year, p.period))})
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/huddle">Daily Huddle</Link>
          </Button>
          <Button size="sm" variant="brass" onClick={coachingPreset}>
            Coaching list
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-3.5" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => void copyList()}>
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      </div>

      {stores.length > 0 && <StoreStrip stores={stores} />}

      {/* Filters */}
      <div className="mt-4 rounded-lg border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
              Name
            </span>
            <span className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-4 text-muted" />
              <input
                className="field-input h-10 pl-8 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search people…"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
              Store
            </span>
            <select
              className="field-input h-10 text-sm"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">All stores</option>
              {(board?.stores ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
              Region
            </span>
            <select
              className="field-input h-10 text-sm"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <option value="">All regions</option>
              {(board?.regions ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
              Metric
            </span>
            <select
              className="field-input h-10 text-sm"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as MetricKey | "")}
            >
              <option value="">All metrics</option>
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Color</span>
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleColor(c)}
              aria-pressed={colors.has(c)}
              className={cn(
                "metric-band cursor-pointer transition-opacity",
                bandClass(c),
                colors.size > 0 && !colors.has(c) ? "opacity-40" : "opacity-100",
              )}
            >
              <span className="metric-dot" aria-hidden />
              {COLOR_LABEL[c]}
            </button>
          ))}
          <label className="ml-2 inline-flex items-center gap-1.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={droppedOnly}
              onChange={(e) => setDroppedOnly(e.target.checked)}
              className="size-4 accent-navy"
            />
            Dropped vs last period
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brass hover:underline"
            >
              <X className="size-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Chip label={`${stats.shown} shown`} />
        <Chip label={`${stats.reds} with a Red`} tone={stats.reds ? "red" : undefined} />
        <Chip label={`${stats.dropped} dropped`} tone={stats.dropped ? "orange" : undefined} />
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-xs uppercase tracking-[0.1em] text-muted">
            Sort
          </label>
          <select
            id="sort"
            className="field-input h-9 w-auto text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="severity">Needs attention</option>
            <option value="name">Name</option>
            <option value="store">Store</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-lg bg-navy/5" />
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-line bg-paper px-6 py-12 text-center">
          <p className="font-display text-xl">No one matches.</p>
          <p className="mt-2 text-sm text-muted">
            {people.length === 0
              ? "No metrics entered for this period yet."
              : "Loosen the filters to see more of the floor."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: dense table */}
          <div className="mt-5 hidden overflow-x-auto rounded-lg border border-line bg-surface shadow-card lg:block">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="sticky left-0 z-10 bg-surface px-4 py-3 font-medium text-muted">
                    Person
                  </th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="px-2 py-3 text-center font-medium text-muted">
                      {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <PersonRow
                    key={p.userId}
                    person={p}
                    period={period}
                    open={openUser === p.userId}
                    onToggle={() => setOpenUser(openUser === p.userId ? null : p.userId)}
                    onSaved={() => void load(period)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card per person */}
          <div className="mt-5 space-y-2.5 lg:hidden">
            {filtered.map((p) => (
              <PersonCard
                key={p.userId}
                person={p}
                period={period}
                open={openUser === p.userId}
                onToggle={() => setOpenUser(openUser === p.userId ? null : p.userId)}
                onSaved={() => void load(period)}
              />
            ))}
          </div>
        </>
      )}

      {/* Heat map */}
      {!loading && people.length > 0 && (
        <HeatMap
          board={board!}
          onCell={(sid, key) => {
            setStoreId(sid);
            setMetricKey(key);
            setColors(new Set());
            setDroppedOnly(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone?: "red" | "orange" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-medium",
        tone === "red"
          ? "band-red"
          : tone === "orange"
            ? "band-orange"
            : "border-line bg-paper-2 text-ink",
      )}
    >
      {label}
    </span>
  );
}

function MetricCell({
  metricKey,
  value,
  prior,
}: {
  metricKey: MetricKey;
  value: number | null;
  prior: number | null;
}) {
  const color = metricColor(metricKey, value);
  const trend = metricTrend(value, prior);
  const dropped = droppedBand(color, metricColor(metricKey, prior));
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 py-1.5">
      <span
        className={cn(
          "metric-band min-w-[3.75rem] justify-center tabular-nums",
          color ? bandClass(color) : "border-line bg-paper text-muted",
        )}
        title={color ? `${COLOR_LABEL[color]}${dropped ? " · dropped vs last period" : ""}` : "Not entered"}
      >
        {formatMetric(metricKey, value)}
      </span>
      {trend && (
        <span
          className={cn(
            "flex items-center text-[0.65rem]",
            trend === "up" ? "text-navy" : trend === "down" ? "text-danger" : "text-muted",
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="size-3" />
          ) : trend === "down" ? (
            <TrendingDown className="size-3" />
          ) : (
            <Minus className="size-3" />
          )}
        </span>
      )}
    </div>
  );
}

function PersonRow({
  person,
  period,
  open,
  onToggle,
  onSaved,
}: {
  person: BoardPerson;
  period: MetricPeriod;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-line/70 transition-colors hover:bg-paper-2/60",
          open && "bg-paper-2/70",
        )}
        onClick={onToggle}
      >
        <th
          scope="row"
          className={cn(
            "sticky left-0 z-10 max-w-[13rem] px-4 py-2.5 text-left font-normal",
            open ? "bg-paper-2" : "bg-surface",
          )}
        >
          <span className="block truncate font-medium text-ink">{person.name}</span>
          <span className="block truncate text-xs text-muted">{person.storeName ?? "—"}</span>
        </th>
        {METRICS.map((m) => (
          <td key={m.key} className="text-center align-middle">
            <MetricCell
              metricKey={m.key}
              value={person.values[m.key]}
              prior={person.prior?.[m.key] ?? null}
            />
          </td>
        ))}
      </tr>
      {open && (
        <tr>
          <td colSpan={METRICS.length + 1} className="border-b border-line bg-paper/60 px-4 py-5">
            <PersonDetail person={person} period={period} onSaved={onSaved} />
          </td>
        </tr>
      )}
    </>
  );
}

function PersonCard({
  person,
  period,
  open,
  onToggle,
  onSaved,
}: {
  person: BoardPerson;
  period: MetricPeriod;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  return (
    <div className={cn("rounded-lg border bg-surface shadow-card", open ? "border-brass/40" : "border-line")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{person.name}</span>
          <span className="block truncate text-xs text-muted">{person.storeName ?? "—"}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        {METRICS.map((m) => (
          <div key={m.key} className="flex flex-col items-center gap-0.5">
            <span className="text-[0.6rem] uppercase tracking-[0.08em] text-muted">{m.short}</span>
            <MetricCell
              metricKey={m.key}
              value={person.values[m.key]}
              prior={person.prior?.[m.key] ?? null}
            />
          </div>
        ))}
      </div>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <PersonDetail person={person} period={period} onSaved={onSaved} />
        </div>
      )}
    </div>
  );
}

function PersonDetail({
  person,
  period,
  onSaved,
}: {
  person: BoardPerson;
  period: MetricPeriod;
  onSaved: () => void;
}) {
  const [points, setPoints] = useState<TrendPoint[] | null>(null);
  const [draft, setDraft] = useState<Record<MetricKey, string>>(() => valuesToDraft(person.values));
  const [note, setNote] = useState(person.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getPersonTrend({ data: { userId: person.userId } })
      .then((r) => {
        if (alive) setPoints(r.points);
      })
      .catch(() => {
        if (alive) setPoints([]);
      });
    return () => {
      alive = false;
    };
  }, [person.userId]);

  async function save() {
    setSaving(true);
    try {
      await savePersonMetrics({
        data: {
          userId: person.userId,
          year: period.year,
          period: period.period,
          note,
          ...draft,
        },
      });
      toast.success(`Saved ${person.name}`);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Trends */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">
          Trend · last {points ? Math.min(points.length, 6) : "…"} periods
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {METRICS.map((m) => {
            const series = (points ?? []).slice(-6).map((pt) => pt.values[m.key]);
            const latest = person.values[m.key];
            const color = metricColor(m.key, latest);
            return (
              <div key={m.key} className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted">{m.short}</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-ink">
                    {color && (
                      <span className="metric-dot" style={{ background: SPARK_COLOR[color] }} aria-hidden />
                    )}
                    {formatMetric(m.key, latest)}
                  </p>
                </div>
                <Sparkline values={series} color={color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit + coaching note */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">
          Edit {periodLabel(period.year, period.period)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {METRICS.map((m) => {
            const parsed = draft[m.key].trim() === "" ? null : Number(draft[m.key]);
            const color = metricColor(m.key, Number.isFinite(parsed) ? parsed : null);
            return (
              <label key={m.key} className="block">
                <span className="mb-1 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted">{m.short}</span>
                  {color && (
                    <span className={cn("metric-band", bandClass(color))}>
                      <span className="metric-dot" aria-hidden />
                      {COLOR_LABEL[color]}
                    </span>
                  )}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  className="field-input h-10 tabular-nums text-sm"
                  value={draft[m.key]}
                  onChange={(e) => setDraft({ ...draft, [m.key]: e.target.value })}
                  placeholder="—"
                />
              </label>
            );
          })}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
            Private coaching note (leadership only)
          </span>
          <textarea
            className="field-input min-h-[4rem] resize-y text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What to work on with this person…"
            maxLength={2000}
            rows={2}
          />
        </label>
        <div className="mt-3">
          <Button size="sm" variant="brass" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
      <MetricSuggestions
        values={person.values}
        heading="Coach on this"
        blurb="Lessons for this person's weakest numbers."
      />
    </div>
  );
}

const SPARK_COLOR: Record<MetricColor, string> = {
  green: "#22c55e",
  blue: "#3b82f6",
  orange: "#f97316",
  red: "#ef4444",
};

function Sparkline({ values, color }: { values: (number | null)[]; color: MetricColor | null }) {
  const pts = values.map((v, i) => ({ i, v })).filter((p) => p.v != null) as { i: number; v: number }[];
  const w = 84;
  const h = 26;
  if (pts.length < 2) {
    return <span className="text-xs text-muted">—</span>;
  }
  const xs = values.length - 1 || 1;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => (i / xs) * (w - 4) + 2;
  const y = (v: number) => h - 3 - ((v - min) / span) * (h - 6);
  const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const stroke = color ? SPARK_COLOR[color] : "#8a6d45";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r={2.2} fill={stroke} />
    </svg>
  );
}

function HeatMap({
  board,
  onCell,
}: {
  board: MetricsBoard;
  onCell: (storeId: string, metric: MetricKey) => void;
}) {
  // stores that actually have people on the board
  const storeIds = new Set(board.people.map((p) => p.storeId).filter(Boolean) as string[]);
  const stores = board.stores.filter((s) => storeIds.has(s.id));
  if (stores.length === 0) return null;

  function dist(storeId: string, key: MetricKey) {
    const counts: Record<MetricColor, number> = { green: 0, blue: 0, orange: 0, red: 0 };
    let total = 0;
    for (const p of board.people) {
      if (p.storeId !== storeId) continue;
      const c = metricColor(key, p.values[key]);
      if (c) {
        counts[c]++;
        total++;
      }
    }
    return { counts, total };
  }

  return (
    <section className="mt-12">
      <p className="kicker">Store heat map</p>
      <span className="rule-brass mt-3" />
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Color mix per store across the six metrics — green (best) to red. Click any cell to filter
        the list to that store and metric.
      </p>
      <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-muted">Store</th>
              {METRICS.map((m) => (
                <th key={m.key} className="px-2 py-3 text-center font-medium text-muted">
                  {m.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-line/70">
                <th scope="row" className="max-w-[12rem] truncate px-4 py-2.5 text-left font-normal text-ink">
                  {s.name}
                </th>
                {METRICS.map((m) => {
                  const { counts, total } = dist(s.id, m.key);
                  return (
                    <td key={m.key} className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => onCell(s.id, m.key)}
                        className="block w-full"
                        title={
                          total
                            ? `${counts.green}G · ${counts.blue}B · ${counts.orange}O · ${counts.red}R`
                            : "No data"
                        }
                      >
                        <HeatBar counts={counts} total={total} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HeatBar({
  counts,
  total,
}: {
  counts: Record<MetricColor, number>;
  total: number;
}) {
  if (!total) {
    return <span className="block h-4 w-full rounded-sm border border-dashed border-line" />;
  }
  const order: MetricColor[] = ["green", "blue", "orange", "red"];
  return (
    <span className="flex h-4 w-full overflow-hidden rounded-sm border border-line">
      {order.map((c) =>
        counts[c] ? (
          <span
            key={c}
            style={{ width: `${(counts[c] / total) * 100}%`, background: SPARK_COLOR[c] }}
            className="h-full"
          />
        ) : null,
      )}
    </span>
  );
}

function StoreStrip({ stores }: { stores: StoreMetricRow[] }) {
  const filled = stores.filter((s) => METRICS.some((m) => s.values[m.key] != null));
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">Stores this period</p>
        <p className="text-xs text-muted">
          {filled.length} of {stores.length} have Tableau or entered numbers
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div key={s.id} className="rounded-md border border-line bg-surface px-3.5 py-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-ink">{s.name}</p>
              {s.source === "tableau" ? (
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-brass">Tableau</span>
              ) : s.updatedAt ? (
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">Manual</span>
              ) : null}
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-xs tabular-nums">
              {METRICS.slice(0, 6).map((m) => {
                const c = metricColor(m.key, s.values[m.key]);
                return (
                  <div key={m.key}>
                    <dt className="text-muted">{m.short}</dt>
                    <dd className={cn("font-medium", c === "red" ? "text-red-800" : "text-ink")}>
                      {formatMetric(m.key, s.values[m.key])}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- helpers ---
function valuesToDraft(v: MetricValues): Record<MetricKey, string> {
  const s = (n: number | null) => (n == null ? "" : String(n));
  return {
    nsnu: s(v.nsnu),
    conversion: s(v.conversion),
    demoRate: s(v.demoRate),
    demoClose: s(v.demoClose),
    archSupports: s(v.archSupports),
    demoTicket: s(v.demoTicket),
  };
}

function fmtRange(r: { start: string; end: string }) {
  const f = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  return `${f(r.start)}–${f(r.end)}`;
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toDelimited(people: BoardPerson[], period: MetricPeriod, sep: string): string {
  const header = [
    "Name",
    "Store",
    "Region",
    "Period",
    ...METRICS.map((m) => m.label),
    ...METRICS.map((m) => `${m.short} band`),
  ];
  const lines = people.map((p) =>
    [
      p.name,
      p.storeName ?? "",
      p.regionName ?? "",
      periodLabel(period.year, period.period),
      ...METRICS.map((m) => (p.values[m.key] == null ? "" : p.values[m.key]!)),
      ...METRICS.map((m) => {
        const c = metricColor(m.key, p.values[m.key]);
        return c ? COLOR_LABEL[c] : "";
      }),
    ]
      .map(csvCell)
      .join(sep),
  );
  return [header.map(csvCell).join(sep), ...lines].join("\n");
}

function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
