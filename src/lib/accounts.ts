import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  ACCESS_ROLES,
  fetchPeople,
  isAccessRole,
  readAccessRole,
  writeAccessRole,
  type AccessRole,
  type DirectoryPerson,
} from "@/lib/access";
import { getSql, type Sql } from "@/lib/db";

export const ACCOUNT_DOMAIN = "accounts.waterman";
export type AccountStatus = "pending" | "approved" | "denied" | "deactivated";

const MAX_USERS = 2_000;

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${ACCOUNT_DOMAIN}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z][a-z0-9._-]{2,31}$/i.test(value.trim());
}

function text(value: unknown, label: string, max: number, required = true) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${label} is required.`);
  if (cleaned.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return cleaned;
}

function userId(value: unknown) {
  return text(value, "User", 120);
}

function password(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 256) {
    throw new Error("Password must be between 12 and 256 characters.");
  }
  return value;
}

function accessRole(value: unknown): AccessRole {
  if (!isAccessRole(value)) throw new Error("Unknown position.");
  return value;
}

async function requireAdmin(id: string) {
  const { isChancellorId } = await import("@/lib/rbac");
  if (await isChancellorId(id)) return;
  if ((await readAccessRole(id)) !== "admin") {
    throw new Error("Only the training office can do that.");
  }
}

async function findUserIdByEmail(email: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${email.toLowerCase()} limit 1
  `;
  return rows[0]?.id ?? null;
}

async function wipeSessions(id: string, sql?: Sql) {
  const client = sql ?? (await getSql());
  await client`delete from session where "userId" = ${id}`;
}

async function cleanupIdentity(id: string) {
  if (!id) return;
  const sql = await getSql();
  await sql.transaction(async (tx) => {
    await tx`delete from session where "userId" = ${id}`;
    await tx`delete from account where "userId" = ${id}`;
    await tx`delete from "user" where id = ${id}`;
  });
}

async function createLocalUser(input: {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const username = normalizeUsername(text(input.username, "Username", 32));
  if (!isValidUsername(username)) {
    throw new Error("Usernames start with a letter and use letters, numbers, dots, dashes, or underscores.");
  }
  const safePassword = password(input.password);
  const firstName = text(input.firstName, "First name", 80);
  const lastName = text(input.lastName, "Last name", 80);
  const sql = await getSql();
  const taken = await sql<{ user_id: string }>`
    select user_id from user_profiles where lower(username) = ${username} limit 1
  `;
  if (taken.length) throw new Error("That username is already taken.");
  const email = usernameToEmail(username);
  if (await findUserIdByEmail(email)) throw new Error("That username is already taken.");

  let id = "";
  try {
    const { auth } = await import("@/lib/auth/server");
    const context = await auth.$context;
    const hash = await context.password.hash(safePassword);
    const user = await context.internalAdapter.createUser({
      email,
      name: `${firstName} ${lastName}`,
      emailVerified: true,
    });
    if (!user?.id) throw new Error("Could not create the account.");
    id = user.id;
    await context.internalAdapter.linkAccount({
      userId: id,
      providerId: "credential",
      accountId: id,
      password: hash,
    });
  } catch (reason) {
    await cleanupIdentity(id).catch(() => undefined);
    const message = reason instanceof Error ? reason.message : "Could not create the account.";
    if (/already|exist|unique/i.test(message)) throw new Error("That username is already taken.");
    throw new Error(message);
  }
  return { userId: id, username, firstName, lastName, email };
}

async function reservedUsername(username: string) {
  const { configuredChancellorUsername } = await import("@/lib/chancellor-config.server");
  const configured = configuredChancellorUsername();
  return Boolean(configured && username === configured);
}

type RequestAccountInput = {
  username: string;
  password: string;
  fullName: string;
  store: string;
  title: string;
};

function validateRequest(input: RequestAccountInput): RequestAccountInput {
  if (!input || typeof input !== "object") throw new Error("Account details are required.");
  return {
    username: text(input.username, "Username", 32),
    password: password(input.password),
    fullName: text(input.fullName, "Full name", 160),
    store: text(input.store, "Store", 120, false),
    title: text(input.title, "Title", 120, false),
  };
}

export const requestAccount = createServerFn({ method: "POST" })
  .validator(validateRequest)
  .handler(async ({ data }) => {
    const username = normalizeUsername(data.username);
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("account-request", username, { max: 5, windowMs: 60 * 60_000 });
    if (await reservedUsername(username)) throw new Error("That username is reserved.");
    const parts = data.fullName.trim().split(/\s+/);
    const created = await createLocalUser({
      username,
      password: data.password,
      firstName: parts[0] || data.fullName,
      lastName: parts.slice(1).join(" ") || parts[0] || data.fullName,
    });
    try {
      const sql = await getSql();
      await sql`
        insert into user_profiles (
          user_id, access_role, username, first_name, last_name, store, title,
          account_status, must_change_password, created_at
        ) values (
          ${created.userId}, 'pending', ${created.username}, ${created.firstName},
          ${created.lastName}, ${data.store || null}, ${data.title || null},
          'pending', false, now()
        )
      `;
    } catch (reason) {
      await cleanupIdentity(created.userId).catch(() => undefined);
      if (reason instanceof Error && /unique/i.test(reason.message)) {
        throw new Error("That username is already taken.");
      }
      throw reason;
    }
    return { ok: true as const };
  });

export const readMyAccount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      access_role: string | null;
      account_status: string | null;
      username: string | null;
      rbac_role: string | null;
      must_change_password: boolean;
    }>`
      select access_role, account_status, username, rbac_role, must_change_password
      from user_profiles where user_id = ${context.userId} limit 1
    `;
    const role = isAccessRole(rows[0]?.access_role) ? rows[0].access_role : "pending";
    const rawStatus = rows[0]?.account_status;
    const status: AccountStatus =
      rawStatus === "approved" || rawStatus === "denied" || rawStatus === "deactivated"
        ? rawStatus
        : "pending";
    return {
      userId: context.userId,
      role,
      status,
      username: rows[0]?.username ?? "",
      chancellor: rows[0]?.rbac_role === "super-admin",
      mustChangePassword: Boolean(rows[0]?.must_change_password),
    };
  });

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return (await fetchPeople()).slice(0, MAX_USERS);
  });

export const approveAccount = createServerFn({ method: "POST" })
  .validator((input: { userId: string; role: AccessRole }) => ({
    userId: userId(input?.userId),
    role: accessRole(input?.role),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.role === "pending") throw new Error("Choose a position for this person.");
    await writeAccessRole(data.userId, data.role, { assignedBy: context.userId });
    void import("@/lib/notify")
      .then(({ dispatchNotice }) =>
        dispatchNotice({
          kind: "account",
          title: "You are in",
          body: "The office approved your account. The hall is open.",
          href: "/training",
          userIds: [data.userId],
        }),
      )
      .catch(() => undefined);
    return fetchPeople();
  });

export const denyAccount = createServerFn({ method: "POST" })
  .validator(userId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    if (id === context.userId) throw new Error("You cannot deny your own account.");
    const sql = await getSql();
    await sql`
      insert into user_profiles (user_id, access_role, account_status, created_at)
      values (${id}, 'pending', 'denied', now())
      on conflict (user_id) do update set account_status = 'denied', access_role = 'pending'
    `;
    await wipeSessions(id);
    return fetchPeople();
  });

type CreateAccountInput = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AccessRole;
};

function validateCreate(input: CreateAccountInput): CreateAccountInput {
  if (!input || typeof input !== "object") throw new Error("Account details are required.");
  return {
    username: text(input.username, "Username", 32),
    password: password(input.password),
    firstName: text(input.firstName, "First name", 80),
    lastName: text(input.lastName, "Last name", 80),
    role: accessRole(input.role),
  };
}

export const createAccount = createServerFn({ method: "POST" })
  .validator(validateCreate)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.role === "pending" || data.role === "admin") {
      throw new Error("Choose a non-administrator position for the new person.");
    }
    const username = normalizeUsername(data.username);
    if (await reservedUsername(username)) throw new Error("That username is reserved.");
    const created = await createLocalUser(data);
    try {
      const sql = await getSql();
      await sql`
        insert into user_profiles (
          user_id, access_role, username, first_name, last_name, account_status,
          must_change_password, assigned_by, assigned_at, created_at
        ) values (
          ${created.userId}, ${data.role}, ${created.username}, ${created.firstName},
          ${created.lastName}, 'approved', true, ${context.userId}, now(), now()
        )
      `;
    } catch (reason) {
      await cleanupIdentity(created.userId).catch(() => undefined);
      throw reason;
    }
    return fetchPeople();
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .validator(userId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    if (id === context.userId) throw new Error("You cannot delete your own account.");
    const { isChancellorId } = await import("@/lib/rbac");
    if (await isChancellorId(id)) throw new Error("The Chancellor account cannot be deleted here.");
    const sql = await getSql();
    await sql.transaction(async (tx) => {
      await tx`delete from session where "userId" = ${id}`;
      await tx`delete from account where "userId" = ${id}`;
      await tx`delete from training_assignments where user_id = ${id}`;
      await tx`delete from lesson_progress where user_id = ${id}`;
      await tx`delete from quiz_responses where user_id = ${id}`;
      await tx`delete from trainer_notes where user_id = ${id}`;
      await tx`delete from admin_unlocks where user_id = ${id}`;
      await tx`delete from password_reset_requests where user_id = ${id}`;
      await tx`update user_profiles set reports_to = null where reports_to = ${id}`;
      await tx`delete from user_profiles where user_id = ${id}`;
      await tx`delete from "user" where id = ${id}`;
    });
    return fetchPeople();
  });

export const updateAccountRole = createServerFn({ method: "POST" })
  .validator((input: { userId: string; role: AccessRole }) => ({
    userId: userId(input?.userId),
    role: accessRole(input?.role),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.role === "admin") throw new Error("Administrator access is managed in Roles.");
    await writeAccessRole(data.userId, data.role, { assignedBy: context.userId });
    return fetchPeople();
  });

export type AccountRecord = DirectoryPerson;

export const recordLogin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`update user_profiles set last_login_at = now() where user_id = ${context.userId}`;
    return true;
  });

export const officeListUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireChancellor } = await import("@/lib/rbac");
    await requireChancellor(context.userId);
    return fetchPeople();
  });

export const officeApproveUser = createServerFn({ method: "POST" })
  .validator((input: { userId: string; rbacRole: string; accessRole: AccessRole }) => ({
    userId: userId(input?.userId),
    rbacRole: text(input?.rbacRole, "Role", 80),
    accessRole: accessRole(input?.accessRole),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { requireChancellor, writeAudit, loadRole } = await import("@/lib/rbac");
    await requireChancellor(context.userId);
    const rbac = await loadRole(data.rbacRole);
    if (!rbac) throw new Error("Choose a valid role.");
    if (rbac.id === "super-admin") throw new Error("A second Chancellor cannot be assigned.");
    await writeAccessRole(data.userId, rbac.accessRole, { assignedBy: context.userId });
    const sql = await getSql();
    await sql`update user_profiles set account_status = 'approved', rbac_role = ${rbac.id} where user_id = ${data.userId}`;
    await writeAudit(context.userId, "", "user.approved", data.userId);
    void import("@/lib/notify")
      .then(({ dispatchNotice }) =>
        dispatchNotice({
          kind: "account",
          title: "You are in",
          body: "The office approved your account. The hall is open.",
          href: "/training",
          userIds: [data.userId],
        }),
      )
      .catch(() => undefined);
    return fetchPeople();
  });

type OfficeUpdateInput = {
  userId: string;
  store: string;
  title: string;
  status: AccountStatus;
  rbacRole: string;
  accessRole: AccessRole;
};

export const officeUpdateUser = createServerFn({ method: "POST" })
  .validator((input: OfficeUpdateInput) => {
    const status = input?.status;
    if (!(["pending", "approved", "denied", "deactivated"] as unknown[]).includes(status)) {
      throw new Error("Unknown account status.");
    }
    return {
      userId: userId(input?.userId),
      store: text(input?.store ?? "", "Store", 120, false),
      title: text(input?.title ?? "", "Title", 120, false),
      status,
      rbacRole: text(input?.rbacRole, "Role", 80),
      accessRole: accessRole(input?.accessRole),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { requireChancellor, writeAudit, loadRole } = await import("@/lib/rbac");
    await requireChancellor(context.userId);
    const rbac = await loadRole(data.rbacRole);
    if (!rbac) throw new Error("Choose a valid role.");
    if (rbac.id === "super-admin" && data.userId !== context.userId) {
      throw new Error("A second Chancellor cannot be assigned.");
    }
    await writeAccessRole(data.userId, rbac.accessRole, { assignedBy: context.userId });
    const sql = await getSql();
    await sql`
      update user_profiles
      set store = ${data.store || null}, title = ${data.title || null},
          account_status = ${data.status}, rbac_role = ${rbac.id}
      where user_id = ${data.userId}
    `;
    if (data.status === "deactivated" || data.status === "denied") await wipeSessions(data.userId);
    await writeAudit(context.userId, "", "user.updated", `${data.userId} → ${data.status}`);
    return fetchPeople();
  });

type OfficeAddInput = {
  username: string;
  password: string;
  fullName: string;
  store: string;
  title: string;
  rbacRole: string;
};

export const officeAddUser = createServerFn({ method: "POST" })
  .validator((input: OfficeAddInput) => ({
    username: text(input?.username, "Username", 32),
    password: password(input?.password),
    fullName: text(input?.fullName, "Full name", 160),
    store: text(input?.store ?? "", "Store", 120, false),
    title: text(input?.title ?? "", "Title", 120, false),
    rbacRole: text(input?.rbacRole, "Role", 80),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { requireChancellor, writeAudit, loadRole } = await import("@/lib/rbac");
    await requireChancellor(context.userId);
    const rbac = await loadRole(data.rbacRole);
    if (!rbac || rbac.id === "super-admin") throw new Error("Choose a valid non-Chancellor role.");
    const username = normalizeUsername(data.username);
    if (await reservedUsername(username)) throw new Error("That username is reserved.");
    const parts = data.fullName.split(/\s+/);
    const created = await createLocalUser({
      username,
      password: data.password,
      firstName: parts[0] || data.fullName,
      lastName: parts.slice(1).join(" ") || parts[0] || data.fullName,
    });
    try {
      const sql = await getSql();
      await sql`
        insert into user_profiles (
          user_id, access_role, username, first_name, last_name, store, title,
          account_status, rbac_role, must_change_password, assigned_by, assigned_at, created_at
        ) values (
          ${created.userId}, ${rbac.accessRole}, ${created.username}, ${created.firstName},
          ${created.lastName}, ${data.store || null}, ${data.title || null}, 'approved',
          ${rbac.id}, true, ${context.userId}, now(), now()
        )
      `;
    } catch (reason) {
      await cleanupIdentity(created.userId).catch(() => undefined);
      throw reason;
    }
    await writeAudit(context.userId, "", "user.created", created.username);
    return fetchPeople();
  });

export type PasswordResetRequest = {
  id: string;
  userId: string;
  name: string;
  username: string;
  requestedAt: string;
};

async function loadPasswordResetRequests(sql: Sql): Promise<PasswordResetRequest[]> {
  const rows = await sql<{
    id: string;
    user_id: string;
    name: string;
    username: string | null;
    requested_at: string | Date;
  }>`
    select r.id, r.user_id, u.name, p.username, r.requested_at
    from password_reset_requests r
    join "user" u on u.id = r.user_id
    join user_profiles p on p.user_id = r.user_id
    where r.resolved_at is null
    order by r.requested_at asc
    limit 100
  `;
  return rows.map((row): PasswordResetRequest => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    username: row.username ?? "",
    requestedAt: String(row.requested_at),
  }));
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((value: string) => normalizeUsername(text(value, "Username", 32)))
  .handler(async ({ data: username }) => {
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("password-reset", username, { max: 5, windowMs: 60 * 60_000 });
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      select user_id from user_profiles
      where lower(username) = ${username} and account_status = 'approved'
      limit 1
    `;
    if (rows[0]) {
      await sql`
        insert into password_reset_requests (id, user_id, requested_at)
        values (${globalThis.crypto.randomUUID()}, ${rows[0].user_id}, now())
        on conflict (user_id) where resolved_at is null do nothing
      `;
    }
    return { ok: true as const };
  });

export const listPasswordResetRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return loadPasswordResetRequests(sql);
  });

export const resolvePasswordReset = createServerFn({ method: "POST" })
  .validator((input: { requestId: string; temporaryPassword: string }) => ({
    requestId: text(input?.requestId, "Reset request", 120),
    temporaryPassword: password(input?.temporaryPassword),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{ user_id: string; rbac_role: string | null }>`
      select r.user_id, p.rbac_role
      from password_reset_requests r
      join user_profiles p on p.user_id = r.user_id
      where r.id = ${data.requestId} and r.resolved_at is null
      limit 1
    `;
    const target = rows[0];
    if (!target) throw new Error("That reset request is no longer open.");
    if (target.rbac_role === "super-admin") {
      const { requireChancellor } = await import("@/lib/rbac");
      await requireChancellor(context.userId);
    }
    const { auth } = await import("@/lib/auth/server");
    const authContext = await auth.$context;
    const hash = await authContext.password.hash(data.temporaryPassword);
    await authContext.internalAdapter.updatePassword(target.user_id, hash);
    await sql.transaction(async (tx) => {
      await tx`update user_profiles set must_change_password = true where user_id = ${target.user_id}`;
      await tx`
        update password_reset_requests
        set resolved_at = now(), resolved_by = ${context.userId}
        where id = ${data.requestId} and resolved_at is null
      `;
      await wipeSessions(target.user_id, tx);
    });
    const { writeAudit } = await import("@/lib/rbac");
    await writeAudit(context.userId, "", "password.reset", target.user_id);
    return loadPasswordResetRequests(sql);
  });

export const confirmOwnPasswordChange = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`update user_profiles set must_change_password = false where user_id = ${context.userId}`;
    return { ok: true as const };
  });

// Retained for UI imports; all assignments are still validated server-side.
export { ACCESS_ROLES };
