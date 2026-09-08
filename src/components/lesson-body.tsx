import { ExternalLink } from "lucide-react";
import { lessonLineKey, tagOfLine } from "@/lib/lesson-tags";
import { RichText } from "@/components/rich-text";
import { parseVideoEmbed } from "@/lib/video-embed";

/**
 * Shared lesson-body rendering.
 *
 * Used by the learner lesson page (`training/$track_.$lesson.tsx`) and the
 * builder's live preview so the author sees exactly what a Specialist sees. A
 * lesson body is an array of paragraph strings:
 *  - a paragraph beginning with a recognised `TAG · …` / `TAG …` prefix renders
 *    the tag as a small brass label; a `VIDEO ·` line whose attached link is a
 *    YouTube/Vimeo URL embeds an in-page player, otherwise it is an external
 *    link, and every other tag renders its (optional) link as before;
 *  - any other paragraph is rendered as a safe Markdown subset (headings, bold,
 *    italics, lists, inline images, links) via <RichText>.
 */

export function LessonLine({ text, href }: { text: string; href?: string }) {
  const tag = tagOfLine(text);
  if (!tag) return <RichText source={text} />;
  const rest = text.startsWith(`${tag} · `) ? text.slice(tag.length + 3) : text.slice(tag.length + 1);
  const label = (
    <span className="mr-2 inline-block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-brass">
      {tag}
    </span>
  );
  if (tag === "VIDEO" && href) {
    const embed = parseVideoEmbed(href);
    if (embed) {
      return (
        <figure className="not-prose">
          <figcaption className="mb-2 text-sm">
            {label}
            {rest}
          </figcaption>
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-line bg-navy/5">
            <iframe
              src={embed.src}
              title={rest || embed.title}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </figure>
      );
    }
  }
  if (!href) {
    return (
      <p>
        {label}
        {rest}
      </p>
    );
  }
  return (
    <p>
      {label}
      <a
        href={href}
        target="_blank"
        // noopener/noreferrer: office-supplied destinations opening in a new tab
        // must never receive a window.opener handle.
        rel="noopener noreferrer"
        className="inline underline decoration-brass/40 underline-offset-4 transition-colors hover:decoration-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {rest}
        <ExternalLink
          className="ml-1 inline size-3.5 shrink-0 -translate-y-px text-brass"
          aria-hidden="true"
        />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </p>
  );
}

/** The full body: one paragraph per array entry, tagged lines linked via `linkFor`. */
export function LessonProse({
  body,
  keyPrefix = "line",
  linkFor,
}: {
  body: string[];
  keyPrefix?: string;
  linkFor?: (line: string) => string | undefined;
}) {
  return (
    <div className="space-y-5 text-lg leading-relaxed text-ink">
      {body.map((paragraph, index) => (
        <LessonLine
          key={`${keyPrefix}-${index}`}
          text={paragraph}
          href={linkFor ? linkFor(paragraph) : undefined}
        />
      ))}
    </div>
  );
}

export { lessonLineKey };
