import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { BUSINESS_TIME_ZONE, offWeekdays, weekdayOf } from "@/lib/days-off";
import { getSql } from "@/lib/db";

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

/**
 * Streaks respect regular days off: a gap made only of the user's scheduled
 * off-days (from their directory days-off note) neither breaks nor grows a
 * run. Off Sun & Wed, active Sat, back Monday → still one streak. `offDays`
 * holds weekday numbers (0 = Sunday); empty means the strict original rules.
 */
export function computeStreak(days: string[], today: string, offDays?: Set<number>): Streak {
  const set = new Set(days);
  const off = offDays ?? new Set<number>();
  // Someone whose note matches every weekday would bridge forever — that is
  // a data problem, not a real schedule, so fall back to strict streaks.
  const bridge = (day: string) => off.size < 7 && off.has(weekdayOf(day));

  // Walk back from today: active days count, the user's off-days bridge,
  // and today itself gets grace (the day isn't over). Anything else — a
  // skipped working day — ends the run, same as before.
  let current = 0;
  let cursor = today;
  for (let guard = 0; guard < 800; guard++) {
    if (set.has(cursor)) current += 1;
    else if (cursor !== today && !bridge(cursor)) break;
    cursor = addDays(cursor, -1);
  }

  // Best run, with the same bridging between consecutive active days.
  const sorted = [...set].sort();
  const connected = (prev: string, day: string): boolean => {
    let step = addDays(prev, 1);
    for (let guard = 0; guard < 8; guard++) {
      if (step === day) return true;
      if (!bridge(step)) return false;
      step = addDays(step, 1);
    }
    return false;
  };
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && connected(prev, day) ? run + 1 : 1;
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
    const profile = await sql<{ days_off: string | null }>`
      select days_off from user_profiles where user_id = ${context.userId} limit 1
    `;
    const days = rows.map((r) => dayLabel(r.day)).filter(Boolean);
    return computeStreak(days, businessToday(), offWeekdays(profile[0]?.days_off));
  });
