import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, errorMessage } from "@/lib/utils";
import {
  METRICS,
  metricColor,
  bandClass,
  tileClass,
  COLOR_LABEL,
  recentPeriods,
  periodLabel,
  periodRange,
  currentPeriod,
  getMyMetrics,
  saveMyMetrics,
  getMyStoreMetrics,
  saveStoreMetrics,
  type MetricKey,
  type MetricPeriod,
  type MetricValues,
} from "@/lib/metrics";

type Draft = Record<MetricKey, string>;

const EMPTY_DRAFT: Draft = {
  nsnu: "",
  conversion: "",
  demoRate: "",
  demoClose: "",
  archSupports: "",
  demoTicket: "",
};

function toDraft(values: MetricValues | undefined | null): Draft {
  if (!values) return { ...EMPTY_DRAFT };
  const s = (v: number | null) => (v == null ? "" : String(v));
  return {
    nsnu: s(values.nsnu),
    conversion: s(values.conversion),
    demoRate: s(values.demoRate),
    demoClose: s(values.demoClose),
    archSupports: s(values.archSupports),
    demoTicket: s(values.demoTicket),
  };
}

function periodKey(p: MetricPeriod) {
  return `${p.year}-${p.period}`;
}

function fmtRange(r: { start: string; end: string }) {
  const f = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  return `${f(r.start)}–${f(r.end)}`;
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Metrics entry for the Locker. Everyone edits their own six numbers for a
 * period; managers additionally get a store-metrics block for their store.
 * Colors update live from the exact thresholds as you type.
 */
export function MetricsPanel() {
  const periods = useMemo(() => recentPeriods(8), []);
  const [period, setPeriod] = useState<MetricPeriod>(() => currentPeriod());
  const [myDraft, setMyDraft] = useState<Draft>(EMPTY_DRAFT);
  const [myUpdatedAt, setMyUpdatedAt] = useState<string | null>(null);
  const [store, setStore] = useState<{ id: string; name: string } | null>(null);
  const [storeDraft, setStoreDraft] = useState<Draft>(EMPTY_DRAFT);
  const [storeUpdatedAt, setStoreUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMine, setSavingMine] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  const load = useCallback(async (p: MetricPeriod) => {
    setLoading(true);
    try {
      const [mine, storeRes] = await Promise.all([
        getMyMetrics({ data: { year: p.year, period: p.period } }),
        getMyStoreMetrics({ data: { year: p.year, period: p.period } }).catch(() => null),
      ]);
      setMyDraft(toDraft(mine.record.values));
      setMyUpdatedAt(mine.record.updatedAt);
      if (storeRes?.store) {
        setStore(storeRes.store);
        setStoreDraft(toDraft(storeRes.record?.values));
        setStoreUpdatedAt(storeRes.record?.updatedAt ?? null);
      } else {
        setStore(null);
        setStoreDraft(EMPTY_DRAFT);
        setStoreUpdatedAt(null);
      }
    } catch (err) {
      toast.error(errorMessage(err) || "Could not load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  async function handleSaveMine() {
    setSavingMine(true);
    try {
      await saveMyMetrics({ data: { year: period.year, period: period.period, ...myDraft } });
      toast.success("Your metrics saved");
      await load(period);
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save your metrics");
    } finally {
      setSavingMine(false);
    }
  }

  async function handleSaveStore() {
    if (!store) return;
    setSavingStore(true);
    try {
      await saveStoreMetrics({
        data: { storeId: store.id, year: period.year, period: period.period, ...storeDraft },
      });
      toast.success(`${store.name} metrics saved`);
      await load(period);
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save store metrics");
    } finally {
      setSavingStore(false);
    }
  }

  return (
    <section>
      <p className="kicker">My metrics</p>
      <span className="rule-brass mt-3" />
      <p className="mt-3 max-w-xl text-sm text-muted">
        Your six numbers for the period. Colors grade each one automatically against the
        performance thresholds as you type.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <label htmlFor="metrics-period" className="text-sm font-medium text-ink">
          Period
        </label>
        <select
          id="metrics-period"
          className="field-input h-10 w-auto min-w-[14rem] text-sm"
          value={periodKey(period)}
          onChange={(e) => {
            const [y, n] = e.target.value.split("-").map(Number);
            setPeriod({ year: y, period: n });
          }}
        >
          {periods.map((p) => (
            <option key={periodKey(p)} value={periodKey(p)}>
              {periodLabel(p.year, p.period)} ({fmtRange(periodRange(p.year, p.period))})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-5 h-44 animate-pulse rounded-lg bg-navy/5" />
      ) : (
        <>
          <MetricGrid draft={myDraft} onChange={setMyDraft} idPrefix="me" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="brass" onClick={() => void handleSaveMine()} disabled={savingMine}>
              {savingMine ? "Saving…" : "Save my metrics"}
            </Button>
            {myUpdatedAt && <span className="text-xs text-muted">Updated {fmtWhen(myUpdatedAt)}</span>}
          </div>

          {store && (
            <div className="mt-10">
              <p className="kicker">Store metrics · {store.name}</p>
              <span className="rule-brass mt-3" />
              <p className="mt-3 max-w-xl text-sm text-muted">
                Store-level numbers for this period. Visible to leadership above you.
              </p>
              <MetricGrid draft={storeDraft} onChange={setStoreDraft} idPrefix="store" />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="brass"
                  onClick={() => void handleSaveStore()}
                  disabled={savingStore}
                >
                  {savingStore ? "Saving…" : "Save store metrics"}
                </Button>
                {storeUpdatedAt && (
                  <span className="text-xs text-muted">Updated {fmtWhen(storeUpdatedAt)}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MetricGrid({
  draft,
  onChange,
  idPrefix,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  idPrefix: string;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {METRICS.map((m) => (
        <MetricField
          key={m.key}
          metricKey={m.key}
          id={`${idPrefix}-${m.key}`}
          value={draft[m.key]}
          onChange={(v) => onChange({ ...draft, [m.key]: v })}
        />
      ))}
    </div>
  );
}

function MetricField({
  metricKey,
  id,
  value,
  onChange,
}: {
  metricKey: MetricKey;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const meta = METRICS.find((m) => m.key === metricKey)!;
  const parsed = value.trim() === "" ? null : Number(value);
  const num = parsed != null && Number.isFinite(parsed) ? parsed : null;
  const color = metricColor(metricKey, num);
  return (
    <div className={cn("rounded-md border border-line bg-surface px-3.5 py-3 shadow-card", tileClass(color))}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {meta.label}
        </label>
        {color ? (
          <span className={cn("metric-band", bandClass(color))}>
            <span className="metric-dot" aria-hidden />
            {COLOR_LABEL[color]}
          </span>
        ) : (
          <span className="text-xs text-muted">Not entered</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {meta.kind === "money" && <span className="text-sm text-muted">$</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          className="field-input h-10 tabular-nums text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
        />
        {meta.kind === "percent" && <span className="text-sm text-muted">%</span>}
      </div>
    </div>
  );
}
