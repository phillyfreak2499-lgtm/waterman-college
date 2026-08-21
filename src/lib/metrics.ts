import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isLeader, readAccessRole } from "@/lib/access";
import { getSql } from "@/lib/db";

export type MetricKey =
  | "nsnu"
  | "conversion"
  | "demoRate"
  | "demoClose"
  | "archSupports"
  | "demoTicket";

export type MetricColor = "green" | "blue" | "orange" | "red";
export type MetricValues = Record<MetricKey, number | null>;
export type MetricPeriod = { year: number; period: number };
export type MetricRecord = {
  year: number;
  period: number;
  values: MetricValues;
  note: string | null;
  updatedAt: string | null;
};

/** Column order = display order. thresholds are [green≥, blue≥, orange≥]; below = red. */
export const METRICS: {
  key: MetricKey;
  label: string;
  short: string;
  kind: "money" | "percent" | "number";
  thresholds: [number, number, number];
}[] = [
  { key: "nsnu", label: "NSNU", short: "NSNU", kind: "money", thresholds: [1000, 900, 800] },
  { key: "conversion", label: "Conversion %", short: "Conv %", kind: "percent", thresholds: [64, 56, 47] },
  { key: "demoRate", label: "Demo Rate", short: "Demo Rate", kind: "percent", thresholds: [88, 80, 72] },
  { key: "demoClose", label: "Demo Close %", short: "Demo Close", kind: "percent", thresholds: [73, 70, 65] },
  { key: "archSupports", label: "Arch Supports", short: "Arch Sup.", kind: "number", thresholds: [3.8, 3.0, 2.5] },
  { key: "demoTicket", label: "Demo Ticket Avg", short: "Ticket", kind: "money", thresholds: [1800, 1600, 1400] },
];

const THRESHOLDS = Object.fromEntries(METRICS.map((m) => [m.key, m.thresholds])) as Record<
  MetricKey,
  [number, number, number]
>;
export const METRIC_KEYS = METRICS.map((m) => m.key);

/** The exact color band for a metric value (null when not entered). */
export function metricColor(key: MetricKey, value: number | null | undefined): MetricColor | null {
  if (value == null || !Number.isFinite(value)) return null;
  const [green, blue, orange] = THRESHOLDS[key] ?? [0, 0, 0];
  if (value >= green) return "green";
  if (value >= blue) return "blue";
  if (value >= orange) return "orange";
  return "red";
}

export const COLOR_LABEL: Record<MetricColor, string> = {
  green: "Green",
  blue: "Blue",
  orange: "Orange",
  red: "Red",
};

/** Severity for sorting a coaching list (red = most urgent). */
export const COLOR_SEVERITY: Record<MetricColor, number> = { red: 3, orange: 2, blue: 1, green: 0 };

/** Sort weight so a single red outranks any number of oranges. */
const SORT_WEIGHT: Record<MetricColor, number> = { red: 1000, orange: 100, blue: 1, green: 0 };

/** Direction of a metric vs its prior period. */
export function metricTrend(cur: number | null, prior: number | null): "up" | "down" | "flat" | null {
  if (cur == null || prior == null) return null;
  if (cur > prior) return "up";
  if (cur < prior) return "down";
  return "flat";
}

/** True when a metric slipped from a good band (green/blue) to a weak one (orange/red). */
export function droppedBand(cur: MetricColor | null, prior: MetricColor | null): boolean {
  if (!cur || !prior) return false;
  const good = (c: MetricColor) => c === "green" || c === "blue";
  const weak = (c: MetricColor) => c === "orange" || c === "red";
  return good(prior) && weak(cur);
}

/** Worst-first weight across all six metrics (higher = needs attention). */
export function rowSeverity(values: MetricValues): number {
  let s = 0;
  for (const m of METRICS) {
    const c = metricColor(m.key, values[m.key]);
    if (c) s += SORT_WEIGHT[c];
  }
  return s;
}

/** Stylesheet class for a color band pill (see styles.css). */
export function bandClass(color: MetricColor | null | undefined): string {
  return color ? `band-${color}` : "";
}

/** Stylesheet class for a tile's left accent (see styles.css). */
export function tileClass(color: MetricColor | null | undefined): string {
  return color ? `tile-accent tile-${color}` : "";
}

/** Format a value for display in its unit. */
export function formatMetric(key: MetricKey, value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const kind = METRICS.find((m) => m.key === key)?.kind;
  if (kind === "money") return `$${Math.round(value).toLocaleString()}`;
  if (kind === "percent") return `${Number(value.toFixed(1))}%`;
  return String(Number(value.toFixed(1)));
}

// --- 28-day period calendar (anchored on FY2025 Period 1 = 2024-12-22) ---
const DAY = 86_400_000;
const CYCLE = 364 * DAY; // 13 periods × 28 days
const FY_ANCHOR = Date.UTC(2024, 11, 22);

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function periodForDate(ms: number): MetricPeriod {
  const diff = ms - FY_ANCHOR;
  const cycles = Math.floor(diff / CYCLE);
  const dayInCycle = Math.floor((diff - cycles * CYCLE) / DAY);
  return { year: 2025 + cycles, period: Math.floor(dayInCycle / 28) + 1 };
}

export function currentPeriod(): MetricPeriod {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return periodForDate(Date.parse(`${today}T00:00:00Z`));
}

export function periodRange(year: number, period: number): { start: string; end: string } {
  const startMs = FY_ANCHOR + (year - 2025) * CYCLE + (period - 1) * 28 * DAY;
  return { start: isoDate(startMs), end: isoDate(startMs + 27 * DAY) };
}

export function periodLabel(year: number, period: number): string {
  return `${year} · Period ${period}`;
}

export function priorPeriod(p: MetricPeriod): MetricPeriod {
  return p.period > 1 ? { year: p.year, period: p.period - 1 } : { year: p.year - 1, period: 13 };
}

/** Recent periods, newest first — for the period picker. */
export function recentPeriods(count = 8): MetricPeriod[] {
  const out: MetricPeriod[] = [];
  let p = currentPeriod();
  for (let i = 0; i < count; i++) {
    out.push(p);
    p = priorPeriod(p);
  }
  return out;
}

// --- server helpers ---
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanValues(input: Partial<Record<MetricKey, unknown>> | undefined): MetricValues {
  const clean = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return null;
    return Math.round(n * 100) / 100;
  };
  return {
    nsnu: clean(input?.nsnu),
    conversion: clean(input?.conversion),
    demoRate: clean(input?.demoRate),
    demoClose: clean(input?.demoClose),
    archSupports: clean(input?.archSupports),
    demoTicket: clean(input?.demoTicket),
  };
}

function cleanPeriod(input: { year?: unknown; period?: unknown } | undefined): MetricPeriod {
  if (input?.year == null || input?.period == null) return currentPeriod();
  const year = Number(input.year);
  const period = Number(input.period);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Invalid year.");
  if (!Number.isInteger(period) || period < 1 || period > 13) throw new Error("Invalid period.");
  return { year, period };
}

type MetricRow = {
  nsnu: number | null;
  conversion: number | null;
  demo_rate: number | null;
  demo_close: number | null;
  arch_supports: number | null;
  demo_ticket: number | null;
  note: string | null;
  updated_at: unknown;
};

function toRecord(row: MetricRow | undefined, year: number, period: number): MetricRecord {
  return {
    year,
    period,
    values: {
      nsnu: num(row?.nsnu),
      conversion: num(row?.conversion),
      demoRate: num(row?.demo_rate),
      demoClose: num(row?.demo_close),
      archSupports: num(row?.arch_supports),
      demoTicket: num(row?.demo_ticket),
    },
    note: row?.note ?? null,
    updatedAt:
      row?.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row?.updated_at
          ? String(row.updated_at)
          : null,
  };
}

async function readOne(
  subjectType: "person" | "store",
  subjectId: string,
  year: number,
  period: number,
): Promise<MetricRecord> {
  const sql = await getSql();
  const rows = await sql<MetricRow>`
    select nsnu, conversion, demo_rate, demo_close, arch_supports, demo_ticket, note, updated_at
    from performance_metrics
    where subject_type = ${subjectType} and subject_id = ${subjectId}
      and fiscal_year = ${year} and period_number = ${period}
    limit 1
  `;
  return toRecord(rows[0], year, period);
}

async function writeOne(
  subjectType: "person" | "store",
  subjectId: string,
  period: MetricPeriod,
  values: MetricValues,
  note: string | null,
  updatedBy: string,
) {
  const sql = await getSql();
  const id = `${subjectType}:${subjectId}:${period.year}:${period.period}`;
  await sql`
    insert into performance_metrics (
      id, subject_type, subject_id, fiscal_year, period_number,
      nsnu, conversion, demo_rate, demo_close, arch_supports, demo_ticket,
      note, updated_by, updated_at, created_at
    ) values (
      ${id}, ${subjectType}, ${subjectId}, ${period.year}, ${period.period},
      ${values.nsnu}, ${values.conversion}, ${values.demoRate}, ${values.demoClose},
      ${values.archSupports}, ${values.demoTicket},
      ${note}, ${updatedBy}, now(), now()
    )
    on conflict (subject_type, subject_id, fiscal_year, period_number) do update set
      nsnu = excluded.nsnu,
      conversion = excluded.conversion,
      demo_rate = excluded.demo_rate,
      demo_close = excluded.demo_close,
      arch_supports = excluded.arch_supports,
      demo_ticket = excluded.demo_ticket,
      note = coalesce(excluded.note, performance_metrics.note),
      updated_by = excluded.updated_by,
      updated_at = now()
  `;
}

async function assertManager(userId: string) {
  const role = await readAccessRole(userId);
  if (!isLeader(role)) throw new Error("Managers and above only.");
}

async function storeForUser(userId: string): Promise<{ id: string; name: string } | null> {
  const sql = await getSql();
  const rows = await sql<{ store_id: string | null; name: string | null }>`
    select p.store_id, s.name
    from user_profiles p
    left join stores s on s.id = p.store_id
    where p.user_id = ${userId}
    limit 1
  `;
  const id = rows[0]?.store_id;
  return id ? { id, name: rows[0]?.name ?? id } : null;
}

// --- server functions ---

/** A Specialist's own metrics for a period (default: the current period). */
export const getMyMetrics = createServerFn({ method: "POST" })
  .validator((input: { year?: number; period?: number } | undefined) => cleanPeriod(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: period }) => ({
    period,
    record: await readOne("person", context.userId, period.year, period.period),
  }));

export const saveMyMetrics = createServerFn({ method: "POST" })
  .validator((input: { year?: number; period?: number } & Partial<Record<MetricKey, unknown>>) => ({
    period: cleanPeriod(input),
    values: cleanValues(input),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await writeOne("person", context.userId, data.period, data.values, null, context.userId);
    return { ok: true };
  });

/** Managers+ can read anyone's person metrics. */
export const getPersonMetrics = createServerFn({ method: "POST" })
  .validator((input: { userId: string; year?: number; period?: number }) => {
    if (!input || typeof input.userId !== "string" || !input.userId.trim()) {
      throw new Error("Choose a person.");
    }
    return { userId: input.userId, period: cleanPeriod(input) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertManager(context.userId);
    return {
      period: data.period,
      record: await readOne("person", data.userId, data.period.year, data.period.period),
    };
  });

export const savePersonMetrics = createServerFn({ method: "POST" })
  .validator(
    (input: {
      userId: string;
      year?: number;
      period?: number;
      note?: string;
    } & Partial<Record<MetricKey, unknown>>) => {
      if (!input || typeof input.userId !== "string" || !input.userId.trim()) {
        throw new Error("Choose a person.");
      }
      const note = typeof input.note === "string" ? input.note.slice(0, 2000) : null;
      return { userId: input.userId, period: cleanPeriod(input), values: cleanValues(input), note };
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertManager(context.userId);
    await writeOne("person", data.userId, data.period, data.values, data.note, context.userId);
    return { ok: true };
  });

/** The manager's own store + its metrics (null when they have no store or aren't a manager). */
export const getMyStoreMetrics = createServerFn({ method: "POST" })
  .validator((input: { year?: number; period?: number } | undefined) => cleanPeriod(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: period }) => {
    const role = await readAccessRole(context.userId);
    if (!isLeader(role)) return { store: null, period, record: null };
    const store = await storeForUser(context.userId);
    if (!store) return { store: null, period, record: null };
    return {
      store,
      period,
      record: await readOne("store", store.id, period.year, period.period),
    };
  });

export const saveStoreMetrics = createServerFn({ method: "POST" })
  .validator(
    (input: { storeId: string; year?: number; period?: number } & Partial<Record<MetricKey, unknown>>) => {
      const storeId = typeof input?.storeId === "string" ? input.storeId.trim() : "";
      if (!storeId || storeId.length > 200) throw new Error("Unknown store.");
      return { storeId, period: cleanPeriod(input), values: cleanValues(input) };
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertManager(context.userId);
    await writeOne("store", data.storeId, data.period, data.values, null, context.userId);
    return { ok: true };
  });

// --- manager board (Phase 2/3) ---

export type BoardPerson = {
  userId: string;
  name: string;
  email: string | null;
  role: string | null;
  storeId: string | null;
  storeName: string | null;
  regionId: string | null;
  regionName: string | null;
  values: MetricValues;
  prior: MetricValues | null;
  note: string | null;
  updatedAt: string | null;
};

export type MetricsBoard = {
  period: MetricPeriod;
  prior: MetricPeriod;
  people: BoardPerson[];
  stores: { id: string; name: string; regionId: string | null }[];
  regions: { id: string; name: string }[];
};

export type TrendPoint = { year: number; period: number; values: MetricValues };

type BoardRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  access_role: string | null;
  store_id: string | null;
  store_name: string | null;
  region_id: string | null;
  region_name: string | null;
  c_id: string | null;
  c_nsnu: unknown;
  c_conversion: unknown;
  c_demo_rate: unknown;
  c_demo_close: unknown;
  c_arch_supports: unknown;
  c_demo_ticket: unknown;
  c_note: string | null;
  c_updated: unknown;
  p_id: string | null;
  p_nsnu: unknown;
  p_conversion: unknown;
  p_demo_rate: unknown;
  p_demo_close: unknown;
  p_arch_supports: unknown;
  p_demo_ticket: unknown;
};

/** Everyone's current + prior metrics for a period, plus store/region lists. Managers+ only. */
export const loadMetricsBoard = createServerFn({ method: "POST" })
  .validator((input: { year?: number; period?: number } | undefined) => cleanPeriod(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: period }): Promise<MetricsBoard> => {
    await assertManager(context.userId);
    const prior = priorPeriod(period);
    const sql = await getSql();
    const rows = await sql<BoardRow>`
      select
        u.id as user_id, u.name, u.email,
        p.access_role, p.store_id,
        coalesce(s.name, p.store) as store_name,
        s.region_id, r.name as region_name,
        cur.id as c_id, cur.nsnu as c_nsnu, cur.conversion as c_conversion, cur.demo_rate as c_demo_rate,
        cur.demo_close as c_demo_close, cur.arch_supports as c_arch_supports, cur.demo_ticket as c_demo_ticket,
        cur.note as c_note, cur.updated_at as c_updated,
        pri.id as p_id, pri.nsnu as p_nsnu, pri.conversion as p_conversion, pri.demo_rate as p_demo_rate,
        pri.demo_close as p_demo_close, pri.arch_supports as p_arch_supports, pri.demo_ticket as p_demo_ticket
      from "user" u
      join user_profiles p on p.user_id = u.id
      left join stores s on s.id = p.store_id
      left join regions r on r.id = s.region_id
      left join performance_metrics cur on cur.subject_type = 'person' and cur.subject_id = u.id
        and cur.fiscal_year = ${period.year} and cur.period_number = ${period.period}
      left join performance_metrics pri on pri.subject_type = 'person' and pri.subject_id = u.id
        and pri.fiscal_year = ${prior.year} and pri.period_number = ${prior.period}
      where p.store_id is not null
      order by coalesce(s.sort_order, 999) asc, u.name asc
      limit 1000
    `;
    const stores = await sql<{ id: string; name: string; region_id: string | null }>`
      select id, name, region_id from stores order by sort_order asc, name asc
    `;
    const regions = await sql<{ id: string; name: string }>`
      select id, name from regions order by sort_order asc, name asc
    `;
    const people: BoardPerson[] = rows.map((row) => ({
      userId: row.user_id,
      name: row.name ?? "—",
      email: row.email ?? null,
      role: row.access_role ?? null,
      storeId: row.store_id ?? null,
      storeName: row.store_name ?? null,
      regionId: row.region_id ?? null,
      regionName: row.region_name ?? null,
      values: {
        nsnu: num(row.c_nsnu),
        conversion: num(row.c_conversion),
        demoRate: num(row.c_demo_rate),
        demoClose: num(row.c_demo_close),
        archSupports: num(row.c_arch_supports),
        demoTicket: num(row.c_demo_ticket),
      },
      prior:
        row.p_id == null
          ? null
          : {
              nsnu: num(row.p_nsnu),
              conversion: num(row.p_conversion),
              demoRate: num(row.p_demo_rate),
              demoClose: num(row.p_demo_close),
              archSupports: num(row.p_arch_supports),
              demoTicket: num(row.p_demo_ticket),
            },
      note: row.c_note ?? null,
      updatedAt:
        row.c_updated instanceof Date
          ? row.c_updated.toISOString()
          : row.c_updated
            ? String(row.c_updated)
            : null,
    }));
    return {
      period,
      prior,
      people,
      stores: stores.map((s) => ({ id: s.id, name: s.name, regionId: s.region_id ?? null })),
      regions: regions.map((r) => ({ id: r.id, name: r.name })),
    };
  });

/** A person's full metric history, oldest first, for sparklines. Managers+ only. */
export const getPersonTrend = createServerFn({ method: "POST" })
  .validator((input: { userId: string }) => {
    if (!input || typeof input.userId !== "string" || !input.userId.trim()) {
      throw new Error("Choose a person.");
    }
    return { userId: input.userId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ points: TrendPoint[] }> => {
    await assertManager(context.userId);
    const sql = await getSql();
    const rows = await sql<
      MetricRow & { fiscal_year: unknown; period_number: unknown }
    >`
      select fiscal_year, period_number, nsnu, conversion, demo_rate, demo_close,
             arch_supports, demo_ticket, note, updated_at
      from performance_metrics
      where subject_type = 'person' and subject_id = ${data.userId}
      order by fiscal_year asc, period_number asc
      limit 60
    `;
    const points: TrendPoint[] = rows.map((r) => ({
      year: Number(r.fiscal_year),
      period: Number(r.period_number),
      values: {
        nsnu: num(r.nsnu),
        conversion: num(r.conversion),
        demoRate: num(r.demo_rate),
        demoClose: num(r.demo_close),
        archSupports: num(r.arch_supports),
        demoTicket: num(r.demo_ticket),
      },
    }));
    return { points };
  });
