import { assertClean } from "@/lib/clean-language";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  accessLabel,
  allowedTabs,
  assertCanViewPerson,
  ensureProfileTable,
  fetchPeople,
  isLeader,
  isOrgWide,
  readAccessRole,
  visiblePeople,
  type AccessRole,
} from "@/lib/access";
import { readCatalog } from "@/lib/cms";
import { getSql } from "@/lib/db";
import { continueLesson, overallStats, type ContinueTarget } from "@/lib/progress-stats";
import type { ProgressRow } from "@/lib/progress";

export type Assignment = {
  id: string;
  userId: string;
  trackId: string;
  trackTitle: string;
  assignedBy: string;
  assignedByName: string;
  note: string;
  dueOn: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  roleLabel: string;
  store: string | null;
  reportsTo: string | null;
  reportsToName: string | null;
  /** Regular days off, free text from the directory; empty when unset. */
  daysOff: string;
  done: number;
  total: number;
  pct: number;
  next: ContinueTarget | null;
  assignments: Assignment[];
};

export type TeamSnapshot = {
  viewerId: string;
  viewerRole: AccessRole;
  title: string;
  people: TeamMember[];
  tracks: { id: string; title: string; role: string; lessons: number }[];
};

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return "";
}

function progressFrom(
  rows: { lesson_key: string; started_at: unknown; last_viewed_at: unknown; completed_at: unknown }[],
): ProgressRow[] {
  return rows.map((r) => ({
    lessonKey: r.lesson_key,
    startedAt: iso(r.started_at) || new Date().toISOString(),
    lastViewedAt: iso(r.last_viewed_at) || new Date().toISOString(),
    completedAt: r.completed_at == null ? null : iso(r.completed_at) || null,
  }));
}

function teamTitle(role: AccessRole) {
  if (role === "managers") return "Your store";
  if (role === "regional") return "Your region";
  if (role === "trainer") return "The college";
  if (role === "sales-manager") return "Sales";
  if (role === "ceo") return "The company";
  return "Everyone";
}

async function buildTeam(actorId: string, actorRole: AccessRole): Promise<TeamSnapshot> {
  await ensureProfileTable();
  const all = await fetchPeople();
  const visible = visiblePeople(actorId, actorRole, all).filter((p) => p.id !== actorId);
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
    limit 20000
  `
    : [];
  const assignAll = visible.length
    ? await sql<{
    id: string;
    user_id: string;
    track_id: string;
    assigned_by: string;
    note: string | null;
    due_on: string | null;
    created_at: unknown;
  }>`
    select id, user_id, track_id, assigned_by, note, due_on, created_at
    from training_assignments
    where user_id = any(${[...idSet]}::text[])
    order by created_at desc
    limit 5000
  `
    : [];

  const offRows = visible.length
    ? await sql<{ user_id: string; days_off: string | null }>`
        select user_id, days_off from user_profiles
        where user_id = any(${[...idSet]}::text[])
      `
    : [];
  const daysOffById = new Map(offRows.map((r) => [r.user_id, (r.days_off ?? "").trim()]));

  const names = new Map(all.map((p) => [p.id, p.name]));
  const titles = new Map(catalog.tracks.map((t) => [t.id, t.title]));
  const assignments: Assignment[] = assignAll
    .filter((row) => idSet.has(row.user_id))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      trackId: row.track_id,
      trackTitle: titles.get(row.track_id) ?? row.track_id,
      assignedBy: row.assigned_by,
      assignedByName: names.get(row.assigned_by) ?? "Training office",
      note: row.note ?? "",
      dueOn: row.due_on ?? "",
      createdAt: iso(row.created_at),
    }));

  const people: TeamMember[] = visible.map((person) => {
    const rows = progressFrom(progressAll.filter((r) => r.user_id === person.id));
    const assignedIds = new Set(
      assignments.filter((a) => a.userId === person.id).map((a) => a.trackId),
    );
    const tabs = allowedTabs(person.role);
    const allowed = catalog.tracks.filter((t) => tabs.includes(t.role) || assignedIds.has(t.id));
    const stats = overallStats(rows, allowed);
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      roleLabel: accessLabel(person.role),
      store: person.store,
      reportsTo: person.reportsTo,
      reportsToName: person.reportsTo ? names.get(person.reportsTo) ?? null : null,
      daysOff: daysOffById.get(person.id) ?? "",
      done: stats.done,
      total: stats.total,
      pct: stats.pct,
      next: continueLesson(rows, undefined, allowed),
      assignments: assignments.filter((a) => a.userId === person.id),
    };
  });

  people.sort((a, b) => {
    if (a.role === "pending" && b.role !== "pending") return -1;
    if (b.role === "pending" && a.role !== "pending") return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    viewerId: actorId,
    viewerRole: actorRole,
    title: teamTitle(actorRole),
    people,
    tracks: catalog.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      role: t.role,
      lessons: t.lessons.length,
    })),
  };
}

export const getTeam = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor)) throw new Error("Forbidden");
    return buildTeam(context.userId, actor);
  });

export const assignTraining = createServerFn({ method: "POST" })
  .validator((input: { userId: string; trackId: string; note?: string; dueOn?: string }) => {
    assertClean("an assignment note", input.note);
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor)) throw new Error("Forbidden");
    if (data.userId === context.userId && !isOrgWide(actor) && actor !== "admin") {
      throw new Error("Assign training to the people under you");
    }
    await assertCanViewPerson(context.userId, data.userId);
    const target = await readAccessRole(data.userId);
    if (target === "admin" && actor !== "admin") {
      throw new Error("You cannot assign to the training office");
    }
    const catalog = await readCatalog();
    if (!catalog.tracks.some((t) => t.id === data.trackId)) throw new Error("Unknown course");
    await ensureProfileTable();
    const sql = await getSql();
    await sql`
      insert into training_assignments (id, user_id, track_id, assigned_by, note, due_on, created_at)
      values (
        ${globalThis.crypto.randomUUID()},
        ${data.userId},
        ${data.trackId},
        ${context.userId},
        ${data.note?.trim() || null},
        ${data.dueOn?.trim() || null},
        now()
      )
      on conflict (user_id, track_id) do update set
        assigned_by = excluded.assigned_by,
        note = excluded.note,
        due_on = excluded.due_on
    `;
    const course = catalog.tracks.find((track) => track.id === data.trackId);
    void import("@/lib/notify")
      .then(({ dispatchNotice }) =>
        dispatchNotice({
          kind: "training",
          title: "A course is on your path",
          body: course
            ? `${course.title} was assigned to you.`
            : "A course was assigned to you.",
          href: `/training/${data.trackId}`,
          userIds: [data.userId],
          exceptUserId: context.userId,
        }),
      )
      .catch(() => undefined);
    return buildTeam(context.userId, actor);
  });

export const revokeTraining = createServerFn({ method: "POST" })
  .validator((input: { assignmentId: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor)) throw new Error("Forbidden");
    await ensureProfileTable();
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      select user_id from training_assignments where id = ${data.assignmentId}
    `;
    if (!rows[0]) return buildTeam(context.userId, actor);
    await assertCanViewPerson(context.userId, rows[0].user_id);
    await sql`delete from training_assignments where id = ${data.assignmentId}`;
    return buildTeam(context.userId, actor);
  });

export function groupTeam(people: TeamMember[], viewerId: string) {
  const used = new Set<string>();
  const groups: { lead: TeamMember | null; label: string; members: TeamMember[] }[] = [];

  const direct = people.filter((p) => p.reportsTo === viewerId);
  if (direct.length) {
    groups.push({ lead: null, label: "Reports to you", members: direct });
    for (const person of direct) used.add(person.id);
  }

  const leads = [
    ...direct.filter((p) => p.role === "managers" || p.role === "regional"),
    ...people.filter((p) => p.role === "managers" || p.role === "regional"),
  ];
  const seenLead = new Set<string>();
  for (const lead of leads) {
    if (seenLead.has(lead.id)) continue;
    seenLead.add(lead.id);
    const kids = people.filter((p) => p.reportsTo === lead.id && !used.has(p.id));
    if (!kids.length) continue;
    groups.push({
      lead: used.has(lead.id) ? null : lead,
      label: used.has(lead.id) ? `${lead.name}’s store` : lead.name,
      members: kids,
    });
    used.add(lead.id);
    for (const kid of kids) used.add(kid.id);
  }

  const rest = people.filter((p) => !used.has(p.id));
  if (rest.length) groups.push({ lead: null, label: "Unassigned", members: rest });
  return groups;
}
