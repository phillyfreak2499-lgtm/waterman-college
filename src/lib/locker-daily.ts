import { createServerFn } from "@tanstack/react-start";
import { businessToday } from "@/lib/activity";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

/**
 * The people-side of the daily locker note: birthdays, work anniversaries,
 * peer shout-outs, and new-hire welcomes. `getLockerDaily` gathers today's
 * facts for the signed-in user; `sendShoutout` lets anyone drop one kind
 * sentence into a coworker's locker.
 */

export type TeamEvent = {
  kind: "birthday" | "anniversary" | "new";
  /** Teammate's display name. */
  name: string;
  /** Whole years, anniversaries only. */
  years?: number;
};

export type LockerDaily = {
  /** Today is the user's own birthday. */
  birthdayToday: boolean;
  /** Whole years with the company when today is their start-date anniversary. */
  anniversaryYears: number | null;
  /** Profile created in the last few days — show the first-day welcome. */
  isNewHire: boolean;
  /** Today's featured peer shout-out, if any (one per day; others queue). */
  shoutout: { fromName: string; body: string } | null;
  /** Same-store teammates with something worth mentioning today. */
  teamEvents: TeamEvent[];
};

/** Days a profile counts as "new" for the welcome + teammate mentions. */
const NEW_HIRE_DAYS = 3;

/** Most shout-outs one person can send in a rolling day. */
const SHOUTOUT_DAILY_CAP = 25;

/** Coerce "M/D", "MM-DD", or "MM-DD" with junk spacing into padded MM-DD. */
export function normalizeMonthDay(value: string | null | undefined): string | null {
  const m = (value ?? "").trim().match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toTime(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && value) {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function isRecent(createdAt: unknown, days: number): boolean {
  const t = toTime(createdAt);
  return t != null && Date.now() - t < days * 86_400_000;
}

/** Whole years since a YYYY-MM-DD start date when today is its anniversary. */
function anniversaryYears(startDate: string | null, today: string): number | null {
  const trimmed = (startDate ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  if (trimmed.slice(5) !== today.slice(5)) return null;
  const years = Number(today.slice(0, 4)) - Number(trimmed.slice(0, 4));
  return years >= 1 ? years : null;
}

type ProfileRow = {
  name: string;
  birthday: string | null;
  start_date: string | null;
  created_at: unknown;
};

function eventsFor(row: ProfileRow, today: string): TeamEvent[] {
  const out: TeamEvent[] = [];
  if (normalizeMonthDay(row.birthday) === today.slice(5)) {
    out.push({ kind: "birthday", name: row.name });
  }
  const years = anniversaryYears(row.start_date, today);
  if (years != null) out.push({ kind: "anniversary", name: row.name, years });
  if (isRecent(row.created_at, NEW_HIRE_DAYS)) out.push({ kind: "new", name: row.name });
  return out;
}

/** Today's people-facts for the signed-in user's locker note. */
export const getLockerDaily = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LockerDaily> => {
    const sql = await getSql();
    const today = businessToday();
    const userId = context.userId;

    const selfRows = await sql<{
      birthday: string | null;
      start_date: string | null;
      store_id: string | null;
      created_at: unknown;
      account_status: string | null;
    }>`
      select birthday, start_date, store_id, created_at, account_status
      from user_profiles where user_id = ${userId} limit 1
    `;
    const self = selfRows[0];

    // Featured shout-out: keep showing the one already featured today, else
    // promote the oldest unseen one. Featuring marks it seen so the next
    // unseen shout-out waits for tomorrow — one bright moment per day.
    let shoutout: LockerDaily["shoutout"] = null;
    const featured = await sql<{ body: string; name: string }>`
      select s.body, u.name
      from locker_shoutouts s
      join "user" u on u.id = s.from_user
      where s.to_user = ${userId} and s.seen_on = ${today}
      order by s.created_at asc
      limit 1
    `;
    if (featured[0]) {
      shoutout = { fromName: featured[0].name, body: featured[0].body };
    } else {
      const taken = await sql<{ body: string; from_user: string }>`
        update locker_shoutouts set seen_on = ${today}
        where id = (
          select id from locker_shoutouts
          where to_user = ${userId} and seen_on is null
          order by created_at asc
          limit 1
        )
        returning body, from_user
      `;
      if (taken[0]) {
        const sender = await sql<{ name: string }>`
          select name from "user" where id = ${taken[0].from_user} limit 1
        `;
        shoutout = { fromName: sender[0]?.name || "a coworker", body: taken[0].body };
      }
    }

    let teamEvents: TeamEvent[] = [];
    if (self?.store_id) {
      const mates = await sql<ProfileRow>`
        select u.name, p.birthday, p.start_date, p.created_at
        from user_profiles p
        join "user" u on u.id = p.user_id
        where p.store_id = ${self.store_id}
          and p.user_id != ${userId}
          and p.account_status = 'approved'
        limit 200
      `;
      teamEvents = mates.flatMap((row) => eventsFor(row, today));
    }

    return {
      birthdayToday: normalizeMonthDay(self?.birthday) === today.slice(5),
      anniversaryYears: anniversaryYears(self?.start_date ?? null, today),
      isNewHire:
        self?.account_status === "approved" && isRecent(self.created_at, NEW_HIRE_DAYS),
      shoutout,
      teamEvents,
    };
  });

/** Send one kind sentence to a coworker's locker. */
export const sendShoutout = createServerFn({ method: "POST" })
  .validator((input: { toUserId: string; body: string }) => {
    if (!input || typeof input.toUserId !== "string" || !input.toUserId.trim()) {
      throw new Error("Choose a person.");
    }
    if (typeof input.body !== "string" || input.body.trim().length < 3) {
      throw new Error("Write a sentence — it only takes one.");
    }
    if (input.body.length > 200) {
      throw new Error("Keep it to one sentence (200 characters).");
    }
    return { toUserId: input.toUserId.trim(), body: input.body.trim() };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (data.toUserId === context.userId) {
      throw new Error("Aim it at a coworker — you already know you're great.");
    }
    const sql = await getSql();
    const recipient = await sql<{ account_status: string | null }>`
      select account_status from user_profiles where user_id = ${data.toUserId} limit 1
    `;
    if (recipient[0]?.account_status !== "approved") throw new Error("Unknown person.");
    const sent = await sql<{ n: number }>`
      select count(*)::int as n from locker_shoutouts
      where from_user = ${context.userId} and created_at > now() - interval '1 day'
    `;
    if ((sent[0]?.n ?? 0) >= SHOUTOUT_DAILY_CAP) {
      throw new Error("That's a lot of shout-outs for one day — save some for tomorrow.");
    }
    await sql`
      insert into locker_shoutouts (id, to_user, from_user, body)
      values (${globalThis.crypto.randomUUID()}, ${data.toUserId}, ${context.userId}, ${data.body})
    `;
    return { ok: true };
  });
