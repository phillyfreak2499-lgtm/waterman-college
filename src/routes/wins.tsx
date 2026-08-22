import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { isOrgWide } from "@/lib/access";
import { pageHead } from "@/lib/page-title";
import { errorMessage } from "@/lib/utils";
import {
  deleteWinStory,
  listWinStories,
  postWinStory,
  type WinStory,
} from "@/lib/win-stories";

export const Route = createFileRoute("/wins")({
  component: WinsPage,
  head: () => pageHead("Win Stories", "Two sentences about a Client who left better than they came in."),
});

function WinsPage() {
  return (
    <SiteShell>
      <AuthGate>
        <WinsWall />
      </AuthGate>
    </SiteShell>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function WinsWall() {
  const { access } = useAccess();
  const [stories, setStories] = useState<WinStory[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const canModerate = isOrgWide(access.role) || access.isAdmin;

  const reload = useCallback(async () => {
    try {
      setStories(await listWinStories());
    } catch (err) {
      toast.error(errorMessage(err) || "Could not load win stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handlePost(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await postWinStory({ data: { body } });
      setDraft("");
      await reload();
      toast.success("Posted. Somebody needed to read that today.");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWinStory({ data: { id } });
      await reload();
    } catch (err) {
      toast.error(errorMessage(err) || "Could not remove");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="kicker">Why we do this</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">
        Win Stories
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Two sentences about a Client who left better than they came in. Post
        yours — someone on another floor needs it more than you know.
      </p>

      <form onSubmit={handlePost} className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-card">
        <textarea
          className="field-input min-h-[5rem] resize-y text-sm"
          placeholder="Fitted a nurse who'd been in pain for 8 years. She teared up walking."
          maxLength={280}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{280 - draft.length} left</p>
          <Button type="submit" size="sm" disabled={busy || draft.trim().length < 10}>
            {busy ? "Posting…" : "Post the win"}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="mt-8 h-32 animate-pulse rounded-lg bg-navy/5" />
      ) : stories.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          No stories yet. Yours could be the first one somebody reads here.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {stories.map((s) => (
            <li key={s.id} className="rounded-lg border border-line bg-surface px-5 py-4 shadow-card">
              <p className="text-[0.95rem] leading-relaxed text-ink">{s.body}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">
                  {s.authorName}
                  {s.store ? ` · ${s.store}` : ""} · {timeAgo(s.createdAt)}
                </p>
                {(s.authorId === access.userId || canModerate) && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(s.id)}
                    className="rounded p-1 text-muted hover:text-danger"
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
