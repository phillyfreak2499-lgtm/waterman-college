import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCatalog } from "@/components/catalog-provider";
import { LessonsDesk, StudioTemplates } from "@/components/studio-builder";
import { Button } from "@/components/ui/button";
import { duplicateLesson, reorderLessons } from "@/lib/studio-lessons";
import { cn } from "@/lib/utils";

const PANES = [
  { id: "write", label: "Write" },
  { id: "build", label: "Build" },
  { id: "order", label: "Order" },
] as const;

type Pane = (typeof PANES)[number]["id"];

export function StudioWorkbench({ start = "write" }: { start?: Pane }) {
  const [pane, setPane] = useState<Pane>(start);
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-paper/15">
        {PANES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPane(item.id)}
            className={cn(
              "relative h-11 px-4 text-xs font-medium uppercase tracking-[0.14em]",
              pane === item.id ? "text-paper" : "text-paper/50 hover:text-paper",
            )}
          >
            {item.label}
            <span className={cn("absolute inset-x-3 -bottom-px h-0.5", pane === item.id ? "bg-brass" : "bg-transparent")} />
          </button>
        ))}
      </nav>
      {pane === "write" && <LessonsDesk />}
      {pane === "build" && <StudioTemplates />}
      {pane === "order" && <OrderDesk />}
    </div>
  );
}

function OrderDesk() {
  const { catalog, replace } = useCatalog();
  const [trackId, setTrackId] = useState(catalog.tracks[0]?.id ?? "");
  const current = catalog.tracks.find((track) => track.id === trackId);
  const [slugs, setSlugs] = useState<string[]>(current?.lessons.map((lesson) => lesson.slug) ?? []);
  const [busy, setBusy] = useState(false);

  function load(id: string) {
    const track = catalog.tracks.find((item) => item.id === id);
    setTrackId(id);
    setSlugs(track?.lessons.map((lesson) => lesson.slug) ?? []);
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...slugs];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const hold = next[index];
    next[index] = next[swap];
    next[swap] = hold;
    setSlugs(next);
  }

  async function saveOrder() {
    if (!trackId) return;
    setBusy(true);
    try {
      replace(await reorderLessons({ data: { trackId, slugs } }));
      toast.success("Lesson order is on the campus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    } finally {
      setBusy(false);
    }
  }

  async function copy(slug: string) {
    if (!trackId) return;
    setBusy(true);
    try {
      const next = await duplicateLesson({ data: { trackId, slug } });
      replace(next);
      const track = next.tracks.find((item) => item.id === trackId);
      setSlugs(track?.lessons.map((lesson) => lesson.slug) ?? []);
      toast.success("Copy is on the course.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not copy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
      <h2 className="font-display text-3xl">Order and copy</h2>
      <p className="text-sm text-paper/60">
        Move a lesson up or down. Duplicate one when the next store needs the same day with a different title. Preview opens the live hall as a Specialist sees it.
      </p>
      <label className="block max-w-sm">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Course</span>
        <select
          className="h-11 w-full rounded-sm border border-paper/15 bg-navy-deep px-3 text-paper"
          value={trackId}
          onChange={(e) => load(e.target.value)}
        >
          {catalog.tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
      </label>
      <ul className="divide-y divide-paper/10 border-t border-paper/10">
        {slugs.map((slug, index) => {
          const lesson = current?.lessons.find((item) => item.slug === slug);
          if (!lesson) return null;
          return (
            <li key={slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{lesson.title}</p>
                <p className="text-xs text-paper/50">{lesson.minutes} min</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" className="text-paper/70 hover:text-paper" onClick={() => move(index, -1)}>
                  Up
                </button>
                <button type="button" className="text-paper/70 hover:text-paper" onClick={() => move(index, 1)}>
                  Down
                </button>
                <button type="button" className="text-paper/70 hover:text-paper" onClick={() => void copy(slug)}>
                  Duplicate
                </button>
                <Link
                  to="/training/$track/$lesson"
                  params={{ track: trackId, lesson: slug }}
                  target="_blank"
                  className="text-brass-soft hover:text-paper"
                >
                  Preview
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      <Button type="button" variant="invert" disabled={busy || slugs.length === 0} onClick={() => void saveOrder()}>
        {busy ? "Saving…" : "Save order to campus"}
      </Button>
    </div>
  );
}
