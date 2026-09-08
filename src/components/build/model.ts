import { LESSON_TAGS, lineTextAfterTag, tagOfLine, type LessonTag } from "@/lib/lesson-tags";
import type { BuildLesson, BuildTrack } from "@/lib/cms";
import type { DeckSlide } from "@/lib/decks";

/**
 * Pure builder logic shared by the block palette, live preview, and lint:
 * turning a lesson body blob into editable blocks and back, without ever
 * changing the on-the-wire format (paragraphs joined by blank lines, tagged
 * lines as `TAG · text`).
 */

export type BodyBlock = { id: string; tag: LessonTag | null; text: string };

let blockCounter = 0;
function nextId() {
  blockCounter += 1;
  return `b${blockCounter}`;
}

/** Split a stored body blob into editable blocks. */
export function parseBody(body: string): BodyBlock[] {
  const paragraphs = String(body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((paragraph) => {
    const tag = tagOfLine(paragraph);
    return { id: nextId(), tag, text: tag ? lineTextAfterTag(paragraph) : paragraph };
  });
}

/** Render one block back to its canonical line. */
export function blockToLine(block: BodyBlock): string {
  const text = block.text.trim();
  return block.tag ? `${block.tag} · ${text}` : text;
}

/** Join blocks back into the stored body blob. Drops empty blocks. */
export function serializeBody(blocks: BodyBlock[]): string {
  return blocks
    .map(blockToLine)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function emptyBlock(tag: LessonTag | null = null): BodyBlock {
  return { id: nextId(), tag, text: "" };
}

export const BODY_TAG_OPTIONS = LESSON_TAGS;

// ── Lint ────────────────────────────────────────────────────────────────────

export type LintLevel = "warn" | "info";
export type LintIssue = { level: LintLevel; where: string; message: string };

/**
 * Pre-flight checks over a whole course. Warnings are the things that make a
 * course feel unfinished; info items are gentle nudges. Nothing here blocks a
 * save — it is a checklist, not a gate.
 */
export function lintTrack(
  track: Pick<BuildTrack, "title" | "summary" | "lessons">,
  links?: { lineKey: string }[],
): LintIssue[] {
  const issues: LintIssue[] = [];
  if (!track.title.trim()) issues.push({ level: "warn", where: "Course", message: "The course has no title." });
  if (!track.summary.trim())
    issues.push({ level: "info", where: "Course", message: "Add a one-sentence summary — it's the first thing a learner reads." });
  if (track.lessons.length === 0)
    issues.push({ level: "warn", where: "Course", message: "The course has no lessons yet." });

  const seenSlugs = new Set<string>();
  // Only check link attachment when the caller actually loaded links (the
  // lesson editor does); otherwise skip so we don't falsely flag every line.
  const linkedKeys = links ? new Set(links.map((l) => l.lineKey)) : undefined;
  for (const lesson of track.lessons) {
    const where = lesson.title || lesson.slug || "Untitled lesson";
    if (seenSlugs.has(lesson.slug))
      issues.push({ level: "warn", where, message: `Two lessons share the slug "${lesson.slug}".` });
    seenSlugs.add(lesson.slug);
    issues.push(...lintLesson(lesson, where, linkedKeys));
  }
  return issues;
}

export function lintLesson(
  lesson: Pick<BuildLesson, "body" | "takeaway" | "slides">,
  where: string,
  linkedKeys?: Set<string>,
): LintIssue[] {
  const issues: LintIssue[] = [];
  const blocks = parseBody(lesson.body);
  if (blocks.length === 0)
    issues.push({ level: "warn", where, message: "The lesson body is empty." });
  if (!lesson.takeaway.trim())
    issues.push({ level: "info", where, message: "No takeaway — give the learner one sentence to carry." });
  for (const block of blocks) {
    if (block.tag && !block.text.trim())
      issues.push({ level: "warn", where, message: `A ${block.tag} line has no text.` });
    if (block.tag && linkedKeys) {
      const key = lessonLineKeyForBlock(block);
      if (key && !linkedKeys.has(key))
        issues.push({ level: "info", where, message: `The ${block.tag} line "${truncate(block.text)}" has no link attached.` });
    }
  }
  issues.push(...lintSlides(lesson.slides, where));
  return issues;
}

function lintSlides(slides: DeckSlide[] | null | undefined, where: string): LintIssue[] {
  if (!slides || slides.length === 0) return [];
  const issues: LintIssue[] = [];
  slides.forEach((slide, i) => {
    if (!slide.title.trim())
      issues.push({ level: "warn", where, message: `Slide ${i + 1} has no title.` });
    if (!slide.blocks || slide.blocks.length === 0)
      issues.push({ level: "warn", where, message: `Slide ${i + 1} has no content.` });
  });
  return issues;
}

function lessonLineKeyForBlock(block: BodyBlock): string | null {
  // Mirror lessonLineKey against the canonical line so lint agrees with links.
  const line = blockToLine(block);
  if (!tagOfLine(line)) return null;
  const words = lineTextAfterTag(line)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join("-");
  const tag = tagOfLine(line)!;
  return `${tag.toLowerCase().replace(/\s+/g, "-")}:${words}`.slice(0, 160);
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ── Templates ─────────────────────────────────────────────────────────────

export type LessonTemplate = {
  title: string;
  minutes: number;
  kicker: string;
  body: string;
  takeaway: string;
};

export type CourseTemplate = {
  id: string;
  name: string;
  blurb: string;
  lessons: LessonTemplate[];
};

/** Starter scaffolds so a course never begins from a blank page. */
export const COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: "concept-practice-roleplay",
    name: "Concept → Practice → Roleplay",
    blurb: "The house shape: teach the idea, rep it, then run it live with a partner.",
    lessons: [
      {
        title: "The concept",
        minutes: 8,
        kicker: "Understand",
        body:
          "Open with the situation the learner is actually in.\n\nGive them the one move that changes it, in plain language.\n\nGFA · Watch for this on the floor today and note one example.",
        takeaway: "State the single idea as one sayable sentence.",
      },
      {
        title: "Practice the move",
        minutes: 10,
        kicker: "Rep it",
        body:
          "Walk the move step by step.\n\nPRACTICE · Run the move three times before your next Client.",
        takeaway: "Reps beat notes. Do it before you need it.",
      },
      {
        title: "Roleplay it live",
        minutes: 12,
        kicker: "Apply",
        body:
          "Set the scene and the roles.\n\nROLEPLAY · Partner up: one Specialist, one Client. Swap after five minutes.\n\nSOLUTION · What a strong version sounds like.",
        takeaway: "If you can do it in a roleplay, you can do it in the chair.",
      },
    ],
  },
  {
    id: "single-lesson",
    name: "Single focused lesson",
    blurb: "One tight lesson with a takeaway — good for a quick standard or reminder.",
    lessons: [
      {
        title: "New lesson",
        minutes: 6,
        kicker: "",
        body: "Write the lesson here. One idea per paragraph, a blank line between them.",
        takeaway: "The one sentence to carry onto the floor.",
      },
    ],
  },
];
