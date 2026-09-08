import { z } from "zod";
import type { DeckSlide } from "@/lib/decks";

/**
 * Validation for author-built slide decks.
 *
 * Slides are stored on `cms_lessons.slides` as a JSON string (see migration
 * 0023). This schema mirrors the `SlideBlock` / `DeckSlide` unions in
 * `@/lib/decks` so the server can reject malformed decks and the editor can
 * lint them before save. Kept in its own module so both the server (cms.ts) and
 * the client (slide editor) import the same rules. Bounds are generous but
 * finite so a single lesson can't store an unbounded blob.
 */

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();

const listTone = z.enum(["do", "never", "green", "red", "plain"]);

const slideBlockSchema = z.union([
  z.object({ kind: z.literal("p"), text: nonEmpty(2000) }),
  z.object({ kind: z.literal("quote"), text: nonEmpty(2000) }),
  z.object({ kind: z.literal("say"), label: optionalText(120), text: nonEmpty(2000) }),
  z.object({
    kind: z.literal("list"),
    title: optionalText(200),
    items: z.array(nonEmpty(500)).min(1).max(24),
    tone: listTone.optional(),
  }),
  z.object({
    kind: z.literal("steps"),
    items: z
      .array(z.object({ n: optionalText(8), title: nonEmpty(200), body: nonEmpty(1000) }))
      .min(1)
      .max(20),
  }),
  z.object({
    kind: z.literal("cards"),
    items: z
      .array(z.object({ letter: nonEmpty(8), title: nonEmpty(200), body: nonEmpty(1000) }))
      .min(1)
      .max(20),
  }),
  z.object({
    kind: z.literal("pair"),
    left: z.object({ title: nonEmpty(200), body: nonEmpty(1000) }),
    right: z.object({ title: nonEmpty(200), body: nonEmpty(1000) }),
  }),
  z.object({
    kind: z.literal("image"),
    // Same-origin media/static paths only — never an off-site or javascript: URL.
    src: z
      .string()
      .trim()
      .max(500)
      .regex(/^\/(media|api\/media|game|slides)\/[a-z0-9/_.-]+$/i, "Use an uploaded image path"),
    alt: nonEmpty(300),
    caption: optionalText(300),
  }),
]);

export const slideSchema = z.object({
  n: z.number().int().min(1).max(200),
  kicker: optionalText(120),
  title: nonEmpty(240),
  subtitle: optionalText(300),
  blocks: z.array(slideBlockSchema).min(1).max(20),
});

export const slidesSchema = z.array(slideSchema).max(60);

/**
 * Parse + validate a slides payload (JSON string or array). Returns clean,
 * renumbered slides, or null when there are no valid slides (so the reader can
 * fall back to a static deck). Throws on non-empty-but-invalid input so a save
 * surfaces the problem instead of silently dropping content.
 */
export function parseSlides(input: unknown, { strict = true } = {}): DeckSlide[] | null {
  let value = input;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      value = JSON.parse(trimmed);
    } catch {
      if (strict) throw new Error("Slides are not valid JSON.");
      return null;
    }
  }
  if (value == null) return null;
  if (!Array.isArray(value) || value.length === 0) return null;
  const result = slidesSchema.safeParse(value);
  if (!result.success) {
    if (strict) throw new Error("A slide is missing a title or has an empty block.");
    return null;
  }
  // Renumber sequentially so `n` is always authoritative for the carousel.
  return result.data.map((slide, index) => ({ ...slide, n: index + 1 })) as DeckSlide[];
}
