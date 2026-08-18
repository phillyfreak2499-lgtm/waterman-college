import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { getLesson, getTrack } from "@/lib/content";
import { listProgress, markComplete } from "@/lib/progress";

export const Route = createFileRoute("/training/$track/$lesson")({
  component: LessonPage,
});

function LessonPage() {
  const { track: trackId, lesson: lessonSlug } = Route.useParams();
  const track = getTrack(trackId);
  const lesson = getLesson(trackId, lessonSlug);
  if (!track || !lesson) throw notFound();
  return (
    <SiteShell>
      <AuthGate>
        <LessonBody />
      </AuthGate>
    </SiteShell>
  );
}

function LessonBody() {
  const { track: trackId, lesson: lessonSlug } = Route.useParams();
  const track = getTrack(trackId)!;
  const lesson = getLesson(trackId, lessonSlug)!;
  const idx = track.lessons.findIndex((l) => l.slug === lesson.slug);
  const prev = track.lessons[idx - 1];
  const next = track.lessons[idx + 1];
  const key = `${track.id}/${lesson.slug}`;
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProgress()
      .then((keys) => setDone(keys.includes(key)))
      .catch(() => setDone(false));
  }, [key]);

  async function complete() {
    setSaving(true);
    try {
      await markComplete({ data: key });
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <Link
        to="/training/$track"
        params={{ track: track.id }}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
      >
        <ArrowLeft className="size-3.5" /> {track.title}
      </Link>
      {lesson.kicker && (
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-brass">
          {lesson.kicker}
        </p>
      )}
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        {lesson.title}
      </h1>
      <p className="mt-3 text-sm text-muted">{lesson.minutes} minute read</p>
      <div className="mt-10 space-y-5 text-[1.08rem] leading-[1.7] text-ink">
        {lesson.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {lesson.takeaway && (
        <aside className="mt-10 border-l-2 border-brass bg-paper-2 px-5 py-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brass">
            Takeaway
          </p>
          <p className="mt-1 font-display text-2xl leading-snug">{lesson.takeaway}</p>
        </aside>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button onClick={() => void complete()} disabled={done || saving} variant={done ? "outline" : "primary"}>
          {done ? (
            <>
              <Check className="size-4" /> Completed
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            "Mark complete"
          )}
        </Button>
      </div>

      <nav className="mt-14 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm">
        {prev ? (
          <Link
            to="/training/$track/$lesson"
            params={{ track: track.id, lesson: prev.slug }}
            className="inline-flex items-center gap-2 text-muted hover:text-navy"
          >
            <ArrowLeft className="size-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/training/$track/$lesson"
            params={{ track: track.id, lesson: next.slug }}
            className="inline-flex items-center gap-2 text-right hover:text-navy"
          >
            {next.title} <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link to="/training" className="hover:text-navy">
            Back to campus
          </Link>
        )}
      </nav>
    </article>
  );
}
