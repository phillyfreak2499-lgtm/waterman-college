import { createServerFn } from "@tanstack/react-start";
import { readAccessRole, isOrgWide } from "@/lib/access";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { assertClean } from "@/lib/clean-language";
import { requireApproved } from "@/lib/locker-daily";

/**
 * Win stories: two-sentence Client wins anyone can post, so the whole
 * college remembers why the work matters. Read on /wins, mentioned by the
 * daily locker note, and good huddle material.
 */

export type WinStory = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  store: string | null;
  createdAt: string;
};

const MAX_BODY = 280;
const DAILY_POST_CAP = 10;

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

/** The most recent win stories, newest first. */
export const listWinStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<WinStory[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      body: string;
      user_id: string;
      name: string;
      store: string | null;
      created_at: unknown;
    }>`
      select w.id, w.body, w.user_id, u.name, p.store, w.created_at
      from win_stories w
      join "user" u on u.id = w.user_id
      left join user_profiles p on p.user_id = w.user_id
      order by w.created_at desc
      limit 50
    `;
    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      authorId: row.user_id,
      authorName: row.name,
      store: row.store?.trim() || null,
      createdAt: iso(row.created_at),
    }));
  });

/** Post a win. Short on purpose — two sentences, not a novel. */
export const postWinStory = createServerFn({ method: "POST" })
  .validator((input: { body: string }) => {
    const body = typeof input?.body === "string" ? input.body.trim() : "";
    if (body.length < 10) throw new Error("Give it a sentence or two — what happened?");
    if (body.length > MAX_BODY) {
      throw new Error(`Keep it to about two sentences (${MAX_BODY} characters).`);
    }
    assertClean("a win story", body);
    return { body };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireApproved(context.userId);
    const sql = await getSql();
    const sent = await sql<{ n: number }>`
      select count(*)::int as n from win_stories
      where user_id = ${context.userId} and created_at > now() - interval '1 day'
    `;
    if ((sent[0]?.n ?? 0) >= DAILY_POST_CAP) {
      throw new Error("That's a lot of wins for one day — save some for tomorrow.");
    }
    await sql`
      insert into win_stories (id, user_id, body)
      values (${globalThis.crypto.randomUUID()}, ${context.userId}, ${data.body})
    `;
    return { ok: true };
  });

/** Remove a story — its author, or an org-wide leader/admin cleaning up. */
export const deleteWinStory = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (!input || typeof input.id !== "string" || !input.id.trim()) {
      throw new Error("Unknown story.");
    }
    return { id: input.id.trim() };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      select user_id from win_stories where id = ${data.id} limit 1
    `;
    if (!rows[0]) return { ok: true };
    if (rows[0].user_id !== context.userId) {
      const role = await readAccessRole(context.userId);
      if (!isOrgWide(role) && role !== "admin") throw new Error("Only the author can remove this.");
    }
    await sql`delete from win_stories where id = ${data.id}`;
    return { ok: true };
  });
