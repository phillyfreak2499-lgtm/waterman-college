import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Download } from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { FavoriteButton } from "@/components/favorite-button";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { SiteShell } from "@/components/site-shell";
import { TrainingTabs } from "@/components/training-tabs";
import { useProgress } from "@/components/progress-provider";
import { ONBOARDING_WEEKS, dayFromSlug, weekOfDay } from "@/lib/onboarding";
import type { Lesson, Track } from "@/lib/content";
import type { ProgressRow } from "@/lib/progress";
import { lessonKey, lessonStatus, trackStats } from "@/lib/progress-stats";
import { cn } from "@/lib/utils";
import { trackDeck } from "@/lib/decks";

export const Route = createFileRoute("/training/$track")({
  component: TrackPage,
});

function TrackPage() {
  return (
    <SiteShell>
      <AuthGate>
        <TrackGate />
      </AuthGate>
    </SiteShell>
  );
}

function TrackGate() {
  const { track: trackId } = Route.useParams();
  const { catalog, ready } = useCatalog();
  const { access, ready: accessReady } = useAccess();
  const track = catalog.tracks.find((t) => t.id === trackId);
  if ((!track && !ready) || !accessReady) {
    return <div className="mx-auto max-w-3xl px-5 py-24"><div className="h-40 animate-pulse rounded-md bg-navy/5" /></div>;
  }
  if (!track) throw notFound();
  if (!access.allowedTabs.includes(track.role) && !access.assignedTrackIds.includes(track.id)) {
    return <LockedPath role={access.role} title="This course is not on your path." />;
  }
  return <TrackBody track={track} />;
}

function TrackBody({ track }: { track: Track }) {
  const { catalog } = useCatalog();
  const { rows, ready } = useProgress();
  const stats = trackStats(rows, track);
  const roleLabel = catalog.roles.find((r) => r.id === track.role)?.label ?? "Training";
  const deck = trackDeck(track.id);

  return (
    <div>
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
          <TrainingTabs active={track.role} />
        </div>
      </div>
      <div className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src={track.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Link
            to="/training"
            search={{ role: track.role }}
            className="text-xs uppercase tracking-[0.18em] text-brass-soft hover:text-paper"
          >
            Back to {roleLabel}
          </Link>
          <span className="rule-brass mt-4 bg-brass-soft/80" />
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <h1 className="font-display text-4xl leading-none sm:text-6xl">{track.title}</h1>
            <FavoriteButton targetType="track" targetId={track.id} invert className="mt-2 sm:mt-3" />
          </div>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper/80">{track.summary}</p>
          {deck && (
            <a
              href={deck.deckUrl}
              download={deck.deckName}
              className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass-soft hover:text-paper"
            >
              <Download className="size-3.5" /> Download {deck.label} slides
            </a>
          )}
          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-brass-soft">
              <span>{track.audience}</span>
              <span className="tabular-nums">
                {ready ? `${stats.done}/${stats.total} complete` : "—"}
              </span>
            </div>
            {ready && stats.total > 0 && (
              <div className="progress-track mt-3 bg-paper/20">
                <div className="progress-fill bg-brass-soft" style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }} />
              </div>
            )}
            {ready && stats.total > 0 && stats.done >= stats.total && (
              <Link
                to="/training/$track/certificate"
                params={{ track: track.id }}
                className="mt-4 inline-flex h-11 items-center rounded-sm bg-paper px-4 text-sm font-medium text-navy hover:bg-paper-2"
              >
                View your seal
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {track.id === "onboarding" ? (
          <OnboardingWeeks track={track} rows={rows} ready={ready} />
        ) : (
          <ol className="space-y-3">
            {track.lessons.map((lesson, i) => {
              const key = lessonKey(track.id, lesson.slug);
              const status = lessonStatus(rows, key);
              return (
                <DayRow
                  key={lesson.slug}
                  trackId={track.id}
                  lesson={lesson}
                  index={i}
                  status={status}
                />
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function OnboardingWeeks({
  track,
  rows,
  ready,
}: {
  track: Track;
  rows: ProgressRow[];
  ready: boolean;
}) {
  return (
    <div className="space-y-10">
      {ONBOARDING_WEEKS.map((week) => {
        const lessons = track.lessons.filter((lesson) => {
          const day = dayFromSlug(lesson.slug);
          return day != null && weekOfDay(day) === week.week;
        });
        const done = lessons.filter((l) => lessonStatus(rows, lessonKey(track.id, l.slug)) === "completed").length;
        return (
          <section key={week.week}>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass">
              Week {week.week}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-none">{week.title}</h2>
            <p className="mt-2 text-sm text-muted">{week.summary}</p>
            <p className="mt-1 text-xs tabular-nums text-muted">
              {ready ? `${done}/${lessons.length} days` : "—"}
            </p>
            <ol className="mt-4 space-y-3">
              {lessons.map((lesson, i) => (
                <DayRow
                  key={lesson.slug}
                  trackId={track.id}
                  lesson={lesson}
                  index={i}
                  status={lessonStatus(rows, lessonKey(track.id, lesson.slug))}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function DayRow({
  trackId,
  lesson,
  index,
  status,
}: {
  trackId: string;
  lesson: Lesson;
  index: number;
  status: ReturnType<typeof lessonStatus>;
}) {
  return (
    <li>
      <Link
        to="/training/$track/$lesson"
        params={{ track: trackId, lesson: lesson.slug }}
        className="flex items-start gap-4 rounded-md border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-navy/20 hover:shadow-lift"
      >
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-sm border font-display text-lg",
            status === "completed"
              ? "border-navy bg-navy text-paper"
              : status === "in-progress"
                ? "border-brass text-brass"
                : "border-line",
          )}
        >
          {status === "completed" ? (
            <Check className="size-4" />
          ) : (
            String(dayFromSlug(lesson.slug) ?? index + 1).padStart(2, "0")
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            {lesson.kicker && (
              <span className="text-[0.7rem] uppercase tracking-[0.16em] text-brass">
                {lesson.kicker}
              </span>
            )}
            {status === "in-progress" && (
              <span className="text-[0.7rem] uppercase tracking-[0.16em] text-brass">In progress</span>
            )}
            {status === "completed" && (
              <span className="text-[0.7rem] uppercase tracking-[0.16em] text-navy">Completed</span>
            )}
          </span>
          <span className="mt-0.5 block font-display text-2xl leading-tight">{lesson.title}</span>
          <span className="mt-1 block text-xs text-muted">
            {lesson.minutes} min
            {lesson.slides?.length ? ` · ${lesson.slides.length} slides` : ""}
          </span>
        </span>
      </Link>
    </li>
  );
}
