import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { readAccessProfile } from "@/lib/access";
import { readCatalog } from "@/lib/cms";
import { getSql } from "@/lib/db";
import type { ProgressRow } from "@/lib/progress";
import {
  continueLesson,
  lessonKey,
  trackStats,
  type ContinueTarget,
} from "@/lib/progress-stats";

export type MyAssignment = {
  assignmentId: string;
  trackId: string;
  trackTitle: string;
  dueOn: string | null;
  note: string;
  assignedByName: string;
  progress: {
    done: number;
    total: number;
    pct: number;
    nextLessonSlug: string | null;
    nextLessonTitle: string | null;
  };
  isOverdue: boolean;
  daysUntilDue: number | null;
};

export type LockerFavorite = {
  id: string;
  targetType: "track" | "lesson";
  targetId: string;
  title: string;
  href: string;
  createdAt: string;
};

export type LockerNote = {
  id: string;
  body: string;
  pinned: boolean;
  reminderOn: string | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Accept YYYY-MM-DD or full ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

/** Store hours are Central; `due_on` is entered and read in that zone. */
const BUSINESS_TIME_ZONE = "America/Chicago";

/** Today's calendar date in the company's timezone, as YYYY-MM-DD. */
function businessToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Whole days until `dueOn`, both read as calendar dates in the company's zone.
 *
 * `new Date()` / `new Date(dueOn + "T00:00:00")` resolve in the SERVER's zone —
 * UTC on Vercel. For the first hours of each Central day UTC has already rolled
 * over, so an assignment due today was reported overdue. `digest.ts` compares
 * due dates the same way; matching it keeps the Locker, the Team board and the
 * Chancellor's weekly report telling one story.
 */
function daysUntil(dueOn: string | null): { isOverdue: boolean; daysUntilDue: number | null } {
  if (!dueOn) return { isOverdue: false, daysUntilDue: null };
  const due = String(dueOn).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return { isOverdue: false, daysUntilDue: null };
  const todayMs = Date.parse(`${businessToday()}T00:00:00Z`);
  const dueMs = Date.parse(`${due}T00:00:00Z`);
  if (Number.isNaN(todayMs) || Number.isNaN(dueMs)) {
    return { isOverdue: false, daysUntilDue: null };
  }
  const diff = Math.round((dueMs - todayMs) / 86_400_000);
  return { isOverdue: diff < 0, daysUntilDue: diff };
}

async function loadProgressRows(userId: string): Promise<ProgressRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    lesson_key: string;
    started_at: unknown;
    last_viewed_at: unknown;
    completed_at: unknown;
  }>`
    select lesson_key, started_at, last_viewed_at, completed_at
    from lesson_progress
    where user_id = ${userId}
    order by last_viewed_at desc
    limit 10000
  `;
  return rows.map((r) => ({
    lessonKey: r.lesson_key,
    startedAt: iso(r.started_at),
    lastViewedAt: iso(r.last_viewed_at),
    completedAt: r.completed_at == null ? null : iso(r.completed_at),
  }));
}

/** List the current user's assigned courses with due dates, leadership notes, and progress. */
export const listMyAssignments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MyAssignment[]> => {
    const sql = await getSql();
    const catalog = await readCatalog();
    const trackById = new Map(catalog.tracks.map((t) => [t.id, t]));

    const assignRows = await sql<{
      id: string;
      track_id: string;
      note: string | null;
      due_on: string | null;
      assigned_by: string;
      created_at: unknown;
    }>`
      select id, track_id, note, due_on, assigned_by, created_at
      from training_assignments
      where user_id = ${context.userId}
      order by created_at desc
      limit 100
    `;

    if (!assignRows.length) return [];

    const assignerIds = [...new Set(assignRows.map((r) => r.assigned_by))];
    const nameRows =
      assignerIds.length > 0
        ? await sql<{ id: string; name: string | null }>`
            select id, name from "user" where id = any(${assignerIds}::text[])
          `
        : [];
    const nameById = new Map(nameRows.map((r) => [r.id, r.name || "Leadership"]));

    const progress = await loadProgressRows(context.userId);

    const results: MyAssignment[] = [];
    for (const row of assignRows) {
      const track = trackById.get(row.track_id);
      if (!track) continue;
      const stats = trackStats(progress, track);
      const next = track.lessons.find(
        (l) => !progress.some((p) => p.lessonKey === lessonKey(track.id, l.slug) && p.completedAt),
      );
      const dueOn = toDateOnly(row.due_on);
      const { isOverdue, daysUntilDue } = daysUntil(dueOn);
      results.push({
        assignmentId: row.id,
        trackId: track.id,
        trackTitle: track.title,
        dueOn,
        note: row.note?.trim() || "",
        assignedByName: nameById.get(row.assigned_by) || "Leadership",
        progress: {
          done: stats.done,
          total: stats.total,
          pct: Math.round(stats.pct),
          nextLessonSlug: next?.slug ?? null,
          nextLessonTitle: next?.title ?? null,
        },
        isOverdue,
        daysUntilDue,
      });
    }

    // Sort: overdue first, then soonest due, then no due date last
    results.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.daysUntilDue == null && b.daysUntilDue == null) return 0;
      if (a.daysUntilDue == null) return 1;
      if (b.daysUntilDue == null) return -1;
      return a.daysUntilDue - b.daysUntilDue;
    });

    return results;
  });

/** Smart next-up target for the current user. */
export const listLockerContinue = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ContinueTarget | null> => {
    const profile = await readAccessProfile(context.userId);
    const catalog = await readCatalog();
    const progress = await loadProgressRows(context.userId);
    const preferred =
      profile.role === "new-hires" ||
      profile.role === "specialist" ||
      profile.role === "mit" ||
      profile.role === "managers"
        ? profile.role
        : undefined;
    const path = catalog.tracks.filter(
      (t) =>
        (preferred && t.role === preferred) ||
        profile.assignedTrackIds.includes(t.id),
    );
    return continueLesson(progress, preferred, path.length ? path : catalog.tracks);
  });

/** Overall progress snapshot for the locker. */
export const listLockerProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await readAccessProfile(context.userId);
    const catalog = await readCatalog();
    const progress = await loadProgressRows(context.userId);
    const path = catalog.tracks.filter(
      (t) =>
        profile.allowedTabs.includes(t.role) ||
        profile.assignedTrackIds.includes(t.id),
    );
    let done = 0;
    let total = 0;
    for (const track of path) {
      const s = trackStats(progress, track);
      done += s.done;
      total += s.total;
    }
    return {
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      pathCount: path.length,
    };
  });

// ── Favorites ──────────────────────────────────────────────────────────────

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LockerFavorite[]> => {
    const sql = await getSql();
    const catalog = await readCatalog();
    const rows = await sql<{
      id: string;
      target_type: string;
      target_id: string;
      created_at: unknown;
    }>`
      select id, target_type, target_id, created_at
      from user_favorites
      where user_id = ${context.userId}
      order by created_at desc
      limit 50
    `;

    const out: LockerFavorite[] = [];
    for (const row of rows) {
      if (row.target_type === "track") {
        const track = catalog.tracks.find((t) => t.id === row.target_id);
        if (!track) continue;
        out.push({
          id: row.id,
          targetType: "track",
          targetId: row.target_id,
          title: track.title,
          href: `/training/${track.id}`,
          createdAt: iso(row.created_at),
        });
      } else if (row.target_type === "lesson") {
        const slash = row.target_id.indexOf("/");
        if (slash < 0) continue;
        const trackId = row.target_id.slice(0, slash);
        const slug = row.target_id.slice(slash + 1);
        const track = catalog.tracks.find((t) => t.id === trackId);
        const lesson = track?.lessons.find((l) => l.slug === slug);
        if (!track || !lesson) continue;
        out.push({
          id: row.id,
          targetType: "lesson",
          targetId: row.target_id,
          title: lesson.title,
          href: `/training/${track.id}/${lesson.slug}`,
          createdAt: iso(row.created_at),
        });
      }
    }
    return out;
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .validator((input: { targetType: "track" | "lesson"; targetId: string }) => {
    if (input.targetType !== "track" && input.targetType !== "lesson") {
      throw new Error("Invalid favorite type.");
    }
    if (!input.targetId || input.targetId.length > 200) {
      throw new Error("Invalid target.");
    }
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from user_favorites
      where user_id = ${context.userId}
        and target_type = ${data.targetType}
        and target_id = ${data.targetId}
      limit 1
    `;
    if (existing[0]) {
      await sql`delete from user_favorites where id = ${existing[0].id}`;
      return { favorited: false };
    }
    await sql`
      insert into user_favorites (id, user_id, target_type, target_id, created_at)
      values (
        ${globalThis.crypto.randomUUID()},
        ${context.userId},
        ${data.targetType},
        ${data.targetId},
        now()
      )
      -- select-then-write with no transaction: a double-tap raced the unique
      -- index and surfaced the constraint violation as a 500. Already-present
      -- IS success here.
      on conflict (user_id, target_type, target_id) do nothing
    `;
    return { favorited: true };
  });

// ── Locker notes / reminders ───────────────────────────────────────────────

export const listLockerNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LockerNote[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      body: string;
      pinned: boolean;
      reminder_on: string | null;
      done_at: unknown;
      created_at: unknown;
      updated_at: unknown;
    }>`
      select id, body, pinned, reminder_on, done_at, created_at, updated_at
      from user_locker_notes
      where user_id = ${context.userId}
      order by pinned desc, updated_at desc
      limit 100
    `;
    return rows.map((r) => ({
      id: r.id,
      body: r.body,
      pinned: Boolean(r.pinned),
      reminderOn: r.reminder_on,
      doneAt: r.done_at == null ? null : iso(r.done_at),
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));
  });

export const upsertLockerNote = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id?: string;
      body: string;
      pinned?: boolean;
      reminderOn?: string | null;
    }) => {
      const body = typeof input.body === "string" ? input.body.trim() : "";
      if (!body || body.length > 4000) throw new Error("Write a note (up to 4000 characters).");
      return {
        id: input.id,
        body,
        pinned: Boolean(input.pinned),
        reminderOn: toDateOnly(input.reminderOn ?? null),
      };
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      const owned = await sql<{ id: string }>`
        select id from user_locker_notes
        where id = ${data.id} and user_id = ${context.userId}
        limit 1
      `;
      if (!owned[0]) throw new Error("Note not found.");
      await sql`
        update user_locker_notes
        set body = ${data.body},
            pinned = ${data.pinned},
            reminder_on = ${data.reminderOn},
            updated_at = now()
        where id = ${data.id}
      `;
      return { id: data.id };
    }
    const id = globalThis.crypto.randomUUID();
    await sql`
      insert into user_locker_notes (id, user_id, body, pinned, reminder_on, created_at, updated_at)
      values (
        ${id},
        ${context.userId},
        ${data.body},
        ${data.pinned},
        ${data.reminderOn},
        now(),
        now()
      )
    `;
    return { id };
  });

export const deleteLockerNote = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (!input.id || input.id.length > 80) throw new Error("Unknown note.");
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const removed = await sql<{ id: string }>`
      delete from user_locker_notes
      where id = ${data.id} and user_id = ${context.userId}
      returning id
    `;
    // Ownership is enforced by the WHERE; report a miss, not a false success.
    if (!removed.length) throw new Error("That note no longer exists.");
    return { ok: true as const };
  });

export const markReminderDone = createServerFn({ method: "POST" })
  .validator((input: { id: string; done?: boolean }) => {
    if (!input.id || input.id.length > 80) throw new Error("Unknown note.");
    // `done` defaults to true so existing one-way callers are unaffected.
    return { id: input.id, done: input.done !== false };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const updated = await sql<{ id: string }>`
      update user_locker_notes
      set done_at = ${data.done ? new Date().toISOString() : null},
          updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
      returning id
    `;
    if (!updated.length) throw new Error("That note no longer exists.");
    return { ok: true as const, done: data.done };
  });
