import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Copy, Download, FilePlus2, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderGate } from "@/components/build/builder-gate";
import { BuilderHelpButton } from "@/components/build/builder-help";
import { arrayMove, MoveButtons } from "@/components/build/common";
import { COURSE_TEMPLATES } from "@/components/build/model";
import {
  archiveTrack,
  duplicateTrack,
  exportTrack,
  getBuildCatalog,
  importTrack,
  reorderTracks,
  saveLesson,
  saveTrack,
  slugify,
  type BuildTrack,
  type TrackBundle,
} from "@/lib/cms";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/build")({
  component: () => (
    <BuilderGate>
      <BuildIndex />
    </BuilderGate>
  ),
  head: () => pageHead("Training Building Center", "Build and publish trainings for the college."),
});

const ROLE_LABEL: Record<string, string> = {
  "new-hires": "New Hires",
  specialist: "Specialist",
  mit: "MIT",
  managers: "Managers",
};

function BuildIndex() {
  const router = useRouter();
  const [tracks, setTracks] = useState<BuildTrack[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getBuildCatalog()
      .then((next) => !cancelled && setTracks(next))
      .catch((err) => !cancelled && toast.error(err instanceof Error ? err.message : "Could not load courses"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function move(from: number, to: number) {
    if (!tracks) return;
    const next = arrayMove(tracks, from, to);
    setTracks(next); // optimistic
    try {
      setTracks(await reorderTracks({ data: { ids: next.map((t) => t.id) } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the order");
      setTracks(await getBuildCatalog());
    }
  }

  async function startTemplate(templateId: string) {
    const template = COURSE_TEMPLATES.find((t) => t.id === templateId);
    if (!template || busy) return;
    setBusy(true);
    try {
      const title = template.name;
      await saveTrack({
        data: { id: "", role: "specialist", title, nav: title, image: "/media/campus-cogs.jpg", audience: "", summary: template.blurb, visibleToAll: false },
      });
      const id = slugify(title);
      for (const lesson of template.lessons) {
        await saveLesson({
          data: {
            trackId: id,
            slug: "",
            title: lesson.title,
            minutes: lesson.minutes,
            kicker: lesson.kicker,
            body: lesson.body,
            takeaway: lesson.takeaway,
            evalPhases: [],
          },
        });
      }
      toast.success("Course created from template");
      await router.navigate({ to: "/build/$track", params: { track: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the course");
    } finally {
      setBusy(false);
    }
  }

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const bundle = JSON.parse(await file.text()) as TrackBundle;
      setTracks(await importTrack({ data: bundle }));
      toast.success("Course imported as a draft");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import that file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onExport(id: string, title: string) {
    try {
      const bundle = await exportTrack({ data: id });
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(title)}.course.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export the course");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Training Building Center</p>
          <h1 className="mt-2 font-display text-5xl leading-none">Build a training</h1>
          <p className="mt-3 max-w-xl text-muted">
            Every course on the campus, in one workshop. Create, arrange, and publish — the same care we ask
            Specialists to bring to the chair.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BuilderHelpButton />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void onImportFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="size-4" /> Import
          </Button>
          <Link
            to="/build/$track"
            params={{ track: "new" }}
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-navy px-4 text-sm font-medium text-paper hover:bg-navy-deep"
          >
            <FilePlus2 className="size-4" /> New course
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-line bg-surface p-4">
        <p className="text-sm font-medium">Start from a template</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COURSE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={busy}
              onClick={() => void startTemplate(template.id)}
              className="rounded-sm border border-line bg-paper px-3 py-2 text-left text-sm hover:border-navy/40 disabled:opacity-50"
              title={template.blurb}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {tracks === null ? (
        <div className="mt-8 h-40 animate-pulse rounded-md bg-navy/5" />
      ) : (
        <ul className="mt-8 space-y-3">
          {tracks.map((track, index) => (
            <li
              key={track.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-4",
                track.archived ? "border-dashed border-line opacity-70" : "border-line",
              )}
            >
              <MoveButtons index={index} count={tracks.length} onMove={(f, t) => void move(f, t)} label="course" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl leading-tight">{track.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {track.visibleToAll ? "Everyone" : ROLE_LABEL[track.role] ?? track.role} · {track.lessons.length} lesson
                  {track.lessons.length === 1 ? "" : "s"}
                  {track.archived ? " · Archived (draft)" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  to="/build/$track"
                  params={{ track: track.id }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-sm text-navy hover:border-navy/40"
                >
                  <Pencil className="size-4" /> Edit
                </Link>
                <IconBtn label="Duplicate" onClick={async () => {
                  try {
                    setTracks(await duplicateTrack({ data: track.id }));
                    toast.success("Course duplicated (as a draft)");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not duplicate");
                  }
                }}>
                  <Copy className="size-4" />
                </IconBtn>
                <IconBtn label="Export" onClick={() => void onExport(track.id, track.title)}>
                  <Download className="size-4" />
                </IconBtn>
                <IconBtn
                  label={track.archived ? "Restore" : "Archive"}
                  onClick={async () => {
                    try {
                      await archiveTrack({ data: { id: track.id, archived: !track.archived } });
                      setTracks(await getBuildCatalog());
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not update");
                    }
                  }}
                >
                  {track.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                </IconBtn>
              </div>
            </li>
          ))}
          {tracks.length === 0 && (
            <li className="rounded-lg border border-dashed border-line bg-paper-2 px-4 py-10 text-center text-muted">
              No courses yet. Start from a template or create a new course.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-sm border border-line text-navy hover:border-navy/40"
    >
      {children}
    </button>
  );
}
