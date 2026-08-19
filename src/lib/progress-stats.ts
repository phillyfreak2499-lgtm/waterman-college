import {
  roles,
  tracks as defaultTracks,
  type RoleId,
  type Track,
} from "@/lib/content";
import { dayFromSlug, weekOfDay } from "@/lib/onboarding";
import type { ProgressRow } from "@/lib/progress";

export type LessonStatus = "not-started" | "in-progress" | "completed";

export type ContinueTarget = {
  trackId: string;
  lessonSlug: string;
  title: string;
  trackTitle: string;
  role: RoleId;
};

export function lessonKey(trackId: string, slug: string) {
  return `${trackId}/${slug}`;
}

export function rowFor(rows: ProgressRow[], key: string) {
  return rows.find((r) => r.lessonKey === key);
}

export function lessonStatus(rows: ProgressRow[], key: string): LessonStatus {
  const row = rowFor(rows, key);
  if (!row) return "not-started";
  return row.completedAt ? "completed" : "in-progress";
}

export function completedKeys(rows: ProgressRow[]) {
  return new Set(rows.filter((r) => r.completedAt).map((r) => r.lessonKey));
}

export function trackStats(rows: ProgressRow[], track: Track) {
  const doneKeys = completedKeys(rows);
  const rowByKey = new Map(rows.map((row) => [row.lessonKey, row]));
  const total = track.lessons.length;
  let done = 0;
  let started = 0;
  let minutesLeft = 0;
  for (const lesson of track.lessons) {
    const key = lessonKey(track.id, lesson.slug);
    if (doneKeys.has(key)) done += 1;
    else {
      minutesLeft += lesson.minutes;
      if (rowByKey.has(key)) started += 1;
    }
  }
  return { total, done, started, minutesLeft, pct: total ? (done / total) * 100 : 0 };
}

export function roleStats(rows: ProgressRow[], role: RoleId, list: Track[] = defaultTracks) {
  const filtered = list.filter((t) => t.role === role);
  const stats = filtered.map((track) => trackStats(rows, track));
  const total = filtered.reduce((n, t) => n + t.lessons.length, 0);
  const done = stats.reduce((n, item) => n + item.done, 0);
  const minutesLeft = stats.reduce((n, item) => n + item.minutesLeft, 0);
  return { total, done, minutesLeft, pct: total ? (done / total) * 100 : 0 };
}

export function overallStats(rows: ProgressRow[], list: Track[] = defaultTracks) {
  const doneKeys = completedKeys(rows);
  const stats = list.map((track) => trackStats(rows, track));
  const total = list.reduce((n, t) => n + t.lessons.length, 0);
  const done = stats.reduce((n, item) => n + item.done, 0);
  const minutesLeft = stats.reduce((n, item) => n + item.minutesLeft, 0);
  const minutesDone = list.reduce((n, t) => {
    return (
      n +
      t.lessons
        .filter((l) => doneKeys.has(lessonKey(t.id, l.slug)))
        .reduce((s, l) => s + l.minutes, 0)
    );
  }, 0);
  return { total, done, minutesLeft, minutesDone, pct: total ? (done / total) * 100 : 0 };
}

export function roleCounts(rows: ProgressRow[], list: Track[] = defaultTracks) {
  return Object.fromEntries(roles.map((r) => [r.id, roleStats(rows, r.id, list)])) as Record<
    RoleId,
    ReturnType<typeof roleStats>
  >;
}

export function formatMinutes(n: number) {
  if (n <= 0) return "0 min";
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export type Ledger = {
  week: number;
  day: number;
  left: number;
  total: number;
  done: number;
  line: string;
  weeks: number;
};

export function ledgerProgress(rows: ProgressRow[], list: Track[] = defaultTracks): Ledger {
  const lessons = list
    .filter((track) => Array.isArray(track.lessons) && track.lessons.length)
    .flatMap((track) => track.lessons.map((lesson) => ({ track, lesson })));
  const doneSet = completedKeys(rows);
  const remaining = lessons.filter((item) => !doneSet.has(lessonKey(item.track.id, item.lesson.slug)));
  const current = remaining[0] ?? lessons[lessons.length - 1];
  if (!current) {
    return { week: 0, day: 0, left: 0, total: 0, done: 0, line: "No lessons on your path.", weeks: 0 };
  }
  const index = lessons.findIndex(
    (item) => item.track.id === current.track.id && item.lesson.slug === current.lesson.slug,
  );
  const fromSlug = dayFromSlug(current.lesson.slug);
  const day = fromSlug ?? index + 1;
  const week = fromSlug ? weekOfDay(fromSlug) : 0;
  const left = remaining.length;
  const done = lessons.length - left;
  const weeks = fromSlug ? Math.max(week, Math.ceil(lessons.length / 5)) : 0;
  return {
    week,
    day,
    left,
    total: lessons.length,
    done,
    weeks,
    line:
      left === 0
        ? "The ledger is closed. Every lesson on your path is done."
        : fromSlug
          ? `Week ${week} · Day ${day} · ${left} lesson${left === 1 ? "" : "s"} left`
          : `${current.track.title} · ${left} lesson${left === 1 ? "" : "s"} left`,
  };
}

export function continueLesson(
  rows: ProgressRow[],
  preferredRole?: RoleId,
  list: Track[] = defaultTracks,
): ContinueTarget | null {
  const done = completedKeys(rows);
  const ordered = [...rows].sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt));
  const findTrack = (id: string) => list.find((t) => t.id === id);

  const asTarget = (key: string): ContinueTarget | null => {
    const slash = key.indexOf("/");
    if (slash < 0) return null;
    const trackId = key.slice(0, slash);
    const lessonSlug = key.slice(slash + 1);
    const track = findTrack(trackId);
    const lesson = track?.lessons.find((l) => l.slug === lessonSlug);
    if (!track || !lesson) return null;
    return {
      trackId: track.id,
      lessonSlug: lesson.slug,
      title: lesson.title,
      trackTitle: track.title,
      role: track.role,
    };
  };

  const last = ordered[0];
  if (last && !last.completedAt) {
    const target = asTarget(last.lessonKey);
    if (target) return target;
  }

  if (last) {
    const slash = last.lessonKey.indexOf("/");
    const track = slash < 0 ? undefined : findTrack(last.lessonKey.slice(0, slash));
    if (track) {
      const next = track.lessons.find((l) => !done.has(lessonKey(track.id, l.slug)));
      if (next) return asTarget(lessonKey(track.id, next.slug));
    }
  }

  const pool = preferredRole
    ? [...list.filter((t) => t.role === preferredRole), ...list.filter((t) => t.role !== preferredRole)]
    : list;

  for (const track of pool) {
    const next = track.lessons.find((l) => !done.has(lessonKey(track.id, l.slug)));
    if (next) return asTarget(lessonKey(track.id, next.slug));
  }
  return null;
}
