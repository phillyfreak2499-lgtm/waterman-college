/**
 * Lesson line tags — the single source of truth.
 *
 * Lesson bodies carry tagged lines — `GFA · …`, `ROLEPLAY · …`, `VIDEO · …` —
 * that render as a small brass label and can be turned into a real link by the
 * training office. Historically two separate lists existed (one in the lesson
 * route for rendering, one in lesson-links.ts for linking) and they drifted
 * apart. Everything now imports this list so an authored tag both renders AND
 * can carry a link.
 *
 * Pure module: no server imports, safe on the client and the server.
 *
 * Order matters — `tagOfLine` matches with `startsWith`, so no tag may be a
 * prefix of another (they are not today).
 */
export const LESSON_TAGS = [
  "VIDEO",
  "GFA",
  "PRACTICE",
  "ROLEPLAY",
  "FORM",
  "SOLUTION",
  "INTERVIEW",
  "ANALYSIS",
  "FITTING",
  "WELCOME",
  "NEW HIRE ONBOARDING",
] as const;

export type LessonTag = (typeof LESSON_TAGS)[number];

/** Human hint shown in the builder for what each tag is for. */
export const LESSON_TAG_HINTS: Record<LessonTag, string> = {
  VIDEO: "A video to watch. Attach the link in the builder.",
  GFA: "Guided Field Activity — something to do on the floor.",
  PRACTICE: "A practice rep the learner runs before moving on.",
  ROLEPLAY: "A roleplay scenario, usually with a partner.",
  FORM: "A form to open and fill out.",
  SOLUTION: "A worked solution or answer key.",
  INTERVIEW: "Interview-phase drill (presentation eval).",
  ANALYSIS: "Analysis-phase drill (presentation eval).",
  FITTING: "Fitting-phase drill (presentation eval).",
  WELCOME: "Welcome-phase drill (presentation eval).",
  "NEW HIRE ONBOARDING": "An onboarding step for new hires.",
};

/** The tag at the start of a lesson line, or null when it carries none. */
export function tagOfLine(text: string): LessonTag | null {
  return (
    LESSON_TAGS.find(
      (tag) => text.startsWith(`${tag} · `) || text.startsWith(`${tag} `),
    ) ?? null
  );
}

/** The text of a tagged line with its tag prefix stripped. */
export function lineTextAfterTag(text: string): string {
  const tag = tagOfLine(text);
  if (!tag) return text;
  return text.startsWith(`${tag} · `)
    ? text.slice(tag.length + 3)
    : text.slice(tag.length + 1);
}

/**
 * Stable identifier for a tagged line within a lesson.
 *
 * Deliberately NOT the line's index: paragraphs get reordered and inserted by
 * the builder, and an index-keyed link would silently re-attach to a different
 * line. Derived from the tag plus the first few normalised words, so light copy
 * edits later in the sentence keep the link attached.
 */
export function lessonLineKey(text: string): string | null {
  const tag = tagOfLine(text);
  if (!tag) return null;
  const words = lineTextAfterTag(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join("-");
  return `${tag.toLowerCase().replace(/\s+/g, "-")}:${words}`.slice(0, 160);
}
