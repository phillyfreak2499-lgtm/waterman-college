import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type ProgressRow = {
  lessonKey: string;
  startedAt: string;
  lastViewedAt: string;
  completedAt: string | null;
};

type DbRow = {
  lesson_key: string;
  started_at: unknown;
  last_viewed_at: unknown;
  completed_at: unknown;
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return toIso(value);
}

function mapRows(rows: DbRow[]): ProgressRow[] {
  return rows.map((r) => ({
    lessonKey: r.lesson_key,
    startedAt: toIso(r.started_at),
    lastViewedAt: toIso(r.last_viewed_at),
    completedAt: toIsoOrNull(r.completed_at),
  }));
}

async function fetchRows(userId: string) {
  const sql = await getSql();
  const rows = await sql<DbRow>`
    select lesson_key, started_at, last_viewed_at, completed_at
    from lesson_progress
    where user_id = ${userId}
    order by last_viewed_at desc
    limit 10000
  `;
  return mapRows(rows);
}

export const listProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => fetchRows(context.userId));

export const markViewed = createServerFn({ method: "POST" })
  .validator(validateLessonKey)
  .middleware([authMiddleware])
  .handler(async ({ context, data: lessonKey }) => {
    if (!lessonKey) return [] as ProgressRow[];
    const [trackId, slug] = lessonKey.split("/");
    await assertLessonAccess(context.userId, trackId, slug);
    const sql = await getSql();
    await sql`
      insert into lesson_progress (user_id, lesson_key, started_at, last_viewed_at, completed_at)
      values (${context.userId}, ${lessonKey}, now(), now(), null)
      on conflict (user_id, lesson_key) do update
      set last_viewed_at = now()
    `;
    return fetchRows(context.userId);
  });

export const markComplete = createServerFn({ method: "POST" })
  .validator(validateLessonKey)
  .middleware([authMiddleware])
  .handler(async ({ context, data: lessonKey }) => {
    if (!lessonKey) return [] as ProgressRow[];
    const [trackId, slug] = lessonKey.split("/");
    await assertLessonAccess(context.userId, trackId, slug);
    const sql = await getSql();
    await sql`
      insert into lesson_progress (user_id, lesson_key, started_at, last_viewed_at, completed_at)
      values (${context.userId}, ${lessonKey}, now(), now(), now())
      on conflict (user_id, lesson_key) do update
      set
        completed_at = coalesce(lesson_progress.completed_at, now()),
        last_viewed_at = now(),
        started_at = coalesce(lesson_progress.started_at, now())
    `;
    return fetchRows(context.userId);
  });

export const markIncomplete = createServerFn({ method: "POST" })
  .validator(validateLessonKey)
  .middleware([authMiddleware])
  .handler(async ({ context, data: lessonKey }) => {
    if (!lessonKey) return [] as ProgressRow[];
    const [trackId, slug] = lessonKey.split("/");
    await assertLessonAccess(context.userId, trackId, slug);
    const sql = await getSql();
    await sql`
      update lesson_progress
      set completed_at = null, last_viewed_at = now()
      where user_id = ${context.userId} and lesson_key = ${lessonKey}
    `;
    return fetchRows(context.userId);
  });

function validateLessonKey(value: string) {
  if (typeof value !== "string") throw new Error("Unknown lesson.");
  const key = value.trim();
  if (!/^[a-z0-9:_-]+\/[a-z0-9:_-]+$/i.test(key) || key.length > 180) {
    throw new Error("Unknown lesson.");
  }
  return key;
}

async function assertLessonAccess(userId: string, trackId: string, slug: string) {
  const { assertTrackAccess } = await import("@/lib/access");
  await assertTrackAccess(userId, trackId);
  const sql = await getSql();
  const lessons = await sql<{ id: string }>`
    select id from cms_lessons where track_id = ${trackId} and slug = ${slug} limit 1
  `;
  if (!lessons.length) throw new Error("That lesson is no longer available.");
}
