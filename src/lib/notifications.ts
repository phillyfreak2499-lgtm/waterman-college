import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  DEFAULT_PREFS,
  dispatchNotice,
  listInbox,
  markInboxRead,
  readPrefs,
  unreadCount,
  writePrefs,
  type NoticePrefs,
} from "@/lib/notify";

function prefsFrom(input: NoticePrefs): NoticePrefs {
  return {
    enabled: Boolean(input?.enabled),
    remarkable: input?.remarkable !== false,
    training: input?.training !== false,
    account: input?.account !== false,
    quiz: input?.quiz !== false,
  };
}

export const getNoticePrefs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => readPrefs(context.userId));

export const saveNoticePrefs = createServerFn({ method: "POST" })
  .validator(prefsFrom)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await writePrefs(context.userId, data);
    return data;
  });

export const getNoticeInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ({
    items: await listInbox(context.userId),
    unread: await unreadCount(context.userId),
    prefs: await readPrefs(context.userId),
  }));

export const markNoticesRead = createServerFn({ method: "POST" })
  .validator((input: { id?: string } = {}) => ({ id: input?.id?.trim() || undefined }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await markInboxRead(context.userId, data.id);
    return { unread: await unreadCount(context.userId) };
  });

export const getPushPublicKey = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { getVapidKeys } = await import("@/lib/push.server");
    const keys = await getVapidKeys();
    return { publicKey: keys.publicKey };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .validator((input: { endpoint: string; p256dh: string; auth: string }) => {
    if (!input?.endpoint || !input.p256dh || !input.auth) throw new Error("Subscription is incomplete.");
    return {
      endpoint: String(input.endpoint).slice(0, 2000),
      p256dh: String(input.p256dh).slice(0, 200),
      auth: String(input.auth).slice(0, 200),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { saveSubscription } = await import("@/lib/push.server");
    await saveSubscription({ userId: context.userId, ...data });
    const next = { ...(await readPrefs(context.userId)), enabled: true };
    await writePrefs(context.userId, next);
    return next;
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .validator((input: { endpoint: string }) => ({
    endpoint: String(input?.endpoint ?? "").slice(0, 2000),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { dropSubscription } = await import("@/lib/push.server");
    if (data.endpoint) await dropSubscription(data.endpoint, context.userId);
    const next = { ...(await readPrefs(context.userId)), enabled: false };
    await writePrefs(context.userId, next);
    return next;
  });

export const sendTestNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await dispatchNotice({
      kind: "account",
      title: "Waterman College",
      body: "Push is on. You will hear from the office here.",
      href: "/notifications",
      userIds: [context.userId],
    });
    return { ok: true as const };
  });

export { DEFAULT_PREFS };
export type { NoticePrefs };
