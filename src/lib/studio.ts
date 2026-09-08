import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { readAccessProfile } from "@/lib/access";
import type { TrainerNote } from "@/lib/ask-trainer";
import { readCatalog } from "@/lib/cms";
import { getSql } from "@/lib/db";
import { parsePerms, type Perms } from "@/lib/perms";
import { loadRoles, writeAudit, type RbacRole } from "@/lib/rbac";

export async function requireStudio(userId: string) {
  const profile = await readAccessProfile(userId);
  if (profile.canOpenStudio) return profile;
  throw new Error("The Training Office is closed to you.");
}

export type StudioDesk = {
  pendingQuestions: number;
  liveCourses: number;
  draftCourses: number;
  roster: number;
  notes: TrainerNote[];
};

export const getStudioDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StudioDesk> => {
    await requireStudio(context.userId);
    const sql = await getSql();
    const catalog = await readCatalog();
    const counts = await sql<{ live: number; draft: number; roster: number }>`
      select
        (select count(*)::int from cms_tracks where archived = false) as live,
        (select count(*)::int from cms_tracks where archived = true) as draft,
        (select count(*)::int from user_profiles where account_status = 'approved') as roster
    `;
    const rows = await sql<{
      id: string;
      user_id: string;
      name: string | null;
      store: string | null;
      lesson_key: string;
      body: string;
      created_at: string | Date | null;
      reviewed_at: string | Date | null;
    }>`
      select
        n.id, n.user_id, u.name, p.store, n.lesson_key, n.body,
        n.created_at, n.reviewed_at
      from trainer_notes n
      left join "user" u on u.id = n.user_id
      left join user_profiles p on p.user_id = n.user_id
      order by n.created_at desc
      limit 8
    `;
    const notes: TrainerNote[] = rows.map((row) => {
      const [trackId, slug] = row.lesson_key.split("/");
      const track = catalog.tracks.find((item) => item.id === trackId);
      const lesson = track?.lessons.find((item) => item.slug === slug);
      return {
        id: row.id,
        userId: row.user_id,
        userName: row.name ?? "Unknown",
        store: row.store ?? "",
        lessonKey: row.lesson_key,
        trackTitle: track?.title ?? trackId ?? "",
        lessonTitle: lesson?.title ?? slug ?? row.lesson_key,
        body: row.body,
        createdAt: row.created_at ? String(row.created_at) : "",
        reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      };
    });
    const pending = await sql<{ n: number }>`
      select count(*)::int as n from trainer_notes where reviewed_at is null
    `;
    return {
      pendingQuestions: pending[0]?.n ?? notes.filter((note) => !note.reviewedAt).length,
      liveCourses: counts[0]?.live ?? 0,
      draftCourses: counts[0]?.draft ?? 0,
      roster: counts[0]?.roster ?? 0,
      notes,
    };
  });

export const listStudioRoles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireStudio(context.userId);
    if (!profile.isChancellor && !profile.perms.manageUsers) {
      throw new Error("Only the Chancellor can change who opens this office.");
    }
    return loadRoles();
  });

function withStudioFlag(perms: Perms, open: boolean): Perms {
  const next = parsePerms(perms);
  next.viewStudio = open;
  if (open) next.manageTraining = true;
  return next;
}

export const setStudioRoleAccess = createServerFn({ method: "POST" })
  .validator((input: { roleId: string; open: boolean }) => {
    if (!input || typeof input.roleId !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(input.roleId)) {
      throw new Error("Unknown role.");
    }
    return { roleId: input.roleId, open: Boolean(input.open) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<RbacRole[]> => {
    const profile = await requireStudio(context.userId);
    if (!profile.isChancellor && !profile.perms.manageUsers) {
      throw new Error("Only the Chancellor can change who opens this office.");
    }
    if (data.roleId === "super-admin" && !data.open) {
      throw new Error("The Chancellor always keeps a key.");
    }
    const sql = await getSql();
    const rows = await sql<{ id: string; perms: string }>`
      select id, perms from rbac_roles where id = ${data.roleId} limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("That role no longer exists.");
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(row.perms || "{}");
    } catch {
      parsed = {};
    }
    const next = withStudioFlag(parsePerms(parsed), data.open);
    await sql`
      update rbac_roles
      set perms = ${JSON.stringify(next)}
      where id = ${data.roleId}
    `;
    await writeAudit(
      context.userId,
      "",
      data.open ? "studio.opened" : "studio.closed",
      data.roleId,
    );
    return loadRoles();
  });
