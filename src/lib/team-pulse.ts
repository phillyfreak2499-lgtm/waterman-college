import { businessToday, computeStreak } from "@/lib/activity";
import { readCatalog } from "@/lib/cms";
import { normalizeMonthDay } from "@/lib/locker-daily";
import { offWeekdays, weekdayOf } from "@/lib/days-off";
import { getSql } from "@/lib/db";
import { dispatchNotice } from "@/lib/notify";
import type { ProgressRow } from "@/lib/progress";
import { trackStats } from "@/lib/progress-stats";

/**
 * The Monday team pulse: one notification per store manager (and a rollup
 * per regional manager) at the start of the week — lessons finished, overdue
 * assignments, streaks that went quiet, and birthdays coming up. Everything
 * a leader wants in hand before the huddle, from data the college already
 * tracks. Piggybacked on a hot endpoint like the birthday sweep; the
 * weekly_pulse_ledger keeps it to exactly one send per leader per week.
 */

type StoreSummary = {
  storeId: string;
  storeName: string;
  regionId: string | null;
  finishedTotal: number;
  topFinishers: { name: string; n: number }[];
  overdue: { name: string; track: string }[];
  lapsed: { name: string; run: number }[];
  birthdays: { name: string; monthDay: string }[];
};

function addDays(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function dayLabel(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return "";
}

/** MM-DD values for today through six days out — a Monday pulse's "this week". */
function upcomingMonthDays(today: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i <= 6; i++) out.add(addDays(today, i).slice(5));
  return out;
}

async function buildStoreSummaries(today: string): Promise<StoreSummary[]> {
  const sql = await getSql();
  const catalog = await readCatalog();

  const stores = await sql<{ id: string; name: string; region_id: string | null }>`
    select id, name, region_id from stores limit 500
  `;
  const people = await sql<{
    user_id: string;
    name: string;
    store_id: string | null;
    days_off: string | null;
    birthday: string | null;
  }>`
    select p.user_id, u.name, p.store_id, p.days_off, p.birthday
    from user_profiles p
    join "user" u on u.id = p.user_id
    where p.account_status = 'approved' and p.store_id is not null
    limit 2000
  `;

  const finished = await sql<{ user_id: string; n: number }>`
    select user_id, count(*)::int as n
    from lesson_progress
    where completed_at > now() - interval '7 days'
    group by user_id
  `;
  const finishedByUser = new Map(finished.map((r) => [r.user_id, r.n]));

  const pastDue = await sql<{ user_id: string; track_id: string; due_on: string | null }>`
    select user_id, track_id, due_on from training_assignments
    where due_on is not null and due_on < ${today}
    limit 5000
  `;

  const progress = await sql<{ user_id: string; lesson_key: string; completed_at: unknown }>`
    select lp.user_id, lp.lesson_key, lp.completed_at
    from lesson_progress lp
    join user_profiles p on p.user_id = lp.user_id
    where p.account_status = 'approved' and p.store_id is not null
    limit 50000
  `;
  const progressByUser = new Map<string, ProgressRow[]>();
  for (const row of progress) {
    const list = progressByUser.get(row.user_id) ?? [];
    list.push({
      lessonKey: row.lesson_key,
      startedAt: "",
      lastViewedAt: "",
      completedAt: row.completed_at ? iso(row.completed_at) : null,
    });
    progressByUser.set(row.user_id, list);
  }

  const activity = await sql<{ user_id: string; day: unknown }>`
    select a.user_id, a.day
    from user_activity_days a
    join user_profiles p on p.user_id = a.user_id
    where a.day >= ${addDays(today, -21)}::date and p.account_status = 'approved'
  `;
  const activityByUser = new Map<string, string[]>();
  for (const row of activity) {
    const list = activityByUser.get(row.user_id) ?? [];
    list.push(dayLabel(row.day));
    activityByUser.set(row.user_id, list);
  }

  const weekAhead = upcomingMonthDays(today);

  return stores.map((store) => {
    const crew = people.filter((p) => p.store_id === store.id);

    const finishers = crew
      .map((p) => ({ name: p.name.split(" ")[0], n: finishedByUser.get(p.user_id) ?? 0 }))
      .filter((f) => f.n > 0)
      .sort((a, b) => b.n - a.n);

    const overdue: StoreSummary["overdue"] = [];
    for (const row of pastDue) {
      const person = crew.find((p) => p.user_id === row.user_id);
      const track = catalog.tracks.find((t) => t.id === row.track_id);
      if (!person || !track) continue;
      const stats = trackStats(progressByUser.get(row.user_id) ?? [], track);
      if (stats.total > 0 && stats.done >= stats.total) continue;
      overdue.push({ name: person.name.split(" ")[0], track: track.title });
    }

    // A streak "went quiet" when someone active 3+ days stopped 2–5 days
    // ago — with at least one of those silent days being a working day for
    // them, so a Sun/Mon off-schedule doesn't get flagged Monday. The run
    // length uses the same off-day-bridged computeStreak the locker shows,
    // anchored at their last active day.
    const lapsed: StoreSummary["lapsed"] = [];
    for (const p of crew) {
      const days = (activityByUser.get(p.user_id) ?? []).sort();
      const last = days[days.length - 1];
      if (!last || last >= addDays(today, -1) || last < addDays(today, -5)) continue;
      const off = offWeekdays(p.days_off);
      let hasWorkGap = false;
      for (let d = addDays(last, 1); d < today; d = addDays(d, 1)) {
        if (off.size >= 7 || !off.has(weekdayOf(d))) hasWorkGap = true;
      }
      if (!hasWorkGap) continue;
      const run = computeStreak(days, last, off).current;
      if (run >= 3) lapsed.push({ name: p.name.split(" ")[0], run });
    }

    const birthdays = crew
      .map((p) => ({ name: p.name.split(" ")[0], monthDay: normalizeMonthDay(p.birthday) ?? "" }))
      .filter((b) => b.monthDay && weekAhead.has(b.monthDay));

    return {
      storeId: store.id,
      storeName: store.name,
      regionId: store.region_id || null,
      finishedTotal: finishers.reduce((sum, f) => sum + f.n, 0),
      topFinishers: finishers.slice(0, 3),
      overdue: overdue.slice(0, 4),
      lapsed: lapsed.slice(0, 3),
      birthdays: birthdays.slice(0, 4),
    };
  });
}

function storeBody(s: StoreSummary): string {
  const parts: string[] = [];
  parts.push(
    s.finishedTotal > 0
      ? `${s.finishedTotal} lesson${s.finishedTotal === 1 ? "" : "s"} finished last week (${s.topFinishers.map((f) => `${f.name} ${f.n}`).join(", ")}).`
      : "No lessons finished last week.",
  );
  if (s.overdue.length) {
    parts.push(`Overdue: ${s.overdue.map((o) => `${o.name} — ${o.track}`).join("; ")}.`);
  }
  if (s.lapsed.length) {
    parts.push(
      `Streak watch: ${s.lapsed.map((l) => `${l.name}'s ${l.run}-day run went quiet`).join("; ")}.`,
    );
  }
  if (s.birthdays.length) {
    parts.push(`🎂 This week: ${s.birthdays.map((b) => `${b.name} (${b.monthDay})`).join(", ")}.`);
  }
  if (parts.length === 1 && s.finishedTotal === 0) {
    parts.push("Quiet week — a good huddle can change that.");
  }
  return parts.join(" ");
}

function regionBody(summaries: StoreSummary[]): string {
  const finished = summaries.reduce((sum, s) => sum + s.finishedTotal, 0);
  const overdue = summaries.reduce((sum, s) => sum + s.overdue.length, 0);
  const birthdays = summaries.flatMap((s) => s.birthdays.map((b) => `${b.name} (${b.monthDay})`));
  const parts = [
    `Across ${summaries.length} store${summaries.length === 1 ? "" : "s"}: ${finished} lesson${finished === 1 ? "" : "s"} finished last week, ${overdue} overdue assignment${overdue === 1 ? "" : "s"}.`,
  ];
  if (birthdays.length) parts.push(`🎂 This week: ${birthdays.slice(0, 6).join(", ")}.`);
  return parts.join(" ");
}

let lastPulseWeek: string | null = null;

/** Send Monday pulses that haven't gone out this week. Cheap when done. */
export async function sweepWeeklyPulse(): Promise<void> {
  const today = businessToday();
  if (weekdayOf(today) !== 1) return; // Mondays only
  if (lastPulseWeek === today) return;
  lastPulseWeek = today;

  const sql = await getSql();
  const leaders = await sql<{
    user_id: string;
    access_role: string;
    store_id: string | null;
    region_id: string | null;
  }>`
    select user_id, access_role, store_id, region_id
    from user_profiles
    where access_role in ('managers', 'regional') and account_status = 'approved'
    limit 500
  `;
  if (!leaders.length) return;

  // Per-leader isolation: one failed send releases its ledger claim and the
  // loop moves on, so a hiccup never drops the remaining leaders' pulses.
  let summaries: StoreSummary[] | null = null;
  for (const leader of leaders) {
    let claimedHere = false;
    try {
      const claimed = await sql<{ week: string }>`
        insert into weekly_pulse_ledger (week, user_id)
        values (${today}, ${leader.user_id})
        on conflict do nothing
        returning week
      `;
      if (!claimed[0]) continue;
      claimedHere = true;
      summaries ??= await buildStoreSummaries(today);

      if (leader.access_role === "managers" && leader.store_id) {
        const summary = summaries.find((s) => s.storeId === leader.store_id);
        if (!summary) continue;
        await dispatchNotice({
          kind: "training",
          title: `Monday team pulse — ${summary.storeName}`,
          body: storeBody(summary),
          href: "/team",
          userIds: [leader.user_id],
        });
      } else if (leader.access_role === "regional" && leader.region_id) {
        const regionStores = summaries.filter((s) => s.regionId === leader.region_id);
        if (!regionStores.length) continue;
        await dispatchNotice({
          kind: "training",
          title: "Monday team pulse — your region",
          body: regionBody(regionStores),
          href: "/team",
          userIds: [leader.user_id],
        });
      }
    } catch {
      if (claimedHere) {
        try {
          await sql`
            delete from weekly_pulse_ledger
            where week = ${today} and user_id = ${leader.user_id}
          `;
        } catch {
          // Claim stays; worst case this one pulse is lost, not the sweep.
        }
      }
    }
  }
}
