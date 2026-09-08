import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInputClass } from "@/components/build/common";
import { blockToLine, type BodyBlock } from "@/components/build/model";
import { lessonLineKey, tagOfLine } from "@/lib/lesson-tags";
import {
  deleteLessonLink,
  listLessonLinks,
  saveLessonLink,
  type LessonLink,
} from "@/lib/lesson-links";

/**
 * Attach a destination to each tagged line in the lesson. Keyed by
 * lessonLineKey (tag + first words), so it survives copy edits and reordering.
 * Save the lesson body first so the line the office links matches what learners
 * read.
 */
export function LinkAttacher({
  trackId,
  lessonSlug,
  blocks,
}: {
  trackId: string;
  lessonSlug: string;
  blocks: BodyBlock[];
}) {
  const [links, setLinks] = useState<Record<string, LessonLink>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId || !lessonSlug) return;
    let cancelled = false;
    listLessonLinks({ data: { trackId, lessonSlug } })
      .then((rows) => {
        if (cancelled) return;
        setLinks(Object.fromEntries(rows.map((r) => [r.lineKey, r])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [trackId, lessonSlug]);

  const taggedLines = blocks
    .filter((b) => b.tag)
    .map((b) => {
      const line = blockToLine(b);
      return { block: b, line, key: lessonLineKey(line), tag: tagOfLine(line) };
    })
    .filter((row): row is { block: BodyBlock; line: string; key: string; tag: NonNullable<ReturnType<typeof tagOfLine>> } =>
      Boolean(row.key && row.tag),
    );

  async function attach(key: string, tag: string, text: string) {
    const url = drafts[key] ?? links[key]?.url ?? "";
    setBusyKey(key);
    try {
      const saved = await saveLessonLink({
        data: { trackId, lessonSlug, lineKey: key, tag, label: text.slice(0, 120), url },
      });
      setLinks((prev) => ({ ...prev, [key]: saved }));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success("Link attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach the link");
    } finally {
      setBusyKey(null);
    }
  }

  async function detach(key: string) {
    setBusyKey(key);
    try {
      await deleteLessonLink({ data: { trackId, lessonSlug, lineKey: key } });
      setLinks((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success("Link removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the link");
    } finally {
      setBusyKey(null);
    }
  }

  if (taggedLines.length === 0) {
    return (
      <p className="text-sm text-muted">
        No tagged lines yet. Add a VIDEO, GFA, ROLEPLAY, FORM, or SOLUTION line in the body, save, then attach its link here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {taggedLines.map(({ key, tag, block }) => {
        const existing = links[key];
        const value = drafts[key] ?? existing?.url ?? "";
        return (
          <div key={key} className="rounded-md border border-line bg-surface p-3">
            <p className="text-sm">
              <span className="mr-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-brass">{tag}</span>
              {block.text || <span className="text-muted">(empty line)</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className={`${buildInputClass} flex-1`}
                placeholder="https://…"
                value={value}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
              />
              <Button
                type="button"
                size="sm"
                disabled={busyKey === key || !value.trim()}
                onClick={() => void attach(key, tag, block.text)}
              >
                <Link2 className="size-4" /> {existing ? "Update" : "Attach"}
              </Button>
              {existing && (
                <Button type="button" size="sm" variant="ghost" disabled={busyKey === key} onClick={() => void detach(key)}>
                  <Link2Off className="size-4" /> Remove
                </Button>
              )}
            </div>
            {existing && (
              <p className="mt-1 truncate text-xs text-muted">Linked → {existing.url}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
