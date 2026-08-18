import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { getTrack } from "@/lib/content";
import { listProgress } from "@/lib/progress";

export const Route = createFileRoute("/training/$track")({
  component: TrackPage,
});

function TrackPage() {
  const { track: trackId } = Route.useParams();
  const track = getTrack(trackId);
  if (!track) throw notFound();

  return (
    <SiteShell>
      <AuthGate>
        <TrackBody />
      </AuthGate>
    </SiteShell>
  );
}

function TrackBody() {
  const { track: trackId } = Route.useParams();
  const track = getTrack(trackId)!;
  const [done, setDone] = useState<string[] | null>(null);
  useEffect(() => {
    listProgress()
      .then(setDone)
      .catch(() => setDone([]));
  }, []);

  return (
    <div>
      <div className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src={track.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Link
            to="/training"
            className="text-xs uppercase tracking-[0.18em] text-brass-soft hover:text-paper"
          >
            All tracks
          </Link>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-6xl">{track.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper/80">{track.summary}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-brass-soft">{track.audience}</p>
        </div>
      </div>
      <ol className="mx-auto max-w-3xl space-y-3 px-5 py-12 sm:px-8">
        {track.lessons.map((lesson, i) => {
          const key = `${track.id}/${lesson.slug}`;
          const complete = done?.includes(key);
          return (
            <li key={lesson.slug}>
              <Link
                to="/training/$track/$lesson"
                params={{ track: track.id, lesson: lesson.slug }}
                className="flex items-start gap-4 rounded-md border border-line bg-surface p-5 hover:border-navy/30"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-line font-display text-lg">
                  {complete ? <Check className="size-4 text-navy" /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  {lesson.kicker && (
                    <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-brass">
                      {lesson.kicker}
                    </span>
                  )}
                  <span className="block font-display text-2xl leading-tight">{lesson.title}</span>
                  <span className="mt-1 block text-xs text-muted">{lesson.minutes} min</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
