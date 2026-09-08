import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { readCatalog, slugify, type Catalog } from "@/lib/cms";

async function assertStudio(userId: string) {
  const { readAccessProfile } = await import("@/lib/access");
  const profile = await readAccessProfile(userId);
  if (!profile.canOpenStudio) throw new Error("Forbidden");
}

export const reorderLessons = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => {
    const data = value as { trackId?: string; slugs?: string[] };
    if (!data?.trackId || !Array.isArray(data.slugs) || data.slugs.length === 0) {
      throw new Error("Pick a course and an order.");
    }
    if (data.slugs.length > 200) throw new Error("Too many lessons.");
    return { trackId: data.trackId, slugs: data.slugs.map(String) };
  })
  .handler(async ({ context, data }): Promise<Catalog> => {
    await assertStudio(context.userId);
    const sql = await getSql();
    for (const [index, slug] of data.slugs.entries()) {
      await sql`
        update cms_lessons
        set sort_order = ${index}
        where track_id = ${data.trackId} and slug = ${slug}
      `;
    }
    return readCatalog();
  });

export const duplicateLesson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => {
    const data = value as { trackId?: string; slug?: string };
    if (!data?.trackId || !data?.slug) throw new Error("Pick a lesson to copy.");
    return { trackId: String(data.trackId), slug: String(data.slug) };
  })
  .handler(async ({ context, data }): Promise<Catalog> => {
    await assertStudio(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      title: string;
      minutes: number;
      kicker: string | null;
      body: string;
      takeaway: string | null;
      eval_phases: string[] | null;
    }>`
      select title, minutes, kicker, body, takeaway, eval_phases
      from cms_lessons
      where track_id = ${data.trackId} and slug = ${data.slug}
      limit 1
    `;
    const lesson = rows[0];
    if (!lesson) throw new Error("That lesson is gone.");
    const nextSlug = slugify(`${data.slug}-copy`);
    const id = `${data.trackId}:${nextSlug}`;
    const last = await sql<{ n: number }>`
      select coalesce(max(sort_order), -1)::int + 1 as n
      from cms_lessons
      where track_id = ${data.trackId}
    `;
    await sql`
      insert into cms_lessons (id, track_id, slug, title, minutes, kicker, body, takeaway, eval_phases, sort_order)
      values (
        ${id},
        ${data.trackId},
        ${nextSlug},
        ${`${lesson.title} (copy)`},
        ${lesson.minutes},
        ${lesson.kicker},
        ${lesson.body},
        ${lesson.takeaway},
        ${lesson.eval_phases},
        ${last[0]?.n ?? 0}
      )
      on conflict (id) do nothing
    `;
    return readCatalog();
  });
