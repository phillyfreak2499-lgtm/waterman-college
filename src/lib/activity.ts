import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

const BUSINESS_TIME_ZONE = "America/Chicago";

/** Today as a YYYY-MM-DD calendar date in the company's zone. */
export function businessToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Step a YYYY-MM-DD label by whole days, treating labels as UTC midnight. */
function addDays(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function dayLabel(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

export type Streak = {
  /** Consecutive active days ending today or yesterday (0 if lapsed). */
  current: number;
  /** Longest run the user has ever had. */
  best: number;
  /** Whether today already counts. */
  todayDone: boolean;
  lastActiveOn: string | null;
};

function computeStreak(days: string[], today: string): Streak {
  const set = new Set(days);
  const yesterday = addDays(today, -1);
  const anchor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;

  let current = 0;
  if (anchor) {
    let cursor = anchor;
    while (set.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of [...set].sort()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }

  return { current, best, todayDone: set.has(today), lastActiveOn: prev };
}

/** Mark the signed-in user active today. Idempotent (once per day per user). */
export const touchActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`
      insert into user_activity_days (user_id, day)
      values (${context.userId}, ${businessToday()})
      on conflict (user_id, day) do nothing
    `;
    return { ok: true };
  });

/** The signed-in user's current + best practice streak. */
export const getMyStreak = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Streak> => {
    const sql = await getSql();
    const rows = await sql<{ day: unknown }>`
      select day from user_activity_days
      where user_id = ${context.userId}
      order by day desc
      limit 400
    `;
    const days = rows.map((r) => dayLabel(r.day)).filter(Boolean);
    return computeStreak(days, businessToday());
  });
