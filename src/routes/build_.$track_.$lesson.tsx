import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { LessonProse } from "@/components/lesson-body";
import { SlideDeck } from "@/components/slide-deck";
import { QuizEditor } from "@/components/admin-quizzes";
import { BuilderGate } from "@/components/build/builder-gate";
import { BuilderHelpButton } from "@/components/build/builder-help";
import { buildInputClass } from "@/components/build/common";
import { BlockPalette } from "@/components/build/block-palette";
import { SlideEditor } from "@/components/build/slide-editor";
import { LinkAttacher } from "@/components/build/link-attacher";
import { lintLesson, parseBody, serializeBody, type BodyBlock } from "@/components/build/model";
import {
  getBuildCatalog,
  saveLesson,
  slugify,
  type BuildTrack,
} from "@/lib/cms";
import type { DeckSlide } from "@/lib/decks";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/build_/$track_/$lesson")({
  component: () => (
    <BuilderGate>
      <LessonBuilder />
    </BuilderGate>
  ),
  head: () => pageHead("Edit lesson · Builder"),
});

const EVAL_PHASES: [string, string][] = [
  ["welcome", "Welcome"],
  ["interview", "Interview"],
  ["analysis", "Analysis"],
  ["fitting", "Fitting"],
  ["solution", "Solution"],
  ["close", "Close"],
];

type Section = "body" | "slides" | "links" | "quiz";

function LessonBuilder() {
  const { track: trackId, lesson: lessonSlug } = Route.useParams();
  const router = useRouter();
  const isNew = lessonSlug === "new";

  const [track, setTrack] = useState<BuildTrack | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<Section>("body");

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(8);
  const [kicker, setKicker] = useState("");
  const [blocks, setBlocks] = useState<BodyBlock[]>([]);
  const [takeaway, setTakeaway] = useState("");
  const [phases, setPhases] = useState<string[]>([]);
  const [slides, setSlides] = useState<DeckSlide[]>([]);
  const [savedSlug, setSavedSlug] = useState(isNew ? "" : lessonSlug);

  useEffect(() => {
    let cancelled = false;
    getBuildCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const found = catalog.find((t) => t.id === trackId) ?? null;
        setTrack(found);
        const lesson = found?.lessons.find((l) => l.slug === lessonSlug);
        if (lesson) {
          setTitle(lesson.title);
          setMinutes(lesson.minutes);
          setKicker(lesson.kicker);
          setBlocks(parseBody(lesson.body));
          setTakeaway(lesson.takeaway);
          setPhases(lesson.evalPhases);
          setSlides(lesson.slides ?? []);
          setSavedSlug(lesson.slug);
        }
        setLoaded(true);
      })
      .catch((err) => !cancelled && toast.error(err instanceof Error ? err.message : "Could not load the lesson"));
    return () => {
      cancelled = true;
    };
  }, [trackId, lessonSlug]);

  const body = useMemo(() => serializeBody(blocks), [blocks]);
  const issues = useMemo(
    () => lintLesson({ body, takeaway, slides }, title || "This lesson"),
    [body, takeaway, slides, title],
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveLesson({
        data: {
          trackId,
          slug: isNew ? "" : savedSlug,
          title,
          minutes,
          kicker,
          body,
          takeaway,
          evalPhases: phases,
          slides: slides.length ? JSON.stringify(slides) : "",
        },
      });
      toast.success("Lesson saved");
      if (isNew) {
        await router.navigate({
          to: "/build/$track/$lesson",
          params: { track: trackId, lesson: slugify(title) },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the lesson");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }
  if (!isNew && !track) {
    return <div className="mx-auto max-w-2xl px-5 py-20 text-muted">That course no longer exists.</div>;
  }

  const warnCount = issues.filter((i) => i.level === "warn").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/build/$track" params={{ track: trackId }} className="text-xs uppercase tracking-[0.16em] text-brass hover:text-navy">
          ← {track?.title ?? "Course"}
        </Link>
        <BuilderHelpButton />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Editor column */}
        <form onSubmit={(e) => void save(e)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field label="Lesson title">
              <input className={buildInputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Minutes">
              <input
                type="number"
                min={1}
                max={480}
                className={buildInputClass}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 1)}
              />
            </Field>
          </div>
          <Field label="Kicker" hint="Small label above the title (optional).">
            <input className={buildInputClass} value={kicker} onChange={(e) => setKicker(e.target.value)} />
          </Field>

          <div className="flex flex-wrap gap-1 border-b border-line">
            {(
              [
                ["body", "Body"],
                ["slides", `Slides${slides.length ? ` (${slides.length})` : ""}`],
                ["links", "Links"],
                ["quiz", "Quiz"],
              ] as [Section, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "relative h-10 px-3 text-xs font-medium uppercase tracking-[0.12em]",
                  section === id ? "text-navy" : "text-muted hover:text-navy",
                )}
              >
                {label}
                <span className={cn("absolute inset-x-3 -bottom-px h-0.5", section === id ? "bg-navy" : "bg-transparent")} />
              </button>
            ))}
          </div>

          {section === "body" && (
            <div className="space-y-5">
              <BlockPalette blocks={blocks} onChange={setBlocks} />
              <Field label="Takeaway" hint="The one sentence a learner carries onto the floor.">
                <input className={buildInputClass} value={takeaway} onChange={(e) => setTakeaway(e.target.value)} />
              </Field>
              <fieldset className="rounded-md border border-line bg-paper px-4 py-3">
                <legend className="px-1 text-sm font-medium">Presentation phases this lesson strengthens</legend>
                <p className="mt-1 text-xs text-muted">
                  Tagged lessons are suggested in a Specialist&apos;s Locker when they score low on a phase. Leave blank to skip.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EVAL_PHASES.map(([id, label]) => {
                    const on = phases.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPhases(on ? phases.filter((p) => p !== id) : [...phases, id])}
                        className={
                          on
                            ? "rounded-sm border border-navy bg-navy px-3 py-1.5 text-xs font-medium text-paper"
                            : "rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-medium text-navy hover:border-navy/30"
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {section === "slides" && <SlideEditor slides={slides} onChange={setSlides} />}

          {section === "links" && (
            isNew ? (
              <p className="text-sm text-muted">Save the lesson once, then attach links to its tagged lines here.</p>
            ) : (
              <LinkAttacher trackId={trackId} lessonSlug={savedSlug} blocks={blocks} />
            )
          )}

          {section === "quiz" && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Quizzes attach to a lesson by its slug. This lesson&apos;s slug is{" "}
                <code className="rounded-sm bg-paper-2 px-1.5 py-0.5">{savedSlug || slugify(title) || "—"}</code>. Use it as the
                quiz&apos;s &ldquo;attaches to&rdquo; value.
              </p>
              <QuizEditor />
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-line pt-4">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save lesson"}</Button>
            {warnCount > 0 && <span className="text-xs text-danger">{warnCount} item{warnCount === 1 ? "" : "s"} to fix</span>}
          </div>
        </form>

        {/* Preview + lint column */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="kicker">Live preview</p>
            <div className="mt-3">
              {kicker && <p className="kicker">{kicker}</p>}
              <h2 className="mt-1 font-display text-2xl leading-tight">{title || "Lesson title"}</h2>
              <p className="mt-1 text-xs text-muted">{minutes} minute lesson</p>
              {slides.length > 0 && (
                <div className="mt-4">
                  <SlideDeck slides={slides} />
                </div>
              )}
              <div className="mt-4">
                <LessonProse body={body ? body.split(/\n\s*\n/) : []} keyPrefix="preview" />
              </div>
              {takeaway && (
                <aside className="mt-5 border-l-2 border-brass bg-paper-2 px-4 py-3">
                  <p className="kicker">Takeaway</p>
                  <p className="mt-1 font-display text-lg leading-snug">{takeaway}</p>
                </aside>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-paper-2 p-5">
            <p className="text-sm font-medium">Pre-flight</p>
            {issues.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing to flag.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {issues.map((issue, i) => (
                  <li key={i} className={cn("text-sm", issue.level === "warn" ? "text-danger" : "text-muted")}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
