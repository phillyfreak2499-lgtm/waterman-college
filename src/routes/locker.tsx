import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Minus,
  Pin,
  Plus,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  deleteLockerNote,
  listFavorites,
  listLockerNotes,
  listMyAssignments,
  markReminderDone,
  upsertLockerNote,
  type LockerFavorite,
  type LockerNote,
  type MyAssignment,
} from "@/lib/locker";
import {
  listMyEvalScores,
  type PhaseAverages,
  type SuggestedLesson,
} from "@/lib/presentation-eval";
import { listMyGameScores, type GameScore } from "@/lib/quad-scores";
import { pageHead } from "@/lib/page-title";
import { cn, errorMessage } from "@/lib/utils";

/** One phase's month-over-month movement, as returned by `listMyEvalScores`. */
type PhaseTrendPoint = {
  id: string;
  label: string;
  current: number | null;
  previous: number | null;
  direction: string;
};

/**
 * Direction marker beside a phase average.
 *
 * The arrow is decorative; the meaning is carried by visually-hidden text so it
 * is not colour- or glyph-dependent. Renders nothing when there is no prior
 * month to compare against, which keeps a first-month locker uncluttered.
 */
function PhaseTrend({ trend }: { trend?: PhaseTrendPoint }) {
  if (!trend || trend.current == null) return null;
  if (trend.direction === "up") {
    return (
      <span className="flex items-center text-navy" title="Up from last month">
        <TrendingUp className="size-3.5" aria-hidden="true" />
        <span className="sr-only">
          Up from last month{trend.previous != null ? ` (was ${trend.previous}/10)` : ""}
        </span>
      </span>
    );
  }
  if (trend.direction === "down") {
    return (
      <span className="flex items-center text-brass" title="Down from last month">
        <TrendingDown className="size-3.5" aria-hidden="true" />
        <span className="sr-only">
          Down from last month{trend.previous != null ? ` (was ${trend.previous}/10)` : ""}
        </span>
      </span>
    );
  }
  if (trend.direction === "flat") {
    return (
      <span className="flex items-center text-muted" title="Level with last month">
        <Minus className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Level with last month</span>
      </span>
    );
  }
  return null;
}

export const Route = createFileRoute("/locker")({
  component: LockerPage,
  head: () =>
    pageHead(
      "My Locker",
      "What is due, what leadership wants you to know, and what you want to remember.",
    ),
});

function LockerPage() {
  return (
    <SiteShell>
      <AuthGate>
        <LockerDesk />
      </AuthGate>
    </SiteShell>
  );
}

function LockerDesk() {
  const { user } = useCurrentUserState();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [favorites, setFavorites] = useState<LockerFavorite[]>([]);
  const [notes, setNotes] = useState<LockerNote[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [phaseAvgs, setPhaseAvgs] = useState<PhaseAverages | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedLesson[]>([])
  const [trends, setTrends] = useState<PhaseTrendPoint[]>([]);
  const [thisMonthAvg, setThisMonthAvg] = useState<number | null>(null)
  const [priorMonthAvg, setPriorMonthAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [a, f, n, scores, games] = await Promise.all([
        listMyAssignments(),
        listFavorites(),
        listLockerNotes(),
        listMyEvalScores().catch(() => null),
        listMyGameScores().catch(() => [] as GameScore[]),
      ]);
      setAssignments(a);
      setFavorites(f);
      setNotes(n);
      setGameScores(games);
      setPhaseAvgs(scores?.averages ?? null);
      setSuggestions(scores?.suggestions ?? []);
      setTrends(scores?.trends ?? []);
      setThisMonthAvg(scores?.thisMonthAvg ?? null);
      setPriorMonthAvg(scores?.priorMonthAvg ?? null);
    } catch (err) {
      toast.error(errorMessage(err) || "Could not open your locker");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleAddNote(e?: FormEvent) {
    e?.preventDefault();
    const body = noteDraft.trim();
    if (!body) return;
    setSavingNote(true);
    try {
      await upsertLockerNote({ data: { body } });
      setNoteDraft("");
      await reload();
      toast.success("Note saved");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      await deleteLockerNote({ data: { id } });
      await reload();
    } catch (err) {
      toast.error(errorMessage(err) || "Could not delete note");
    }
  }

  async function handleMarkDone(id: string, done: boolean) {
    try {
      await markReminderDone({ data: { id, done } });
      await reload();
    } catch (err) {
      toast.error(errorMessage(err) || "Could not update reminder");
    }
  }

  /**
   * Month-over-month direction per phase, keyed for the averages grid below.
   * The server already computes `direction` ("up" | "down" | "flat" | "new");
   * this only indexes it so each phase row can show which way it is moving.
   */
  const trendById = useMemo(
    () => new Map(trends.map((t) => [t.id, t])),
    [trends],
  );

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const nextUp = assignments.find((a) => a.progress.nextLessonSlug);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="kicker">Your desk</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">
        My Locker
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        What is due, what leadership wants you to know, and what you want to remember.
      </p>
      <p className="mt-1 text-sm text-muted">Hello, {firstName}.</p>

      {loading ? (
        <div className="mt-12 space-y-4">
          <div className="h-28 animate-pulse rounded-lg bg-navy/5" />
          <div className="h-24 animate-pulse rounded-lg bg-navy/5" />
          <div className="h-32 animate-pulse rounded-lg bg-navy/5" />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* Due & Assigned */}
          <section>
            <p className="kicker">Due on your path</p>
            <span className="rule-brass mt-3" />
            {assignments.length === 0 ? (
              <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-8 text-center shadow-card">
                <p className="font-display text-xl">Nothing due right now.</p>
                <p className="mt-2 text-sm text-muted">
                  Your path is clear. Open the Hall whenever you are ready to grow.
                </p>
                <Button asChild className="mt-5" variant="brass">
                  <Link to="/training">Open the Hall</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {assignments.map((a) => (
                  <DueCard key={a.assignmentId} assignment={a} />
                ))}
              </div>
            )}
          </section>

          {/* Continue / Next Up */}
          {nextUp && nextUp.progress.nextLessonSlug && (
            <section>
              <p className="kicker">Next up</p>
              <span className="rule-brass mt-3" />
              <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-5 shadow-card">
                <p className="font-display text-xl leading-snug">
                  {nextUp.progress.nextLessonTitle}
                </p>
                <p className="mt-1 text-sm text-muted">{nextUp.trackTitle}</p>
                <Button asChild size="sm" className="mt-4">
                  <Link
                    to="/training/$track/$lesson"
                    params={{
                      track: nextUp.trackId,
                      lesson: nextUp.progress.nextLessonSlug,
                    }}
                  >
                    Continue
                    <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* Presentation skill averages from manager grades */}
          {phaseAvgs && phaseAvgs.evalCount > 0 && (
            <section>
              <p className="kicker">Presentation skills</p>
              <span className="rule-brass mt-3" />
              <p className="mt-3 text-sm text-muted">
                Averages from manager grades on your presentation evaluations
                ({phaseAvgs.evalCount} eval{phaseAvgs.evalCount === 1 ? "" : "s"}).
                Focus training on the lowest phases.
              </p>
              {phaseAvgs.overall != null && (
                <p className="mt-4 font-display text-3xl leading-none tabular-nums text-navy">
                  {phaseAvgs.overall}
                  <span className="text-base text-muted"> / 10 overall</span>
                </p>
              )}
              {(thisMonthAvg != null || priorMonthAvg != null) && (
                <p className="mt-2 text-sm text-muted">
                  This month {thisMonthAvg != null ? `${thisMonthAvg}/10` : "—"}
                  {priorMonthAvg != null ? ` · last month ${priorMonthAvg}/10` : ""}
                  {thisMonthAvg != null && priorMonthAvg != null
                    ? thisMonthAvg > priorMonthAvg + 0.2
                      ? " · trending up"
                      : thisMonthAvg < priorMonthAvg - 0.2
                        ? " · focus needed"
                        : " · steady"
                    : ""}
                </p>
              )}
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {phaseAvgs.byPhase.map((phase) => (
                  <li
                    key={phase.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-4 py-3",
                      phase.avg != null && phase.avg < 7
                        ? "border-brass/40 bg-paper-2"
                        : "border-line bg-surface",
                    )}
                  >
                    <span className="text-sm font-medium text-ink">{phase.label}</span>
                    <span className="flex items-center gap-1.5">
                      <PhaseTrend trend={trendById.get(phase.id)} />
                      <span className="tabular-nums text-sm text-navy">
                        {phase.avg != null ? `${phase.avg}/10` : "—"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          
          {/* Auto lesson suggestions from weak phase scores */}
          {suggestions.length > 0 && (
            <section>
              <p className="kicker">Suggested for you</p>
              <span className="rule-brass mt-3" />
              <p className="mt-3 text-sm text-muted">
                Based on your presentation scores under 7. Open a lesson, practice
                on the floor, then watch the next eval move.
              </p>
              <ul className="mt-5 space-y-3">
                {suggestions.map((s) => (
                  <li key={`${s.trackId}-${s.lessonSlug}-${s.phaseId}`}>
                    <Link
                      to="/training/$track/$lesson"
                      params={{ track: s.trackId, lesson: s.lessonSlug }}
                      className="block rounded-md border border-line bg-surface px-4 py-4 shadow-card transition-colors hover:border-brass/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{s.title}</p>
                          <p className="mt-1 text-sm text-muted">{s.reason}</p>
                          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-brass">
                            From {s.phaseLabel} · avg {s.phaseAvg}/10
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-brass">
                          Open <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

{/* Personal Notes */}
          <section>
            <p className="kicker">Your notes</p>
            <span className="rule-brass mt-3" />
            <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-5 shadow-card">
              {notes.length === 0 && !noteDraft && (
                <p className="mb-4 text-sm text-muted">
                  This space is yours. Write the things you want to remember between Clients.
                  Floor-application notes from lessons also land here.
                </p>
              )}
              <div className="space-y-3">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-sm border px-3 py-3",
                      n.pinned ? "border-brass/40 bg-paper-2" : "border-line bg-paper",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-sm leading-relaxed",
                          n.doneAt
                            ? "text-muted line-through decoration-muted/50"
                            : "text-ink",
                        )}
                      >
                        {n.body}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        {n.reminderOn && (
                          <button
                            type="button"
                            onClick={() => void handleMarkDone(n.id, !n.doneAt)}
                            aria-pressed={Boolean(n.doneAt)}
                            className={cn(
                              "rounded p-1",
                              n.doneAt
                                ? "text-brass hover:text-navy"
                                : "text-muted hover:text-navy",
                            )}
                            title={n.doneAt ? "Mark not done" : "Mark done"}
                          >
                            <Check className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeleteNote(n.id)}
                          className="rounded p-1 text-muted hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {n.reminderOn && !n.doneAt && (
                      <p className="mt-1 text-xs text-brass">
                        Reminder: {n.reminderOn}
                      </p>
                    )}
                    {n.doneAt && (
                      <p className="mt-1 text-xs text-muted">
                        Done{n.reminderOn ? ` · was due ${n.reminderOn}` : ""}
                      </p>
                    )}
                    {n.pinned && (
                      <p className="mt-1 flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-brass">
                        <Pin className="size-3" /> Pinned
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddNote} className="mt-4 space-y-2">
                <textarea
                  className="field-input min-h-[4.5rem] resize-y text-sm"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add a note or reminder…"
                  maxLength={4000}
                  rows={2}
                />
                <Button type="submit" size="sm" disabled={savingNote || !noteDraft.trim()}>
                  <Plus className="size-3.5" />
                  {savingNote ? "Saving…" : "Add note"}
                </Button>
              </form>
            </div>
          </section>

          {/* Empty eval coaching */}
          {phaseAvgs && phaseAvgs.evalCount === 0 && (
            <section className="rounded-lg border border-dashed border-line bg-paper px-5 py-6">
              <p className="kicker">Presentation scores</p>
              <p className="mt-3 text-sm text-muted">
                After your first presentation evaluation, phase averages and suggested
                lessons show up here so you know what to practice between Clients.
              </p>
            </section>
          )}

          {/* Favorites */}
          <section>
            <p className="kicker">Favorites</p>
            <span className="rule-brass mt-3" />
            {favorites.length === 0 ? (
              <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-6 text-center shadow-card">
                <Star className="mx-auto size-5 text-brass/60" />
                <p className="mt-2 text-sm text-muted">
                  Star a lesson or track and it will live here for quick access on the floor.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {favorites.map((f) => (
                  <Link
                    key={f.id}
                    to={f.href}
                    className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 shadow-card transition-colors hover:border-navy/20"
                  >
                    <Star className="size-4 shrink-0 fill-brass text-brass" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{f.title}</span>
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                        {f.targetType}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* The Quad */}
          <section>
            <p className="kicker">The Quad</p>
            <span className="rule-brass mt-3" />
            {gameScores.length === 0 ? (
              <div className="mt-5 rounded-lg border border-line bg-surface px-5 py-6 text-center shadow-card">
                <p className="text-sm text-muted">
                  Practice a game in{" "}
                  <Link to="/quad" className="text-navy underline-offset-2 hover:underline">
                    The Quad
                  </Link>{" "}
                  and your plays and best scores show up here.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {gameScores.map((g) => (
                  <Link
                    key={g.slug}
                    to="/quad/$game"
                    params={{ game: g.slug }}
                    className="rounded-md border border-line bg-surface px-4 py-3 shadow-card transition-colors hover:border-navy/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium text-ink">{g.title}</span>
                      {g.bestScore != null && (
                        <span className="shrink-0 rounded-sm bg-brass-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-navy">
                          Best {g.bestScore.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted">
                      {g.plays} {g.plays === 1 ? "play" : "plays"} · {lastPlayedLabel(g.lastPlayedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <p className="kicker">Quick actions</p>
            <span className="rule-brass mt-3" />
            <div className="mt-5 flex flex-wrap gap-2">
              <QuickLink to="/training" label="Training Hall" />
              <QuickLink to="/floor" label="Floor Mode" />
              <QuickLink to="/notifications" label="Inbox" />
              <QuickLink to="/quad" label="The Quad" />
              <QuickLink to="/remarkable" label="Be Remarkable" />
              <QuickLink to="/directory" label="Directory" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function lastPlayedLabel(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DueCard({ assignment: a }: { assignment: MyAssignment }) {
  const dueLabel =
    a.daysUntilDue === null
      ? "No due date"
      : a.isOverdue
        ? `Overdue by ${Math.abs(a.daysUntilDue!)} day${Math.abs(a.daysUntilDue!) === 1 ? "" : "s"}`
        : a.daysUntilDue === 0
          ? "Due today"
          : `Due in ${a.daysUntilDue} day${a.daysUntilDue === 1 ? "" : "s"}`;

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface px-5 py-5 shadow-card",
        a.isOverdue ? "border-danger/40" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-xl leading-snug">{a.trackTitle}</p>
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em]",
            a.isOverdue ? "bg-danger/10 text-danger" : "bg-paper-2 text-brass",
          )}
        >
          {dueLabel}
        </span>
      </div>
      {a.note && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <span className="font-medium text-ink">From {a.assignedByName}: </span>
          {a.note}
        </p>
      )}
      <div className="mt-3">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${a.progress.pct}%` }} />
        </div>
        <p className="mt-1 text-xs tabular-nums text-muted">
          {a.progress.done} of {a.progress.total} · {a.progress.pct}%
        </p>
      </div>
      {a.progress.nextLessonSlug && (
        <Button asChild size="sm" className="mt-4">
          <Link
            to="/training/$track/$lesson"
            params={{ track: a.trackId, lesson: a.progress.nextLessonSlug }}
          >
            Continue
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center rounded-sm border border-line bg-surface px-4 text-sm font-medium text-navy transition-colors hover:border-navy/25 hover:bg-paper-2"
    >
      {label}
    </Link>
  );
}
