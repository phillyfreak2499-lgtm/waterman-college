/**
 * Shared reading of the free-text days-off note ("Sun & Wed", "Tues/Thurs",
 * "Sundays"). One tolerant parser so the directory's "off today" hint and
 * the streak bridge in activity.ts always agree.
 */

/** Word patterns for each weekday, indexed by Date#getDay (0 = Sunday). */
const DAY_PATTERNS = [
  /\bsun(day)?s?\b/i,
  /\bmon(day)?s?\b/i,
  /\btue(s|sday)?s?\b/i,
  /\bwed(s|nesday)?s?\b/i,
  /\bthu(r|rs|rsday)?s?\b/i,
  /\bfri(day)?s?\b/i,
  /\bsat(urday)?s?\b/i,
];

/** The weekday numbers (0–6, Sunday first) a days-off note mentions. */
export function offWeekdays(daysOff: string | null | undefined): Set<number> {
  const out = new Set<number>();
  const text = (daysOff ?? "").trim();
  if (!text) return out;
  DAY_PATTERNS.forEach((pattern, weekday) => {
    if (pattern.test(text)) out.add(weekday);
  });
  return out;
}

/** True when the free-text days-off note mentions today's weekday. */
export function isOffToday(daysOff: string, now: Date = new Date()): boolean {
  return offWeekdays(daysOff).has(now.getDay());
}

/** Weekday (0–6, Sunday first) of a YYYY-MM-DD label, timezone-free. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}
