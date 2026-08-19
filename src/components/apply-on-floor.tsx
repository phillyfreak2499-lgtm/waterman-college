import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertLockerNote } from "@/lib/locker";

type Props = {
  lessonTitle: string;
  trackTitle?: string;
  lessonKey?: string;
  /** Optional takeaway shown as soft guidance under the prompt */
  takeaway?: string;
};

const STARTERS = [
  "Ask better discovery questions",
  "Demonstrate the fitting sequence",
  "Listen first, then recommend",
  "Use the W.R.A.P. framework",
  "Confirm the fit before recommending",
];

/**
 * End-of-lesson prompt that captures floor-application intent and drops it
 * straight into the learner's Locker notes. Closes the reading → behavior loop.
 */
export function ApplyOnFloor({ lessonTitle, trackTitle, takeaway }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText("");
    setSaved(false);
  }, [lessonTitle]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    setBusy(true);
    try {
      const body = trimmed
        ? `[Apply · ${lessonTitle}] I will use this with my next Client: ${trimmed}`
        : `[Apply · ${lessonTitle}] I will use this with my next Client.`;
      await upsertLockerNote({ data: { body, pinned: false } });
      setSaved(true);
      setText("");
      toast.success("Saved to your Locker notes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save to Locker");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-lg border border-line bg-surface p-6 shadow-card">
      <p className="kicker">Apply on the floor</p>
      <h2 className="mt-3 font-display text-2xl leading-none">
        How will you use this with your next Client?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Capture one concrete action. It lands in{" "}
        <Link
          to="/locker"
          className="underline decoration-brass/40 underline-offset-4 hover:decoration-navy"
        >
          My Locker
        </Link>{" "}
        so you can review it between Clients.
        {trackTitle ? ` · ${trackTitle}` : null}
      </p>
      {takeaway ? (
        <p className="mt-2 text-sm italic leading-relaxed text-navy/70">
          Takeaway: {takeaway}
        </p>
      ) : null}

      {saved ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-navy">Saved. Open your Locker when you want the reminder.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/locker">Open My Locker</Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSaved(false)}>
              Write another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => setText(starter)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-navy/80 transition-colors hover:border-brass/50 hover:text-navy"
              >
                {starter}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="sr-only">I will use this with my next Client</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder="I will use this with my next Client: …"
              className="w-full resize-y rounded-md border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed text-navy placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saving…" : "Save to My Locker"}
            </Button>
            <p className="text-xs text-muted">Optional — even a short line helps it stick.</p>
          </div>
        </form>
      )}
    </section>
  );
}
