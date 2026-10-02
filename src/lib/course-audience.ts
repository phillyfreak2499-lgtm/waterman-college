/**
 * Course audience, format, and category rules — the single source of truth.
 *
 * Every place that decides whether a person sees a course calls `canSeeTrack`,
 * and every path tab asks `onPathTab`. Nothing outside this file should read a
 * course's home `role` to decide visibility; `role` only drives sort order and
 * the Blue/Burgundy series label.
 *
 * Pure module: no server imports, safe on the client and the server.
 */
import { isRoleId, type RoleId, type Track } from "@/lib/content";

export const COURSE_FORMATS = [
  {
    id: "mastery",
    label: "Mastery",
    test: "A 5-part COGS class where video carries the teaching.",
  },
  {
    id: "read-respond",
    label: "Read & Respond",
    test: "Text lessons that end in a takeaway, a quiz, or a written response.",
  },
  {
    id: "audio",
    label: "Audio",
    test: "Audio is the main content, with a short transcript under the player.",
  },
] as const;

export type CourseFormat = (typeof COURSE_FORMATS)[number]["id"];

export const DEFAULT_FORMAT: CourseFormat = "read-respond";

export function isCourseFormat(value: unknown): value is CourseFormat {
  return typeof value === "string" && COURSE_FORMATS.some((f) => f.id === value);
}

export function formatLabel(format: CourseFormat | undefined) {
  return COURSE_FORMATS.find((f) => f.id === format)?.label ?? "Read & Respond";
}

/** Sort rank within a path: Mastery, then Read & Respond, then Audio. */
export function formatRank(format: CourseFormat | undefined) {
  const index = COURSE_FORMATS.findIndex((f) => f.id === format);
  return index < 0 ? 1 : index;
}

export type CourseCategory = { id: string; label: string; sortOrder: number };

type AudienceShape = Pick<Track, "role" | "visibleToAll" | "audienceRoles">;

/**
 * The paths a course is aimed at, not counting Everyone. A course with no
 * stored audience falls back to its home path, so a row written before the
 * audience column existed keeps its old visibility.
 */
export function audiencePaths(track: AudienceShape): RoleId[] {
  const stored = (track.audienceRoles ?? []).filter(isRoleId);
  if (stored.length) return [...new Set(stored)];
  return isRoleId(track.role) ? [track.role] : [];
}

/** True when the course is aimed at this path (Everyone excluded). */
export function inAudience(track: AudienceShape, path: RoleId) {
  return audiencePaths(track).includes(path);
}

/** True when the course belongs on this path's tab: in its audience, or Everyone. */
export function onPathTab(track: AudienceShape, path: RoleId) {
  return track.visibleToAll === true || inAudience(track, path);
}

/**
 * The visibility rule. A person sees a course when any one is true:
 *   1. the course is set to Everyone;
 *   2. one of the person's paths is in the course's audience;
 *   3. the course is assigned to that person.
 */
export function canSeeTrack(
  track: AudienceShape & { id: string },
  paths: readonly RoleId[],
  assignedTrackIds: Iterable<string> = [],
) {
  if (track.visibleToAll === true) return true;
  const audience = audiencePaths(track);
  if (paths.some((path) => audience.includes(path))) return true;
  const assigned = assignedTrackIds instanceof Set ? assignedTrackIds : new Set(assignedTrackIds);
  return assigned.has(track.id);
}

/** Human label for a course's audience, e.g. "Everyone" or "Specialists · Managers". */
export function audienceLabel(track: AudienceShape, labels: Partial<Record<RoleId, string>>) {
  if (track.visibleToAll) return "Everyone";
  return audiencePaths(track)
    .map((path) => labels[path] ?? path)
    .join(" · ");
}

/**
 * Normalise an audience from an editor or import: known paths only, no
 * duplicates, at least one path or Everyone, and a home path that is in the
 * audience (otherwise the first audience path).
 */
export function normaliseAudience(input: {
  role: unknown;
  visibleToAll?: unknown;
  audienceRoles?: unknown;
}): { role: RoleId; visibleToAll: boolean; audienceRoles: RoleId[] } {
  const visibleToAll = input.visibleToAll === true;
  const raw = Array.isArray(input.audienceRoles) ? input.audienceRoles : [];
  if (raw.some((value) => !isRoleId(value))) throw new Error("Choose a valid training path.");
  const audienceRoles = [...new Set(raw as RoleId[])];
  if (!visibleToAll && !audienceRoles.length) {
    throw new Error("Choose at least one path, or Everyone.");
  }
  let role: RoleId = isRoleId(input.role) ? input.role : "specialist";
  if (audienceRoles.length && !audienceRoles.includes(role)) role = audienceRoles[0];
  return { role, visibleToAll, audienceRoles };
}

/** Lower-cased text a course is searched by: title, summary, categories, lesson titles. */
export function searchText(track: Track, categories: readonly CourseCategory[]) {
  const labels = (track.categoryIds ?? [])
    .map((id) => categories.find((c) => c.id === id)?.label ?? "")
    .filter(Boolean);
  return [track.title, track.summary, ...labels, ...track.lessons.map((l) => l.title)]
    .join("\n")
    .toLowerCase();
}
