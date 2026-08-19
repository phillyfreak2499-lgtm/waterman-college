import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  accessLabel,
  allowedTabs,
  ensureProfileTable,
  fetchPeople,
  isLeader,
  readAccessRole,
  visiblePeople,
  type AccessRole,
} from "@/lib/access";
import { readCatalog } from "@/lib/cms";
import { getSql } from "@/lib/db";
import { overallStats } from "@/lib/progress-stats";
import type { ProgressRow } from "@/lib/progress";

export type RiskLevel = "ok" | "watch" | "risk";

export type PersonHealth = {
  id: string;
  name: string;
  role: AccessRole;
  roleLabel: string;
  store: string | null;
  done: number;
  total: number;
  pct: number;
  overdueCount: number;
  assignmentCount: number;
  isNewHire: boolean;
  risk: RiskLevel;
  riskReasons: string[];
  lastActivity: string | null;
};

export type StoreHealth = {
  store: string;
  staffCount: number;
  activeCount: number;
  newHireCount: number;
  pathPct: number;
  overdueCount: number;
  velocityLessons7d: number;
  risk: RiskLevel;
  riskFlags: string[];
  people: PersonHealth[];
};

export type HealthSnapshot = {
  viewerId: string;
  viewerRole: AccessRole;
  generatedAt: string;
  stores: StoreHealth[];
  unassigned: PersonHealth[];
  totals: {
    staff: number;
    overdue: number;
    newHires: number;
    avgPct: number;
    atRiskStores: number;
  };
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return "";
}

function progressFrom(
  rows: {
    lesson_key: string;
    started_at: unknown;
    last_viewed_at: unknown;
    completed_at: unknown;
  }[],
): ProgressRow[] {
  return rows.map((r) => ({
    lessonKey: r.lesson_key,
    startedAt: iso(r.started_at) || new Date().toISOString(),
    lastViewedAt: iso(r.last_viewed_at) || new Date().toISOString(),
    completedAt: r.completed_at == null ? null : iso(r.completed_at) || null,
  }));
}

function daysUntil(dueOn: string | null): number | null {
  if (!dueOn) return null;
  const trimmed = dueOn.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function personRisk(p: {
  pct: number;
  overdueCount: number;
  isNewHire: boolean;
  total: number;
}): { risk: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  if (p.overdueCount > 0) {
    reasons.push(
      `${p.overdueCount} overdue assignment${p.overdueCount === 1 ? "" : "s"}`,
    );
  }
  if (p.isNewHire && p.pct < 40 && p.total > 0) {
    reasons.push("New-hire ramp under 40%");
  }
  if (!p.isNewHire && p.pct < 25 && p.total > 0) {
    reasons.push("Path completion under 25%");
  }
  if (p.total === 0) reasons.push("No path progress yet");

  if (p.overdueCount >= 2 || (p.isNewHire && p.pct < 25)) {
    return { risk: "risk", reasons };
  }
  if (reasons.length > 0) return { risk: "watch", reasons };
  return { risk: "ok", reasons: [] };
}

function storeRiskLevel(s: {
  overdueCount: number;
  avgPct: number;
  people: PersonHealth[];
}): { risk: RiskLevel; flags: string[] } {
  const flags: string[] = [];
  const atRiskPeople = s.people.filter((p) => p.risk === "risk").length;
  if (s.overdueCount > 0) flags.push(`${s.overdueCount} overdue`);
  if (s.avgPct < 40 && s.people.length > 0) {
    flags.push(`Avg path ${Math.round(s.avgPct)}%`);
  }
  if (atRiskPeople > 0) {
    flags.push(`${atRiskPeople} person${atRiskPeople === 1 ? "" : "s"} at risk`);
  }
  const laggingNewHires = s.people.filter((p) => p.isNewHire && p.pct < 40).length;
  if (laggingNewHires > 0) {
    flags.push(`${laggingNewHires} new-hire ramp lag`);
  }

  if (
    s.overdueCount >= 3 ||
    atRiskPeople >= 2 ||
    (s.avgPct < 30 && s.people.length >= 2)
  ) {
    return { risk: "risk", flags };
  }
  if (flags.length > 0) return { risk: "watch", flags };
  return { risk: "ok", flags: [] };
}

/** Leadership-only store training health aggregates. */
export const listStoreHealth = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HealthSnapshot> => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") {
      throw new Error("Only managers and leadership can view store health.");
    }

    await ensureProfileTable();
    const all = await fetchPeople();
    const visible = visiblePeople(context.userId, actor, all).filter(
      (p) => p.id !== context.userId,
    );
    const catalog = await readCatalog();
    const idSet = new Set(visible.map((p) => p.id));
    const sql = await getSql();

    const progressAll = visible.length
      ? await sql<{
          user_id: string;
          lesson_key: string;
          started_at: unknown;
          last_viewed_at: unknown;
          completed_at: unknown;
        }>`
          select user_id, lesson_key, started_at, last_viewed_at, completed_at
          from lesson_progress
          where user_id = any(${[...idSet]}::text[])
          limit 30000
        `
      : [];

    const assignAll = visible.length
      ? await sql<{
          id: string;
          user_id: string;
          track_id: string;
          due_on: string | null;
        }>`
          select id, user_id, track_id, due_on
          from training_assignments
          where user_id = any(${[...idSet]}::text[])
          limit 8000
        `
      : [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenIso = sevenDaysAgo.toISOString();

    const people: PersonHealth[] = [];
    for (const person of visible) {
      const rows = progressFrom(progressAll.filter((r) => r.user_id === person.id));
      const personAssigns = assignAll.filter((a) => a.user_id === person.id);
      const assignedIds = new Set(personAssigns.map((a) => a.track_id));
      const tabs = allowedTabs(person.role);
      const allowed = catalog.tracks.filter(
        (t) => tabs.includes(t.role) || assignedIds.has(t.id),
      );
      const stats = overallStats(rows, allowed);
      const overdueCount = personAssigns.filter((a) => {
        const d = daysUntil(a.due_on);
        return d !== null && d < 0;
      }).length;
      const isNewHire = person.role === "new-hires";
      const lastActivity =
        rows.length > 0
          ? rows.reduce(
              (latest, r) => (r.lastViewedAt > latest ? r.lastViewedAt : latest),
              rows[0].lastViewedAt,
            )
          : null;
      const { risk, reasons } = personRisk({
        pct: stats.pct,
        overdueCount,
        isNewHire,
        total: stats.total,
      });
      people.push({
        id: person.id,
        name: person.name,
        role: person.role,
        roleLabel: accessLabel(person.role),
        store: person.store,
        done: stats.done,
        total: stats.total,
        pct: Math.round(stats.pct),
        overdueCount,
        assignmentCount: personAssigns.length,
        isNewHire,
        risk,
        riskReasons: reasons,
        lastActivity,
      });
    }

    const completions7d = new Map<string, number>();
    for (const r of progressAll) {
      if (!r.completed_at) continue;
      const completedIso = iso(r.completed_at);
      if (completedIso < sevenIso) continue;
      const person = people.find((p) => p.id === r.user_id);
      const storeKey = person?.store?.trim() || "__unassigned__";
      completions7d.set(storeKey, (completions7d.get(storeKey) || 0) + 1);
    }

    const byStore = new Map<string, PersonHealth[]>();
    const unassigned: PersonHealth[] = [];
    for (const p of people) {
      const key = p.store?.trim();
      if (!key) {
        unassigned.push(p);
        continue;
      }
      const list = byStore.get(key) || [];
      list.push(p);
      byStore.set(key, list);
    }

    const stores: StoreHealth[] = [...byStore.entries()]
      .map(([store, members]) => {
        const staffCount = members.length;
        const activeCount = members.filter((m) => m.total > 0 && m.done > 0).length;
        const newHireCount = members.filter((m) => m.isNewHire).length;
        const overdueCount = members.reduce((n, m) => n + m.overdueCount, 0);
        const avgPct =
          members.length > 0
            ? members.reduce((n, m) => n + m.pct, 0) / members.length
            : 0;
        const pathPct = Math.round(avgPct);
        const velocityLessons7d = completions7d.get(store) || 0;
        const { risk, flags } = storeRiskLevel({
          overdueCount,
          avgPct,
          people: members,
        });
        return {
          store,
          staffCount,
          activeCount,
          newHireCount,
          pathPct,
          overdueCount,
          velocityLessons7d,
          risk,
          riskFlags: flags,
          people: members.sort((a, b) => {
            const order = { risk: 0, watch: 1, ok: 2 } as const;
            return order[a.risk] - order[b.risk] || a.name.localeCompare(b.name);
          }),
        };
      })
      .sort((a, b) => {
        const order = { risk: 0, watch: 1, ok: 2 } as const;
        return order[a.risk] - order[b.risk] || a.store.localeCompare(b.store);
      });

    const totalStaff = people.length;
    const totalOverdue = people.reduce((n, p) => n + p.overdueCount, 0);
    const totalNewHires = people.filter((p) => p.isNewHire).length;
    const avgPct =
      totalStaff > 0
        ? Math.round(people.reduce((n, p) => n + p.pct, 0) / totalStaff)
        : 0;
    const atRiskStores = stores.filter((s) => s.risk === "risk").length;

    return {
      viewerId: context.userId,
      viewerRole: actor,
      generatedAt: new Date().toISOString(),
      stores,
      unassigned: unassigned.sort((a, b) => a.name.localeCompare(b.name)),
      totals: {
        staff: totalStaff,
        overdue: totalOverdue,
        newHires: totalNewHires,
        avgPct,
        atRiskStores,
      },
    };
  });
