import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { listFavorites, listMyAssignments, type LockerFavorite, type MyAssignment } from "@/lib/locker";
import { getLastShoutout } from "@/lib/locker-daily";
import { listMyEvalScores, type SuggestedLesson } from "@/lib/presentation-eval";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

/** The weakest graded presentation phase, for the warm-up's focus step. */
type FocusPhase = { label: string; avg: number } | null;

type Boost = { fromName: string; body: string } | null;

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
  const [focusPhase, setFocusPhase] = useState<FocusPhase>(null);
  const [boost, setBoost] = useState<Boost>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, f, scores, shout] = await Promise.all([
        listMyAssignments(),
        listFavorites(),
        listMyEvalScores().catch(() => null),
        getLastShoutout().catch(() => null),
      ]);
      setAssignments(a.filter((x) => x.daysUntilDue !== null && (x.daysUntilDue ?? 99) <= 7));
      setFavorites(f.slice(0, 6));
      setSuggestions(scores?.suggestions?.slice(0, 4) ?? []);
      setBoost(shout);
      const graded = (scores?.averages?.byPhase ?? []).filter(
        (p): p is { id: string; label: string; avg: number; count: number } => p.avg != null,
      );
      graded.sort((x, y) => x.avg - y.avg);
      setFocusPhase(graded[0] ? { label: graded[0].label, avg: graded[0].avg } : null);
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
            <button
              type="button"
              onClick={() => setWarmingUp(true)}
              className="block w-full rounded-lg bg-brass px-4 py-5 text-left text-lg font-semibold text-navy transition-colors hover:bg-brass/90"
            >
              30-second warm-up
              <span className="mt-1 block text-sm font-normal text-navy/70">
                Breathe · focus · go — before your next Client.
              </span>
            </button>

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
      {warmingUp && (
        <WarmUp focusPhase={focusPhase} boost={boost} onDone={() => setWarmingUp(false)} />
      )}
    </div>
  );
}

/**
 * The pre-Client ritual: one breathing cycle, one focus cue from the
 * user's weakest graded presentation phase, one boost — their most recent
 * shout-out when they have one. Three taps, thirty seconds, go.
 */
function WarmUp({
  focusPhase,
  boost,
  onDone,
}: {
  focusPhase: FocusPhase;
  boost: Boost;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [breathLabel, setBreathLabel] = useState("Breathe in…");

  // One guided cycle: in 4s, hold 2s, out 4s — then the next step unlocks
  // on its own. Impatient people can tap Skip.
  useEffect(() => {
    if (step !== 0) return;
    const t1 = setTimeout(() => setBreathLabel("Hold…"), 4000);
    const t2 = setTimeout(() => setBreathLabel("Breathe out…"), 6000);
    const t3 = setTimeout(() => setStep(1), 10_000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy px-6 text-center text-paper">
      <style>{`
        @keyframes floor-breathe {
          0% { transform: scale(1); opacity: .55; }
          40% { transform: scale(1.35); opacity: 1; }
          60% { transform: scale(1.35); opacity: 1; }
          100% { transform: scale(1); opacity: .55; }
        }
        .floor-breathe { animation: floor-breathe 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .floor-breathe { animation: none; } }
      `}</style>

      {step === 0 && (
        <>
          <div className="floor-breathe flex size-40 items-center justify-center rounded-full border-2 border-brass/60 bg-brass/10 shadow-[0_0_60px_rgba(200,164,88,0.25)]" />
          <p aria-live="polite" className="mt-8 font-display text-3xl">{breathLabel}</p>
          <p className="mt-2 text-sm text-paper/50">One slow breath. The Client can wait four seconds.</p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-8 text-xs uppercase tracking-[0.16em] text-paper/40 hover:text-paper"
          >
            Skip
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Today&rsquo;s focus</p>
          {focusPhase ? (
            <>
              <p className="mt-4 max-w-sm font-display text-3xl leading-snug">{focusPhase.label}</p>
              <p className="mt-3 max-w-sm text-paper/60">
                Your lowest graded phase ({focusPhase.avg}/10). Slow down and nail it this time.
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 max-w-sm font-display text-3xl leading-snug">Lead with listening.</p>
              <p className="mt-3 max-w-sm text-paper/60">Slow is smooth, smooth is fast.</p>
            </>
          )}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-10 h-12 rounded-full bg-paper/15 px-10 text-base font-semibold hover:bg-paper/25"
          >
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">One more thing</p>
          {boost ? (
            <>
              <p className="mt-4 max-w-sm text-paper/60">{boost.fromName} once told you:</p>
              <p className="mt-3 max-w-sm font-display text-2xl leading-snug">&ldquo;{boost.body}&rdquo;</p>
            </>
          ) : (
            <p className="mt-4 max-w-sm font-display text-2xl leading-snug">
              Someone walks out of this store better today because of you.
            </p>
          )}
          <button
            type="button"
            onClick={onDone}
            className="mt-10 h-12 rounded-full bg-brass px-10 text-base font-bold text-navy hover:bg-brass/90"
          >
            Go get &rsquo;em
          </button>
        </>
      )}
    </div>
  );
}
