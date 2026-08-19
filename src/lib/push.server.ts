import webpush from "web-push";
import { getSql } from "@/lib/db";
import { ensureNotifySchema } from "@/lib/notify";

type VapidPair = { publicKey: string; privateKey: string };

export async function getVapidKeys(): Promise<VapidPair> {
  await ensureNotifySchema();
  const sql = await getSql();
  const existing = await sql<VapidPair>`
    select public_key as "publicKey", private_key as "privateKey" from vapid_keys where id = 1 limit 1
  `;
  if (existing[0]) return existing[0];
  const generated = webpush.generateVAPIDKeys();
  await sql`
    insert into vapid_keys (id, public_key, private_key, created_at)
    values (1, ${generated.publicKey}, ${generated.privateKey}, now())
    on conflict (id) do nothing
  `;
  const again = await sql<VapidPair>`
    select public_key as "publicKey", private_key as "privateKey" from vapid_keys where id = 1 limit 1
  `;
  return again[0] ?? generated;
}

export async function saveSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  await ensureNotifySchema();
  const sql = await getSql();
  await sql`
    insert into push_subscriptions (endpoint, user_id, p256dh, auth, created_at)
    values (${input.endpoint}, ${input.userId}, ${input.p256dh}, ${input.auth}, now())
    on conflict (endpoint) do update set
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth
  `;
}

export async function dropSubscription(endpoint: string, userId?: string) {
  await ensureNotifySchema();
  const sql = await getSql();
  if (userId) {
    await sql`delete from push_subscriptions where endpoint = ${endpoint} and user_id = ${userId}`;
  } else {
    await sql`delete from push_subscriptions where endpoint = ${endpoint}`;
  }
}

export async function pushToUsers(
  userIds: string[],
  payload: { title: string; body: string; href: string },
) {
  if (!userIds.length) return;
  const keys = await getVapidKeys();
  webpush.setVapidDetails("mailto:office@accounts.waterman", keys.publicKey, keys.privateKey);
  const sql = await getSql();
  const subs = await sql<{ endpoint: string; p256dh: string; auth: string; user_id: string }>`
    select endpoint, p256dh, auth, user_id from push_subscriptions
    where user_id = any(${userIds})
  `;
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await dropSubscription(sub.endpoint);
        }
      }
    }),
  );
}
