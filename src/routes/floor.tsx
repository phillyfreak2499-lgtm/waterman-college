import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { listFavorites, listMyAssignments, type LockerFavorite, type MyAssignment } from "@/lib/locker";
import { listMyEvalScores, type SuggestedLesson } from "@/lib/presentation-eval";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/floor")({
  component: FloorPage,
  head: () =>
    pageHead(
      "Floor Mode",
      "Large targets for the sales floor — due work, suggestions, favorites.",
    ),
});

function FloorPage() {
  return (
    <AuthGate>
      <FloorDesk />
    </AuthGate>
  );
}

function FloorDesk() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [favorites, setFavorites] = useState<LockerFavorite[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, f, scores] = await Promise.all([
        listMyAssignments(),
        listFavorites(),
        listMyEvalScores().catch(() => null),
      ]);
      setAssignments(a.filter((x) => x.daysUntilDue !== null && (x.daysUntilDue ?? 99) <= 7));
      setFavorites(f.slice(0, 6));
      setSuggestions(scores?.suggestions?.slice(0, 4) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-dvh bg-navy text-paper">
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
            Floor Mode
          </p>
          <Link
            to="/locker"
            className="text-xs uppercase tracking-[0.14em] text-paper/60 hover:text-paper"
          >
            Full Locker
          </Link>
        </div>
        <h1 className="mt-4 font-display text-4xl leading-none">Between Clients</h1>
        <p className="mt-3 text-base text-paper/70">
          Due work, score-based practice, and favorites — large targets for the floor.
        </p>

        {loading ? (
          <div className="mt-10 h-32 animate-pulse rounded-lg bg-paper/10" />
        ) : (
          <div className="mt-10 space-y-8">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
                Due soon
              </p>
              {assignments.length === 0 ? (
                <p className="mt-3 text-paper/55">Nothing due in the next 7 days.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {assignments.map((a) => (
                    <li key={a.assignmentId}>
                      <Link
                        to="/training/$track"
                        params={{ track: a.trackId }}
                        className="block rounded-lg bg-paper/10 px-4 py-5 text-lg font-medium hover:bg-paper/15"
                      >
                        {a.trackTitle}
                        <span className="mt-1 block text-sm font-normal text-paper/55">
                          {a.daysUntilDue === 0
                            ? "Due today"
                            : a.daysUntilDue !== null && a.daysUntilDue < 0
                              ? "Overdue"
                              : `Due in ${a.daysUntilDue}d`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {suggestions.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
                  Practice from scores
                </p>
                <ul className="mt-4 space-y-3">
                  {suggestions.map((s) => (
                    <li key={`${s.trackId}-${s.lessonSlug}`}>
                      <Link
                        to="/training/$track/$lesson"
                        params={{ track: s.trackId, lesson: s.lessonSlug }}
                        className="block rounded-lg bg-brass/20 px-4 py-5 text-lg font-medium hover:bg-brass/30"
                      >
                        {s.title}
                        <span className="mt-1 block text-sm font-normal text-paper/60">
                          {s.phaseLabel} · {s.phaseAvg}/10
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {favorites.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
                  Favorites
                </p>
                <ul className="mt-4 space-y-3">
                  {favorites.map((f) => (
                    <li key={f.id}>
                      <a
                        href={f.href || "/training"}
                        className="block rounded-lg bg-paper/10 px-4 py-5 text-lg font-medium hover:bg-paper/15"
                      >
                        {f.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Link
              to="/training"
              className={cn(
                "block rounded-lg border border-paper/20 px-4 py-5 text-center text-lg font-medium",
                "text-paper hover:bg-paper/10",
              )}
            >
              Open Training Hall
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
