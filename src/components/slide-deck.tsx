import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DeckSlide, SlideBlock, TrackSeries } from "@/lib/decks";
import { cn } from "@/lib/utils";

export function SlideDeck({
  slides,
  series = "blue",
}: {
  slides: DeckSlide[];
  series?: TrackSeries;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = slides.length - 1;

  useEffect(() => setIndex(0), [slides]);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.min(last, Math.max(0, next)));
    },
    [last],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") go(index + 1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  if (!slide) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-navy/20 bg-navy text-paper shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-4 py-2.5 sm:px-5">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brass-soft">
          {series === "burgundy" ? "Burgundy" : "Blue"} · Slide {slide.n}
        </p>
        <p className="tabular-nums text-[0.7rem] text-paper/55">
          {index + 1} / {slides.length}
        </p>
      </div>
      <div className="progress-track rounded-none bg-paper/10">
        <div
          className="progress-fill bg-brass-soft"
          style={{ width: `${slides.length ? ((index + 1) / slides.length) * 100 : 0}%` }}
        />
      </div>

      <div className="min-h-[22rem] px-5 py-6 sm:min-h-[26rem] sm:px-8 sm:py-8">
        {slide.kicker && (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-brass-soft">
            {slide.kicker}
          </p>
        )}
        <h2 className="mt-1 font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-paper/75">{slide.subtitle}</p>
        )}
        <div className="mt-6 space-y-5">
          {slide.blocks.map((block, i) => (
            <SlideBlockView key={`${slide.n}-${i}`} block={block} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-paper/10 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex h-11 items-center gap-1 rounded-sm px-3 text-sm text-paper/80 hover:bg-paper/10 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" /> Previous
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {slides.map((item, i) => (
            <button
              key={item.n}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-5 bg-brass-soft" : "w-2 bg-paper/25 hover:bg-paper/45",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          className="inline-flex h-11 items-center gap-1 rounded-sm px-3 text-sm text-paper/80 hover:bg-paper/10 disabled:opacity-30"
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function SlideBlockView({ block }: { block: SlideBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="text-base leading-relaxed text-paper/85">{block.text}</p>;
    case "quote":
      return (
        <blockquote className="border-l-2 border-brass-soft pl-4 font-display text-2xl leading-snug text-paper">
          {block.text}
        </blockquote>
      );
    case "say":
      return (
        <div className="rounded-md bg-paper/8 px-4 py-3">
          {block.label && (
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
              {block.label}
            </p>
          )}
          <p className="mt-1 font-display text-xl leading-snug italic">{block.text}</p>
        </div>
      );
    case "list":
      return (
        <div>
          {block.title && (
            <p
              className={cn(
                "text-[0.7rem] font-medium uppercase tracking-[0.16em]",
                block.tone === "never" || block.tone === "red"
                  ? "text-brass-soft"
                  : "text-brass-soft",
              )}
            >
              {block.title}
            </p>
          )}
          <ul className="mt-2 space-y-1.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-paper/85">
                <span className="mt-0.5 shrink-0 text-brass-soft">
                  {block.tone === "never" || block.tone === "red"
                    ? "△"
                    : block.tone === "do" || block.tone === "green"
                      ? "✓"
                      : "·"}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "steps":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={item.title} className="rounded-md bg-paper/8 px-4 py-3">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
                {item.n ?? String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-display text-xl leading-tight">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-paper/75">{item.body}</p>
            </li>
          ))}
        </ol>
      );
    case "cards":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.letter} className="rounded-md bg-paper/8 px-4 py-3">
              <p className="font-display text-3xl leading-none text-brass-soft">{item.letter}</p>
              <p className="mt-1 font-display text-xl leading-tight">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-paper/75">{item.body}</p>
            </div>
          ))}
        </div>
      );
    case "pair":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-paper/8 px-4 py-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
              {block.left.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/80">{block.left.body}</p>
          </div>
          <div className="rounded-md bg-paper/8 px-4 py-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
              {block.right.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/80">{block.right.body}</p>
          </div>
        </div>
      );
    case "image":
      return (
        <figure>
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-md border border-paper/10 object-cover"
          />
          {block.caption && (
            <figcaption className="mt-2 text-xs text-paper/60">{block.caption}</figcaption>
          )}
        </figure>
      );
  }
}
