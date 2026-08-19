import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendTrainerNote } from "@/lib/ask-trainer";

export function AskTrainer({ lessonKey }: { lessonKey: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setBody("");
    setSent(false);
  }, [lessonKey]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await sendTrainerNote({ data: { lessonKey, body } });
      setSent(true);
      setBody("");
      toast.success("Sent to the trainer.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-lg border border-line bg-surface p-6 shadow-card">
      <p className="kicker">Ask the trainer</p>
      <h2 className="mt-3 font-display text-2xl leading-none">Stuck on this lesson?</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        One box. It lands in the Chancellor’s inbox next to the check-ins.
      </p>
      {sent ? (
        <p className="mt-4 text-sm text-navy">The trainer has it. Keep going when you can.</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          <textarea
            required
            minLength={4}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What is unclear, or what do you need?"
            className="field-input"
          />
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Sending…" : "Send to the trainer"}
          </Button>
        </form>
      )}
    </section>
  );
}
