import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { readCatalog, slugify, type Catalog } from "@/lib/cms";
import { getSql } from "@/lib/db";
import { requireStudio } from "@/lib/studio";

function cleanId(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const id = value.trim();
  if (!id || id.length > 120 || !/^[a-z0-9][a-z0-9:_-]*$/i.test(id)) {
    throw new Error(`${label} is invalid.`);
  }
  return id;
}

/** Copy a lesson onto the same course with a new slug. */
export const duplicateLesson = createServerFn({ method: "POST" })
  .validator((input: { trackId: string; slug: string }) => ({
    trackId: cleanId(input?.trackId, "Course"),
    slug: cleanId(input?.slug, "Lesson"),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Catalog> => {
    await requireStudio(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      slug: string;
      title: string;
      minutes: number;
      kicker: string | null;
      body: string;
      takeaway: string | null;
      eval_phases: string[] | null;
    }>`
      select slug, title, minutes, kicker, body, takeaway, eval_phases
      from cms_lessons
      where track_id = ${data.trackId} and slug = ${data.slug}
      limit 1
    `;
    const lesson = rows[0];
    if (!lesson) throw new Error("That lesson is not on this course.");
    const nextSlug = slugify(`${lesson.title}-copy`);
    const id = `${data.trackId}:${nextSlug}`;
    const count = await sql<{ n: number }>`
      select count(*)::int as n from cms_lessons where track_id = ${data.trackId}
    `;
    const title = lesson.title.endsWith("(copy)") ? lesson.title : `${lesson.title} (copy)`;
    await sql`
      insert into cms_lessons (id, track_id, slug, title, minutes, kicker, body, takeaway, sort_order, eval_phases)
      values (
        ${id}, ${data.trackId}, ${nextSlug}, ${title},
        ${lesson.minutes}, ${lesson.kicker}, ${lesson.body}, ${lesson.takeaway},
        ${count[0]?.n ?? 0}, ${lesson.eval_phases ?? []}
      )
      on conflict (id) do nothing
    `;
    return readCatalog();
  });

/** Move a lesson up or down on its course. */
export const reorderLesson = createServerFn({ method: "POST" })
  .validator((input: { trackId: string; slug: string; direction: "up" | "down" }) => {
    if (input?.direction !== "up" && input?.direction !== "down") {
      throw new Error("Choose up or down.");
    }
    return {
      trackId: cleanId(input.trackId, "Course"),
      slug: cleanId(input.slug, "Lesson"),
      direction: input.direction,
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Catalog> => {
    await requireStudio(context.userId);
    const sql = await getSql();
    const rows = await sql<{ slug: string; sort_order: number }>`
      select slug, sort_order
      from cms_lessons
      where track_id = ${data.trackId}
      order by sort_order asc, title asc
    `;
    const index = rows.findIndex((row) => row.slug === data.slug);
    if (index < 0) throw new Error("That lesson is not on this course.");
    const swapWith = data.direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= rows.length) return readCatalog();
    const a = rows[index];
    const b = rows[swapWith];
    await sql`
      update cms_lessons
      set sort_order = ${b.sort_order}
      where track_id = ${data.trackId} and slug = ${a.slug}
    `;
    await sql`
      update cms_lessons
      set sort_order = ${a.sort_order}
      where track_id = ${data.trackId} and slug = ${b.slug}
    `;
    return readCatalog();
  });
