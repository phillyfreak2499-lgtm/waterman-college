import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  accessLabel,
  assignableRoles,
  ensureProfileTable,
  fetchPeople,
  isLeader,
  isAccessRole,
  isOrgWide,
  readAccessRole,
  visiblePeople,
  type AccessRole,
} from "@/lib/access";
import { getSql } from "@/lib/db";
import { loadRegions, type Region } from "@/lib/regions";

export type DirectoryEntry = {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  roleLabel: string;
  title: string;
  phone: string;
  storeId: string | null;
  storeName: string | null;
  /** Region a DM/Professor is scoped to (null for most staff). */
  regionId: string | null;
};

export type StoreCard = {
  id: string;
  name: string;
  city: string;
  phone: string;
  sortOrder: number;
  regionId: string | null;
  managers: DirectoryEntry[];
  sales: DirectoryEntry[];
};

export type DirectorySnapshot = {
  office: DirectoryEntry[];
  stores: StoreCard[];
  unassigned: DirectoryEntry[];
  canEdit: boolean;
  /** All regions, for grouping the split view and the assignment menus. */
  regions: Region[];
  /** Set when the viewer is a region-scoped DM/Professor — they see only this. */
  scopedRegionId: string | null;
};

function isOfficeRole(role: AccessRole) {
  return (
    role === "admin" ||
    role === "ceo" ||
    role === "trainer" ||
    role === "sales-manager" ||
    role === "regional"
  );
}

function isSalesRole(role: AccessRole) {
  return role === "specialist" || role === "new-hires" || role === "mit";
}

export function canEditDirectory(role: AccessRole) {
  return isOrgWide(role) || role === "admin";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || `store-${Date.now()}`
  );
}

async function ensureDirectoryTables() {
  // Compatibility shim. Migration 0010 performs the legacy store backfill once.
  await ensureProfileTable();
}

async function assertEditor(userId: string) {
  const role = await readAccessRole(userId);
  if (!canEditDirectory(role)) throw new Error("Forbidden");
}

async function loadEntries(): Promise<DirectoryEntry[]> {
  await ensureDirectoryTables();
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    email: string;
    access_role: string | null;
    title: string | null;
    phone: string | null;
    store_id: string | null;
    store: string | null;
    region_id: string | null;
  }>`
    select
      u.id,
      u.name,
      u.email,
      p.access_role,
      p.title,
      p.phone,
      p.store_id,
      p.store,
      p.region_id
    from "user" u
    left join user_profiles p on p.user_id = u.id
    order by u.name asc
    limit 1000
  `;
  return rows.map((row) => {
    const role = isAccessRole(row.access_role) ? row.access_role : "pending";
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role,
      roleLabel: accessLabel(role),
      title: (row.title ?? "").trim(),
      phone: (row.phone ?? "").trim(),
      storeId: row.store_id || null,
      storeName: row.store || null,
      regionId: row.region_id || null,
    };
  });
}

/** The region a user is scoped to, if any (DMs and Professors). */
async function readRegionId(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ region_id: string | null }>`
    select region_id from user_profiles where user_id = ${userId} limit 1
  `;
  return rows[0]?.region_id || null;
}

async function buildSnapshot(actorId: string): Promise<DirectorySnapshot> {
  const actor = await readAccessRole(actorId);
  if (actor === "pending") throw new Error("Your account must be approved first.");
  const regions = await loadRegions();

  // A DM (regional) or Professor (trainer) with a region assignment sees only
  // that region. Company-wide roles (sales-manager, ceo, admin, chancellor) and
  // everyone else keep their normal role/hierarchy visibility.
  const actorRegionId = await readRegionId(actorId);
  const scopedRegionId =
    (actor === "regional" || actor === "trainer") && actorRegionId ? actorRegionId : null;

  const sql = await getSql();
  const storeRows = await sql<{
    id: string;
    name: string;
    city: string | null;
    phone: string | null;
    sort_order: number;
    region_id: string | null;
  }>`
    select id, name, city, phone, sort_order, region_id from stores
    order by sort_order asc, name asc
    limit 500
  `;
  const scopedStores = scopedRegionId
    ? storeRows.filter((s) => s.region_id === scopedRegionId)
    : storeRows;

  const allEntries = await loadEntries();
  let visible: DirectoryEntry[];
  if (scopedRegionId) {
    const regionStoreIds = new Set(scopedStores.map((s) => s.id));
    visible = allEntries.filter(
      (p) => (p.storeId && regionStoreIds.has(p.storeId)) || p.regionId === scopedRegionId,
    );
  } else {
    const allPeople = (await fetchPeople()).filter((person) => person.accountStatus === "approved");
    const allowedIds = new Set(visiblePeople(actorId, actor, allPeople).map((person) => person.id));
    visible = allEntries.filter((person) => allowedIds.has(person.id));
  }

  const people = visible.map((person) =>
    isLeader(actor) || actor === "admin" ? person : { ...person, email: "", phone: "" },
  );

  const stores: StoreCard[] = scopedStores.map((store) => {
    const here = people.filter((p) => p.storeId === store.id && !isOfficeRole(p.role));
    return {
      id: store.id,
      name: store.name,
      city: store.city ?? "",
      phone: store.phone ?? "",
      sortOrder: Number(store.sort_order) || 0,
      regionId: store.region_id || null,
      managers: here.filter((p) => p.role === "managers"),
      sales: here.filter((p) => isSalesRole(p.role)),
    };
  });

  const placed = new Set(stores.flatMap((s) => [...s.managers, ...s.sales].map((p) => p.id)));
  // Region-scoped viewers don't see the head office; everyone else does.
  const office = scopedRegionId ? [] : people.filter((p) => isOfficeRole(p.role));
  const officeIds = new Set(office.map((p) => p.id));
  const unassigned = people.filter((p) => !officeIds.has(p.id) && !placed.has(p.id));

  return {
    office,
    stores,
    unassigned,
    canEdit: canEditDirectory(actor),
    regions,
    scopedRegionId,
  };
}

export const getDirectory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => buildSnapshot(context.userId));

export const saveStore = createServerFn({ method: "POST" })
  .validator(
    (input: { id?: string; name: string; city?: string; phone?: string; regionId?: string | null }) => {
      if (!input || typeof input.name !== "string" || !input.name.trim() || input.name.length > 120) {
        throw new Error("A store needs a name under 120 characters.");
      }
      if (input.city !== undefined && (typeof input.city !== "string" || input.city.length > 120)) {
        throw new Error("City is too long.");
      }
      if (input.phone !== undefined && (typeof input.phone !== "string" || input.phone.length > 40)) {
        throw new Error("Phone number is too long.");
      }
      if (input.regionId != null && (typeof input.regionId !== "string" || input.regionId.length > 80)) {
        throw new Error("Unknown region.");
      }
      return input;
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertEditor(context.userId);
    await ensureDirectoryTables();
    const name = data.name.trim();
    if (!name) throw new Error("A store needs a name");
    const id = data.id?.trim() || `${slugify(name)}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
    const sql = await getSql();
    const existing = await sql<{ name: string; sort_order: number }>`
      select name, sort_order from stores where id = ${id} limit 1
    `;
    if (data.id && !existing[0]) throw new Error("That store no longer exists.");
    const order = await sql<{ n: number }>`
      select coalesce(max(sort_order), -1)::int + 1 as n from stores
    `;
    const sort = existing[0]?.sort_order ?? order[0]?.n ?? 0;
    await sql.transaction(async (tx) => {
      await tx`
        insert into stores (id, name, city, phone, sort_order, region_id)
        values (
          ${id}, ${name}, ${data.city?.trim() || null}, ${data.phone?.trim() || null},
          ${sort}, ${data.regionId ?? null}
        )
        on conflict (id) do update set
          name = excluded.name,
          city = excluded.city,
          phone = excluded.phone,
          region_id = excluded.region_id
      `;
      if (existing[0] && existing[0].name !== name) {
        await tx`
          update user_profiles set store = ${name} where store_id = ${id}
        `;
      }
    });
    return buildSnapshot(context.userId);
  });

export const deleteStore = createServerFn({ method: "POST" })
  .validator((storeId: string) => {
    if (typeof storeId !== "string" || !/^[a-z0-9-]{1,80}$/i.test(storeId)) {
      throw new Error("Unknown store.");
    }
    return storeId;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: storeId }) => {
    await assertEditor(context.userId);
    await ensureDirectoryTables();
    const sql = await getSql();
    await sql.transaction(async (tx) => {
      await tx`
        update user_profiles
        set store_id = null, store = null
        where store_id = ${storeId}
      `;
      await tx`delete from stores where id = ${storeId}`;
    });
    return buildSnapshot(context.userId);
  });

export const placeDirectoryPerson = createServerFn({ method: "POST" })
  .validator(
    (input: {
      userId: string;
      storeId: string | null;
      title?: string;
      phone?: string;
      role?: AccessRole;
      regionId?: string | null;
    }) => {
      if (!input || typeof input.userId !== "string" || !input.userId.trim()) {
        throw new Error("Choose a person.");
      }
      if (input.storeId !== null && (typeof input.storeId !== "string" || input.storeId.length > 80)) {
        throw new Error("Unknown store.");
      }
      if (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 120)) {
        throw new Error("Title is too long.");
      }
      if (input.phone !== undefined && (typeof input.phone !== "string" || input.phone.length > 40)) {
        throw new Error("Phone number is too long.");
      }
      if (input.regionId != null && (typeof input.regionId !== "string" || input.regionId.length > 80)) {
        throw new Error("Unknown region.");
      }
      if (input.role !== undefined && !isAccessRole(input.role)) throw new Error("Unknown position.");
      return input;
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertEditor(context.userId);
    const actorRole = await readAccessRole(context.userId);
    await ensureDirectoryTables();
    const people = await fetchPeople();
    if (!people.some((p) => p.id === data.userId)) throw new Error("Unknown person");
    const sql = await getSql();
    let storeName: string | null = null;
    if (data.storeId) {
      const stores = await sql<{ name: string }>`select name from stores where id = ${data.storeId}`;
      if (!stores[0]) throw new Error("Unknown store");
      storeName = stores[0].name;
    }
    const current = people.find((p) => p.id === data.userId);
    const role = data.role ?? current?.role ?? "specialist";
    if (data.role && !assignableRoles(actorRole).includes(data.role)) {
      throw new Error("You cannot assign that position.");
    }
    const status = role === "pending" ? "pending" : "approved";
    await sql`
      insert into user_profiles (
        user_id, access_role, store, store_id, title, phone,
        account_status, assigned_by, assigned_at, created_at, region_id
      )
      values (
        ${data.userId},
        ${role},
        ${storeName},
        ${data.storeId},
        ${data.title?.trim() || null},
        ${data.phone?.trim() || null},
        ${status},
        ${context.userId},
        now(),
        now(),
        ${data.regionId ?? null}
      )
      on conflict (user_id) do update set
        access_role = excluded.access_role,
        store = excluded.store,
        store_id = excluded.store_id,
        title = coalesce(excluded.title, user_profiles.title),
        phone = coalesce(excluded.phone, user_profiles.phone),
        account_status = excluded.account_status,
        assigned_by = excluded.assigned_by,
        assigned_at = now(),
        region_id = excluded.region_id
    `;
    return buildSnapshot(context.userId);
  });
