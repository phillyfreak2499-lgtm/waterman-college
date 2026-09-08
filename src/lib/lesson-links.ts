import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { LESSON_TAGS, lessonLineKey, tagOfLine, type LessonTag } from "@/lib/lesson-tags";

/**
 * Resource links for tagged lesson lines.
 *
 * Lesson bodies carry tagged lines — `GFA · …`, `ROLEPLAY · …`, `SOLUTION · …`,
 * `VIDEO · …` — that named a resource but linked nowhere. This module lets the
 * training office attach a destination to an individual line, and lets the
 * lesson page render that line as a real link.
 *
 * The tag list and line-key helpers now live in `@/lib/lesson-tags` (one source
 * of truth shared with the lesson renderer and the builder). Re-exported here
 * so existing importers keep working.
 */

/** @deprecated import `LESSON_TAGS` from `@/lib/lesson-tags`. */
export const LINKABLE_TAGS = LESSON_TAGS;
export type LinkableTag = LessonTag;
export { lessonLineKey, tagOfLine };

export type LessonLink = {
  trackId: string;
  lessonSlug: string;
  lineKey: string;
  tag: string;
  label: string;
  url: string;
};

/**
 * Accept only a plain http(s) destination.
 *
 * This value is written into an `href` that staff will click, so anything else
 * — `javascript:`, `data:`, `vbscript:`, a protocol-relative `//host` — is a
 * stored-XSS or off-site-redirect vector. Parse it properly rather than
 * pattern-matching, and re-serialise so the stored value is normalised.
 */
export function normalizeResourceUrl(raw: string): string {
  const value = String(raw ?? "").trim();
  if (!value) throw new Error("Add a link first.");
  if (value.length > 2048) throw new Error("That link is too long.");
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("That does not look like a full web address (https://…).");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Links must start with https:// or http://");
  }
  return parsed.toString();
}

/** Pull the first usable URL out of a drop / paste payload. */
export function firstUrlFromText(raw: string): string | null {
  // `text/uri-list` is newline separated and allows `#` comment lines.
  for (const line of String(raw ?? "").split(/[\r\n]+/)) {
    const candidate = line.trim();
    if (!candidate || candidate.startsWith("#")) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.toString();
      }
    } catch {
      /* not a URL — keep looking */
    }
  }
  return null;
}

async function assertOffice(userId: string) {
  const { assertCanBuildTraining } = await import("@/lib/training-access.server");
  await assertCanBuildTraining(userId);
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function rowsToLinks(
  rows: { track_id: string; lesson_slug: string; line_key: string; tag: string; label: string; url: string }[],
): LessonLink[] {
  return rows.map((row) => ({
    trackId: row.track_id,
    lessonSlug: row.lesson_slug,
    lineKey: row.line_key,
    tag: row.tag,
    label: row.label ?? "",
    url: row.url,
  }));
}

/**
 * Links for one lesson. Read-only and safe for any signed-in learner: it
 * returns destinations for a lesson they are already permitted to open, and the
 * lesson body itself is gated upstream by the catalog redaction.
 */
export const listLessonLinks = createServerFn({ method: "GET" })
  .validator((input: { trackId: string; lessonSlug: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const trackId = cleanText(data?.trackId, 120);
    const lessonSlug = cleanText(data?.lessonSlug, 120);
    if (!trackId || !lessonSlug) return [];
    const sql = await getSql();
    const rows = await sql<{
      track_id: string;
      lesson_slug: string;
      line_key: string;
      tag: string;
      label: string;
      url: string;
    }>`
      select track_id, lesson_slug, line_key, tag, label, url
      from lesson_links
      where track_id = ${trackId} and lesson_slug = ${lessonSlug}
      limit 400
    `;
    return rowsToLinks(rows);
  });

/** Every link, for the office management screen. */
export const listAllLessonLinks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertOffice(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      track_id: string;
      lesson_slug: string;
      line_key: string;
      tag: string;
      label: string;
      url: string;
    }>`
      select track_id, lesson_slug, line_key, tag, label, url
      from lesson_links
      order by track_id asc, lesson_slug asc
      limit 2000
    `;
    return rowsToLinks(rows);
  });

export const saveLessonLink = createServerFn({ method: "POST" })
  .validator(
    (input: {
      trackId: string;
      lessonSlug: string;
      lineKey: string;
      tag: string;
      label: string;
      url: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertOffice(context.userId);
    const trackId = cleanText(data?.trackId, 120);
    const lessonSlug = cleanText(data?.lessonSlug, 120);
    const lineKey = cleanText(data?.lineKey, 160);
    const tag = cleanText(data?.tag, 40);
    const label = cleanText(data?.label, 200);
    if (!trackId || !lessonSlug || !lineKey || !tag) {
      throw new Error("That line could not be identified. Reload and try again.");
    }
    const url = normalizeResourceUrl(data?.url);
    const sql = await getSql();
    await sql`
      insert into lesson_links (track_id, lesson_slug, line_key, tag, label, url, updated_by, updated_at)
      values (${trackId}, ${lessonSlug}, ${lineKey}, ${tag}, ${label}, ${url}, ${context.userId}, now())
      on conflict (track_id, lesson_slug, line_key) do update set
        tag = excluded.tag,
        label = excluded.label,
        url = excluded.url,
        updated_by = excluded.updated_by,
        updated_at = now()
    `;
    return { trackId, lessonSlug, lineKey, tag, label, url } satisfies LessonLink;
  });

export const deleteLessonLink = createServerFn({ method: "POST" })
  .validator((input: { trackId: string; lessonSlug: string; lineKey: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertOffice(context.userId);
    const trackId = cleanText(data?.trackId, 120);
    const lessonSlug = cleanText(data?.lessonSlug, 120);
    const lineKey = cleanText(data?.lineKey, 160);
    const sql = await getSql();
    await sql`
      delete from lesson_links
      where track_id = ${trackId} and lesson_slug = ${lessonSlug} and line_key = ${lineKey}
    `;
    return { ok: true as const };
  });
