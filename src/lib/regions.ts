import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isOrgWide, readAccessRole, type AccessRole } from "@/lib/access";
import { getSql } from "@/lib/db";

export type Region = { id: string; name: string; sortOrder: number };

/** Who can create/rename/delete regions and assign them — same as directory editors. */
export function canManageRegions(role: AccessRole) {
  return isOrgWide(role) || role === "admin";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || `region-${globalThis.crypto.randomUUID().slice(0, 8)}`
  );
}

async function assertRegionEditor(userId: string) {
  const role = await readAccessRole(userId);
  if (!canManageRegions(role)) throw new Error("Forbidden");
}

export async function loadRegions(): Promise<Region[]> {
  const sql = await getSql();
  const rows = await sql<{ id: string; name: string; sort_order: number }>`
    select id, name, sort_order from regions
    order by sort_order asc, name asc
    limit 100
  `;
  return rows.map((r) => ({ id: r.id, name: r.name, sortOrder: Number(r.sort_order) || 0 }));
}

export const listRegions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<Region[]> => loadRegions());

export const saveRegion = createServerFn({ method: "POST" })
  .validator((input: { id?: string; name: string }) => {
    if (!input || typeof input.name !== "string" || !input.name.trim() || input.name.length > 60) {
      throw new Error("A region needs a name under 60 characters.");
    }
    return { id: input.id?.trim() || undefined, name: input.name.trim() };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertRegionEditor(context.userId);
    const sql = await getSql();
    if (data.id) {
      const existing = await sql`select id from regions where id = ${data.id} limit 1`;
      if (!existing.length) throw new Error("That region no longer exists.");
      await sql`update regions set name = ${data.name} where id = ${data.id}`;
    } else {
      const id = `${slugify(data.name)}-${globalThis.crypto.randomUUID().slice(0, 6)}`;
      const order = await sql<{ n: number }>`
        select coalesce(max(sort_order), -1)::int + 1 as n from regions
      `;
      await sql`
        insert into regions (id, name, sort_order)
        values (${id}, ${data.name}, ${order[0]?.n ?? 0})
      `;
    }
    return loadRegions();
  });

export const deleteRegion = createServerFn({ method: "POST" })
  .validator((regionId: string) => {
    if (typeof regionId !== "string" || !/^[a-z0-9-]{1,80}$/i.test(regionId)) {
      throw new Error("Unknown region.");
    }
    return regionId;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: regionId }) => {
    await assertRegionEditor(context.userId);
    const sql = await getSql();
    await sql.transaction(async (tx) => {
      await tx`update stores set region_id = null where region_id = ${regionId}`;
      await tx`update user_profiles set region_id = null where region_id = ${regionId}`;
      await tx`delete from regions where id = ${regionId}`;
    });
    return loadRegions();
  });
