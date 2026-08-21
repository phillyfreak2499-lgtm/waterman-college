import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApplyOnFloor } from "@/components/apply-on-floor";
import { DayQuiz } from "@/components/day-quiz";
import { AskTrainer } from "@/components/ask-trainer";
import { AuthGate } from "@/components/auth-gate";
import { BirthdayGate } from "@/components/birthday-takeover";
import { FavoriteButton } from "@/components/favorite-button";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { useProgress } from "@/components/progress-provider";
import { SiteShell } from "@/components/site-shell";
import { SlideDeck } from "@/components/slide-deck";
import { Button } from "@/components/ui/button";
import type { Lesson, Track } from "@/lib/content";
import { trackDeck } from "@/lib/decks";
import { markComplete, markIncomplete, markViewed } from "@/lib/progress";
import { lessonKey, lessonStatus } from "@/lib/progress-stats";
import { lessonLineKey, listLessonLinks, type LessonLink } from "@/lib/lesson-links";

export const Route = createFileRoute("/training/$track_/$lesson")({
  component: LessonPage,
});

function LessonPage() {
  return (
    <SiteShell>
      <AuthGate>
        <BirthdayGate>
          <LessonGate />
        </BirthdayGate>
      </AuthGate>
    </SiteShell>
  );
}

function LessonGate() {
  const { track: trackId, lesson: lessonSlug } = Route.useParams();
  const { catalog, ready } = useCatalog();
  const { access, ready: accessReady } = useAccess();
  const track = catalog.tracks.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.slug === lessonSlug);
  if (((!track || !lesson) && !ready) || !accessReady) {
    return <div className="mx-auto max-w-2xl px-5 py-24"><div className="h-40 animate-pulse rounded-md bg-navy/5" /></div>;
  }
  if (!track || !lesson) throw notFound();
  if (
    !track.visibleToAll &&
    !access.allowedTabs.includes(track.role) &&
    !access.assignedTrackIds.includes(track.id)
  ) {
    return <LockedPath role={access.role} title="This lesson is not on your path." />;
  }
  return <LessonBody track={track} lesson={lesson} />;
}

function LessonBody({ track, lesson }: { track: Track; lesson: Lesson }) {
  const { catalog } = useCatalog();
  const idx = track.lessons.findIndex((l) => l.slug === lesson.slug);
  const prev = track.lessons[idx - 1];
  const next = track.lessons[idx + 1];
  const key = lessonKey(track.id, lesson.slug);
  const { rows, replace } = useProgress();
  const status = lessonStatus(rows, key);
  const [saving, setSaving] = useState(false);
  const roleLabel = catalog.roles.find((r) => r.id === track.role)?.label ?? "Training";
  const deck = trackDeck(track.id);
  const slides = lesson.slides ?? [];
  const wide = slides.length > 0;

  // Office-attached resource links for this lesson's tagged lines, keyed by
  // lessonLineKey(). Absent links simply leave the line as plain text, so a
  // failed fetch degrades to the previous behaviour rather than an error state.
  const [links, setLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    listLessonLinks({ data: { trackId: track.id, lessonSlug: lesson.slug } })
      .then((rows: LessonLink[]) => {
        if (cancelled) return;
        setLinks(Object.fromEntries(rows.map((row) => [row.lineKey, row.url])));
      })
      .catch(() => {
        /* links are an enhancement — never block the lesson on them */
      });
    return () => {
      cancelled = true;
    };
  }, [track.id, lesson.slug]);

  function linkFor(line: string): string | undefined {
    const lineKey = lessonLineKey(line);
    return lineKey ? links[lineKey] : undefined;
  }

  useEffect(() => {
    let cancelled = false;
    markViewed({ data: key })
      .then((nextRows) => {
        if (!cancelled) replace(nextRows);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not open this lesson"),
      );
    return () => {
      cancelled = true;
    };
  }, [key, replace]);

  async function complete() {
    setSaving(true);
    try {
      replace(await markComplete({ data: key }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save progress");
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    setSaving(true);
    try {
      replace(await markIncomplete({ data: key }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save progress");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={wide ? "mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16" : "mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16"}>
      <Link
        to="/training/$track"
        params={{ track: track.id }}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
      >
        <ArrowLeft className="size-3.5" /> {track.title}
      </Link>
      {lesson.kicker && <p className="kicker mt-8">{lesson.kicker}</p>}
      <span className="rule-brass mt-3" />
      <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        {lesson.title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {lesson.minutes} minute lesson
        {status === "completed" ? " · Completed" : status === "in-progress" ? " · In progress" : ""}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {status === "completed" ? (
          <>
            <Button disabled variant="outline" size="sm">
              <Check className="size-4" /> Completed
            </Button>
            <Button onClick={() => void undo()} disabled={saving} variant="ghost" size="sm">
              {saving ? "Saving…" : "Mark incomplete"}
            </Button>
          </>
        ) : (
          <Button onClick={() => void complete()} disabled={saving} size="sm">
            {saving ? "Saving…" : "Mark complete"}
          </Button>
        )}
        <FavoriteButton
          targetType="lesson"
          targetId={`${track.id}/${lesson.slug}`}
        />
      </div>
      {slides.length > 0 && (
        <div className="mt-10">
          <SlideDeck key={key} slides={slides} series={deck?.series} />
          {deck && (
            <p className="mt-3">
              <a
                href={deck.deckUrl}
                download={deck.deckName}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-brass hover:text-navy"
              >
                <Download className="size-3.5" /> Download {deck.deckName}
              </a>
            </p>
          )}
        </div>
      )}
      <div className="mt-10 space-y-5 text-lg leading-relaxed text-ink">
        {lesson.body.map((p, index) => (
          <LessonLine key={`${key}-${index}`} text={p} href={linkFor(p)} />
        ))}
      </div>
      {lesson.takeaway && (
        <aside className="mt-10 border-l-2 border-brass bg-paper-2 px-5 py-5">
          <p className="kicker">Takeaway</p>
          <p className="mt-2 font-display text-2xl leading-snug">{lesson.takeaway}</p>
        </aside>
      )}

      <ApplyOnFloor
        trackTitle={track.title}
        lessonTitle={lesson.title}
      />

      <DayQuiz lessonSlug={lesson.slug} />
      <AskTrainer lessonKey={key} />

      <nav className="mt-14 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            to="/training/$track/$lesson"
            params={{ track: track.id, lesson: prev.slug }}
            className="rounded-md border border-line bg-surface px-4 py-4 shadow-card transition-colors hover:border-navy/20"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">Previous</p>
            <p className="mt-1 inline-flex items-center gap-2 font-display text-xl leading-tight">
              <ArrowLeft className="size-4 shrink-0" /> {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/training/$track/$lesson"
            params={{ track: track.id, lesson: next.slug }}
            className="rounded-md border border-line bg-surface px-4 py-4 text-right shadow-card transition-colors hover:border-navy/20"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">Next</p>
            <p className="mt-1 inline-flex items-center justify-end gap-2 font-display text-xl leading-tight">
              {next.title} <ArrowRight className="size-4 shrink-0" />
            </p>
          </Link>
        ) : (
          <Link
            to="/training"
            search={{ role: track.role }}
            className="rounded-md border border-line bg-surface px-4 py-4 text-right shadow-card hover:border-navy/20"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">Finished</p>
            <p className="mt-1 font-display text-xl leading-tight">Back to {roleLabel}</p>
          </Link>
        )}
      </nav>
    </article>
  );
}

const TAGS = ["VIDEO", "GFA", "PRACTICE", "ROLEPLAY", "FORM", "NEW HIRE ONBOARDING", "WELCOME", "INTERVIEW", "ANALYSIS", "FITTING", "SOLUTION"] as const;

function LessonLine({ text, href }: { text: string; href?: string }) {
  const tag = TAGS.find((item) => text.startsWith(`${item} · `) || text.startsWith(`${item} `));
  if (!tag) return <p>{text}</p>;
  const rest = text.startsWith(`${tag} · `) ? text.slice(tag.length + 3) : text.slice(tag.length + 1);
  const label = (
    <span className="mr-2 inline-block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-brass">
      {tag}
    </span>
  );
  // No destination attached yet — same inert line as before.
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
        // noopener/noreferrer: these destinations are office-supplied and open
        // in a new tab, so never hand them a window.opener handle.
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
