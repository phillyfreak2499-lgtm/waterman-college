/**
 * Shared reading of the free-text days-off note ("Sun & Wed", "Tues/Thurs",
 * "Sundays"). One tolerant parser so the directory's "off today" hint and
 * the streak bridge in activity.ts always agree.
 */

/** The company's calendar zone — the one every date feature reckons in. */
export const BUSINESS_TIME_ZONE = "America/Chicago";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The current weekday (0 = Sunday) in the company's zone, not the viewer's. */
export function businessWeekdayNow(now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
  }).format(now);
  const index = WEEKDAY_NAMES.indexOf(name);
  return index >= 0 ? index : now.getDay();
}

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

/** True when the note mentions today's weekday — today in the business zone. */
export function isOffToday(daysOff: string, now: Date = new Date()): boolean {
  return offWeekdays(daysOff).has(businessWeekdayNow(now));
}

/** Weekday (0–6, Sunday first) of a YYYY-MM-DD label, timezone-free. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}
