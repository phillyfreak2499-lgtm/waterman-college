import { getSql } from "@/lib/db";

/**
 * Who may build training.
 *
 * The Training Building Center is open to anyone with the `manageTraining`
 * permission (Professors and any boss role the Chancellor grants it to), plus
 * the classic admin paths: the `admin` access role, the Chancellor, or an
 * unexpired office-password unlock. Everything is enforced here, server-side —
 * the client gate on `/build` is only cosmetic.
 *
 * Mirrors the fail-closed shape of `assertAdmin` in cms.ts but adds the
 * `manageTraining` perm so building no longer requires the admin password.
 */
export async function assertCanBuildTraining(userId: string): Promise<void> {
  if (!userId) throw new Error("Forbidden");
  const { readAccessProfile } = await import("@/lib/access");
  const profile = await readAccessProfile(userId);
  if (profile.isAdmin) return; // admin role or Chancellor
  // canOpenStudio already folds in the manageTraining and viewStudio perms
  // (and admin/Chancellor), keeping this builder's gate identical to the studio.
  if (profile.canOpenStudio || profile.perms.manageTraining) return;
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from admin_unlocks
    where user_id = ${userId} and expires_at > now()
    limit 1
  `;
  if (!rows.length) throw new Error("Forbidden");
}

/** True/false form for UI-side hints (never the sole gate — the fns above are). */
export async function canBuildTraining(userId: string): Promise<boolean> {
  try {
    await assertCanBuildTraining(userId);
    return true;
  } catch {
    return false;
  }
}
