import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isLeader, readAccessRole, roleRank, type AccessRole } from "@/lib/access";
import { getSql } from "@/lib/db";
import { currentPeriod, type MetricPeriod, type MetricValues } from "@/lib/metrics";
import { matchSyncRows, parseMetricsPaste, type SyncMatch } from "@/lib/metrics-sync-parse";

export type { ParsedMetricRow, SyncMatch } from "@/lib/metrics-sync-parse";
export { classifyHeader, matchSyncRows, normName, parseMetricsPaste, parseNumberCell } from "@/lib/metrics-sync-parse";

export type SyncSource = "tableau" | "sheet" | "manual";

function cleanPeriod(input: { year?: unknown; period?: unknown } | undefined): MetricPeriod {
  if (input?.year == null || input?.period == null) return currentPeriod();
  const year = Number(input.year);
  const period = Number(input.period);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Invalid year.");
  if (!Number.isInteger(period) || period < 1 || period > 13) throw new Error("Invalid period.");
  return { year, period };
}

function assertSyncRole(role: AccessRole) {
  if (roleRank(role) < 3) {
    throw new Error("Regional and above can update metrics from Tableau.");
  }
}

async function loadMatchTargets() {
  const sql = await getSql();
  const stores = await sql<{ id: string; name: string }>`
    select id, name from stores order by sort_order asc, name asc
  `;
  const people = await sql<{ id: string; name: string; email: string | null }>`
    select u.id, coalesce(u.name, '') as name, u.email
    from "user" u
    join user_profiles p on p.user_id = u.id
    where p.store_id is not null
  `;
  return { stores, people };
}

export type SyncPreview = {
  period: MetricPeriod;
  guessedPeriod: number | null;
  warnings: string[];
  matches: SyncMatch[];
  matched: number;
  skipped: number;
};

export const previewTableauSync = createServerFn({ method: "POST" })
  .validator((input: { text?: string; year?: number; period?: number }) => ({
    text: String(input?.text ?? "").slice(0, 200_000),
    period: cleanPeriod(input),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<SyncPreview> => {
    assertSyncRole(await readAccessRole(context.userId));
    const parsed = parseMetricsPaste(data.text);
    const { stores, people } = await loadMatchTargets();
    const matches = matchSyncRows(parsed.rows, stores, people);
    return {
      period: data.period,
      guessedPeriod: parsed.guessedPeriod,
      warnings: parsed.warnings,
      matches,
      matched: matches.filter((m) => m.subjectType !== "skip").length,
      skipped: matches.filter((m) => m.subjectType === "skip").length,
    };
  });

export const commitTableauSync = createServerFn({ method: "POST" })
  .validator((input: { text?: string; year?: number; period?: number }) => ({
    text: String(input?.text ?? "").slice(0, 200_000),
    period: cleanPeriod(input),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    assertSyncRole(await readAccessRole(context.userId));
    const parsed = parseMetricsPaste(data.text);
    const { stores, people } = await loadMatchTargets();
    const matches = matchSyncRows(parsed.rows, stores, people);
    const keep = matches.filter((m) => m.subjectType !== "skip" && m.subjectId);
    const sql = await getSql();
    for (const m of keep) {
      const id = `${m.subjectType}:${m.subjectId}:${data.period.year}:${data.period.period}`;
      const v = m.values;
      await sql`
        insert into performance_metrics (
          id, subject_type, subject_id, fiscal_year, period_number,
          nsnu, conversion, demo_rate, demo_close, arch_supports, demo_ticket,
          note, updated_by, updated_at, created_at, source, synced_at
        ) values (
          ${id}, ${m.subjectType}, ${m.subjectId}, ${data.period.year}, ${data.period.period},
          ${v.nsnu}, ${v.conversion}, ${v.demoRate}, ${v.demoClose},
          ${v.archSupports}, ${v.demoTicket},
          null, ${context.userId}, now(), now(), 'tableau', now()
        )
        on conflict (subject_type, subject_id, fiscal_year, period_number) do update set
          nsnu = coalesce(excluded.nsnu, performance_metrics.nsnu),
          conversion = coalesce(excluded.conversion, performance_metrics.conversion),
          demo_rate = coalesce(excluded.demo_rate, performance_metrics.demo_rate),
          demo_close = coalesce(excluded.demo_close, performance_metrics.demo_close),
          arch_supports = coalesce(excluded.arch_supports, performance_metrics.arch_supports),
          demo_ticket = coalesce(excluded.demo_ticket, performance_metrics.demo_ticket),
          updated_by = excluded.updated_by,
          updated_at = now(),
          source = 'tableau',
          synced_at = now()
      `;
    }
    const logId = `sync:${data.period.year}:${data.period.period}:${Date.now()}`;
    await sql`
      insert into metrics_sync_log (id, fiscal_year, period_number, source, matched, skipped, created_by, created_at)
      values (${logId}, ${data.period.year}, ${data.period.period}, 'tableau', ${keep.length}, ${matches.length - keep.length}, ${context.userId}, now())
    `;
    return { ok: true, matched: keep.length, skipped: matches.length - keep.length, period: data.period };
  });

export type StoreMetricRow = {
  id: string;
  name: string;
  regionId: string | null;
  values: MetricValues;
  source: SyncSource;
  syncedAt: string | null;
  updatedAt: string | null;
};

export const loadStoreMetricsBoard = createServerFn({ method: "POST" })
  .validator((input: { year?: number; period?: number } | undefined) => cleanPeriod(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data: period }): Promise<{ period: MetricPeriod; stores: StoreMetricRow[] }> => {
    const role = await readAccessRole(context.userId);
    if (!isLeader(role)) throw new Error("Managers and above only.");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      region_id: string | null;
      nsnu: unknown;
      conversion: unknown;
      demo_rate: unknown;
      demo_close: unknown;
      arch_supports: unknown;
      demo_ticket: unknown;
      source: string | null;
      synced_at: unknown;
      updated_at: unknown;
    }>`
      select s.id, s.name, s.region_id,
        m.nsnu, m.conversion, m.demo_rate, m.demo_close, m.arch_supports, m.demo_ticket,
        m.source, m.synced_at, m.updated_at
      from stores s
      left join performance_metrics m
        on m.subject_type = 'store' and m.subject_id = s.id
        and m.fiscal_year = ${period.year} and m.period_number = ${period.period}
      order by s.sort_order asc, s.name asc
    `;
    const n = (v: unknown) => {
      if (v == null) return null;
      const x = Number(v);
      return Number.isFinite(x) ? x : null;
    };
    const iso = (v: unknown) =>
      v instanceof Date ? v.toISOString() : v ? String(v) : null;
    return {
      period,
      stores: rows.map((r) => ({
        id: r.id,
        name: r.name,
        regionId: r.region_id,
        values: {
          nsnu: n(r.nsnu),
          conversion: n(r.conversion),
          demoRate: n(r.demo_rate),
          demoClose: n(r.demo_close),
          archSupports: n(r.arch_supports),
          demoTicket: n(r.demo_ticket),
        },
        source: r.source === "tableau" || r.source === "sheet" ? r.source : "manual",
        syncedAt: iso(r.synced_at),
        updatedAt: iso(r.updated_at),
      })),
    };
  });

