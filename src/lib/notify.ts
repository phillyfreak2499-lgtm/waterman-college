import { getSql } from "@/lib/db";

export const NOTICE_KINDS = ["remarkable", "training", "account", "quiz"] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export type NoticePrefs = {
  enabled: boolean;
  remarkable: boolean;
  training: boolean;
  account: boolean;
  quiz: boolean;
};

export type NoticeItem = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export const DEFAULT_PREFS: NoticePrefs = {
  enabled: false,
  remarkable: true,
  training: true,
  account: true,
  quiz: true,
};

export async function ensureNotifySchema() {
  const sql = await getSql();
  await sql`
    create table if not exists notification_prefs (
      user_id text primary key,
      enabled boolean not null default false,
      remarkable boolean not null default true,
      training boolean not null default true,
      account boolean not null default true,
      quiz boolean not null default true,
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists push_subscriptions (
      endpoint text primary key,
      user_id text not null,
      p256dh text not null,
      auth text not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id)`;
  await sql`
    create table if not exists notifications (
      id text primary key,
      user_id text not null,
      kind text not null,
      title text not null,
      body text not null,
      href text not null default '/',
      read_at timestamptz,
      created_at timestamptz
    )
  `;
  await sql`create index if not exists notifications_user_idx on notifications (user_id, created_at desc)`;
  await sql`
    create table if not exists vapid_keys (
      id integer primary key,
      public_key text not null,
      private_key text not null,
      created_at timestamptz
    )
  `;
}

export function isNoticeKind(value: unknown): value is NoticeKind {
  return typeof value === "string" && (NOTICE_KINDS as readonly string[]).includes(value);
}

export async function readPrefs(userId: string): Promise<NoticePrefs> {
  await ensureNotifySchema();
  const sql = await getSql();
  const rows = await sql<NoticePrefs>`
    select enabled, remarkable, training, account, quiz
    from notification_prefs where user_id = ${userId} limit 1
  `;
  return rows[0] ? { ...DEFAULT_PREFS, ...rows[0] } : { ...DEFAULT_PREFS };
}

export async function writePrefs(userId: string, prefs: NoticePrefs) {
  await ensureNotifySchema();
  const sql = await getSql();
  await sql`
    insert into notification_prefs (user_id, enabled, remarkable, training, account, quiz, updated_at)
    values (${userId}, ${prefs.enabled}, ${prefs.remarkable}, ${prefs.training}, ${prefs.account}, ${prefs.quiz}, now())
    on conflict (user_id) do update set
      enabled = excluded.enabled,
      remarkable = excluded.remarkable,
      training = excluded.training,
      account = excluded.account,
      quiz = excluded.quiz,
      updated_at = now()
  `;
}

export async function listInbox(userId: string, limit = 30): Promise<NoticeItem[]> {
  await ensureNotifySchema();
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    kind: string;
    title: string;
    body: string;
    href: string;
    read_at: string | null;
    created_at: string;
  }>`
    select id, kind, title, body, href, read_at, created_at
    from notifications
    where user_id = ${userId}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: isNoticeKind(row.kind) ? row.kind : "account",
    title: row.title,
    body: row.body,
    href: row.href || "/",
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  }));
}

export async function unreadCount(userId: string) {
  await ensureNotifySchema();
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from notifications where user_id = ${userId} and read_at is null
  `;
  return rows[0]?.n ?? 0;
}

export async function markInboxRead(userId: string, id?: string) {
  await ensureNotifySchema();
  const sql = await getSql();
  if (id) {
    await sql`update notifications set read_at = now() where user_id = ${userId} and id = ${id} and read_at is null`;
  } else {
    await sql`update notifications set read_at = now() where user_id = ${userId} and read_at is null`;
  }
}

async function audience(kind: NoticeKind, onlyUserIds?: string[]) {
  const sql = await getSql();
  if (onlyUserIds?.length) return onlyUserIds;
  const rows = await sql<{
    user_id: string;
    remarkable: boolean | null;
    training: boolean | null;
    account: boolean | null;
    quiz: boolean | null;
  }>`
    select p.user_id, n.remarkable, n.training, n.account, n.quiz
    from user_profiles p
    left join notification_prefs n on n.user_id = p.user_id
    where coalesce(p.account_status, 'pending') = 'approved'
  `;
  return rows
    .filter((row) => (row[kind] == null ? true : Boolean(row[kind])))
    .map((row) => row.user_id);
}

export async function dispatchNotice(input: {
  kind: NoticeKind;
  title: string;
  body: string;
  href: string;
  userIds?: string[];
  exceptUserId?: string;
}) {
  await ensureNotifySchema();
  const sql = await getSql();
  let ids = await audience(input.kind, input.userIds);
  if (input.exceptUserId) ids = ids.filter((id) => id !== input.exceptUserId);
  if (!ids.length) return { sent: 0 };

  for (const userId of ids) {
    await sql`
      insert into notifications (id, user_id, kind, title, body, href, created_at)
      values (
        ${globalThis.crypto.randomUUID()},
        ${userId},
        ${input.kind},
        ${input.title},
        ${input.body},
        ${input.href},
        now()
      )
    `;
  }

  try {
    const { pushToUsers } = await import("@/lib/push.server");
    await pushToUsers(ids, {
      title: input.title,
      body: input.body,
      href: input.href,
    });
  } catch {
    // Inbox still landed. Push is best-effort.
  }
  return { sent: ids.length };
}
