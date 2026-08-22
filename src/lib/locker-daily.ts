import { createServerFn } from "@tanstack/react-start";
import { businessToday } from "@/lib/activity";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  DEFAULT_ACCENT,
  LOCKER_ACCENTS,
  LOCKER_STICKERS,
  MAX_STICKERS,
  parseStickers,
  type LockerStyle,
} from "@/lib/locker-style";

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
  /** False when no birthday is on file — the locker shows the nudge. */
  hasBirthday: boolean;
  /** A fresh win story by someone else (last 36h), for the daily note. */
  recentWin: { authorName: string; store: string | null } | null;
  /** The owner's chosen locker decoration. */
  style: LockerStyle;
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

/**
 * The one birthday check: does a stored birthday (MM-DD, tolerant of "M/D")
 * fall on the given YYYY-MM-DD calendar day? Every birthday feature — the
 * locker takeover, the directory cake, teammate notes, eve reminders —
 * routes through this.
 */
export function isBirthdayOn(birthday: string | null | undefined, day: string): boolean {
  const md = normalizeMonthDay(birthday);
  return md !== null && md === day.slice(5);
}

/** Step a YYYY-MM-DD label forward one day (labels are timezone-free). */
function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
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
  if (isBirthdayOn(row.birthday, today)) {
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
      locker_accent: string | null;
      locker_stickers: string | null;
    }>`
      select birthday, start_date, store_id, created_at, account_status,
             locker_accent, locker_stickers
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

    let recentWin: LockerDaily["recentWin"] = null;
    const wins = await sql<{ name: string; store: string | null }>`
      select u.name, p.store
      from win_stories w
      join "user" u on u.id = w.user_id
      left join user_profiles p on p.user_id = w.user_id
      where w.user_id != ${userId} and w.created_at > now() - interval '36 hours'
      order by w.created_at desc
      limit 1
    `;
    if (wins[0]) recentWin = { authorName: wins[0].name, store: wins[0].store?.trim() || null };

    return {
      style: {
        accent: LOCKER_ACCENTS[self?.locker_accent ?? ""] ? self!.locker_accent! : DEFAULT_ACCENT,
        stickers: parseStickers(self?.locker_stickers),
      },
      recentWin,
      hasBirthday: normalizeMonthDay(self?.birthday) !== null,
      birthdayToday: isBirthdayOn(self?.birthday, today),
      anniversaryYears: anniversaryYears(self?.start_date ?? null, today),
      isNewHire:
        self?.account_status === "approved" && isRecent(self.created_at, NEW_HIRE_DAYS),
      shoutout,
      teamEvents,
    };
  });

/**
 * Day-before birthday reminders. Finds everyone whose birthday is tomorrow
 * and notifies their direct boss (reports_to when set, otherwise their
 * store's managers) plus the regional manager(s) for their store's region.
 * A ledger row per (day, person) makes it safe to run on every page load;
 * the in-process day guard keeps the common case to zero extra queries.
 */
let lastSweepDay: string | null = null;

async function sweepBirthdayEveReminders(): Promise<void> {
  const today = businessToday();
  if (lastSweepDay === today) return;
  lastSweepDay = today;

  const sql = await getSql();
  const tomorrow = nextDay(today);
  const rows = await sql<{
    user_id: string;
    name: string;
    birthday: string | null;
    store_id: string | null;
    reports_to: string | null;
  }>`
    select p.user_id, u.name, p.birthday, p.store_id, p.reports_to
    from user_profiles p
    join "user" u on u.id = p.user_id
    where p.birthday is not null and p.account_status = 'approved'
    limit 1000
  `;
  const celebrants = rows.filter((r) => isBirthdayOn(r.birthday, tomorrow));

  for (const person of celebrants) {
    const claimed = await sql<{ day: string }>`
      insert into birthday_reminder_ledger (day, birthday_user)
      values (${tomorrow}, ${person.user_id})
      on conflict do nothing
      returning day
    `;
    if (!claimed[0]) continue;

    const recipients = new Set<string>();
    if (person.reports_to) recipients.add(person.reports_to);
    if (person.store_id) {
      if (!person.reports_to) {
        const managers = await sql<{ user_id: string }>`
          select user_id from user_profiles
          where store_id = ${person.store_id}
            and access_role = 'managers'
            and account_status = 'approved'
        `;
        for (const m of managers) recipients.add(m.user_id);
      }
      const store = await sql<{ region_id: string | null }>`
        select region_id from stores where id = ${person.store_id} limit 1
      `;
      if (store[0]?.region_id) {
        const regionals = await sql<{ user_id: string }>`
          select user_id from user_profiles
          where access_role = 'regional'
            and region_id = ${store[0].region_id}
            and account_status = 'approved'
        `;
        for (const r of regionals) recipients.add(r.user_id);
      }
    }
    recipients.delete(person.user_id);
    if (recipients.size === 0) continue;

    const { dispatchNotice } = await import("@/lib/notify");
    await dispatchNotice({
      kind: "account",
      title: `🎂 ${person.name}'s birthday is tomorrow`,
      body: `Don't forget to wish ${person.name} a happy birthday!`,
      href: "/directory",
      userIds: [...recipients],
    });
  }
}

/**
 * Is today the signed-in user's birthday? Powers the locker/training
 * takeover, so it stays cheap. It also piggybacks the eve-reminder sweep —
 * this endpoint is hit constantly, which keeps reminders timely without a
 * cron.
 */
export const isMyBirthdayToday = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ birthday: boolean }> => {
    const sql = await getSql();
    const rows = await sql<{ birthday: string | null }>`
      select birthday from user_profiles where user_id = ${context.userId} limit 1
    `;
    try {
      await sweepBirthdayEveReminders();
      const { sweepWeeklyPulse } = await import("@/lib/team-pulse");
      await sweepWeeklyPulse();
    } catch {
      // Reminders and pulses are best-effort; never block the page on them.
    }
    return { birthday: isBirthdayOn(rows[0]?.birthday, businessToday()) };
  });

/**
 * Let a user tell their locker their own birthday (month and day only —
 * no year, so no ages). Editors can still set or fix it from the
 * directory's Place panel; this is just the self-service path the locker
 * nudge uses.
 */
export const setMyBirthday = createServerFn({ method: "POST" })
  .validator((input: { birthday: string }) => {
    const normalized = normalizeMonthDay(typeof input?.birthday === "string" ? input.birthday : "");
    if (!normalized) throw new Error("Month and day, like 04-18.");
    return { birthday: normalized };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into user_profiles (user_id, birthday, created_at)
      values (${context.userId}, ${data.birthday}, now())
      on conflict (user_id) do update set birthday = excluded.birthday
    `;
    return { ok: true };
  });

/** Decorate your own locker: pick an accent and up to three stickers. */
export const setLockerStyle = createServerFn({ method: "POST" })
  .validator((input: { accent: string; stickers: string[] }) => {
    if (!input || !LOCKER_ACCENTS[input.accent]) throw new Error("Pick one of the accent colors.");
    if (!Array.isArray(input.stickers) || input.stickers.length > MAX_STICKERS) {
      throw new Error(`Up to ${MAX_STICKERS} stickers.`);
    }
    const allowed = new Set<string>(LOCKER_STICKERS);
    if (!input.stickers.every((s) => typeof s === "string" && allowed.has(s))) {
      throw new Error("Stickers come from the sticker sheet.");
    }
    return { accent: input.accent, stickers: input.stickers };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into user_profiles (user_id, locker_accent, locker_stickers, created_at)
      values (${context.userId}, ${data.accent}, ${data.stickers.join(" ")}, now())
      on conflict (user_id) do update set
        locker_accent = excluded.locker_accent,
        locker_stickers = excluded.locker_stickers
    `;
    return { ok: true };
  });

/** The most recent shout-out the user has ever received (seen or not). */
export const getLastShoutout = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ fromName: string; body: string } | null> => {
    const sql = await getSql();
    const rows = await sql<{ body: string; name: string }>`
      select s.body, u.name
      from locker_shoutouts s
      join "user" u on u.id = s.from_user
      where s.to_user = ${context.userId}
      order by s.created_at desc
      limit 1
    `;
    return rows[0] ? { fromName: rows[0].name, body: rows[0].body } : null;
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
