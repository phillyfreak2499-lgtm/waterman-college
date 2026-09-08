import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ImageField } from "@/components/image-field";
import { BuilderGate } from "@/components/build/builder-gate";
import { BuilderHelpButton } from "@/components/build/builder-help";
import { arrayMove, buildInputClass, buildAreaClass, MoveButtons } from "@/components/build/common";
import { lintTrack, type LintIssue } from "@/components/build/model";
import {
  archiveTrack,
  deleteLesson,
  deleteTrack,
  duplicateLesson,
  getBuildCatalog,
  publishTrack,
  reorderLessons,
  saveTrack,
  slugify,
  type BuildTrack,
} from "@/lib/cms";
import { isRoleId, type RoleId } from "@/lib/content";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/build_/$track")({
  component: () => (
    <BuilderGate>
      <TrackEditor />
    </BuilderGate>
  ),
  head: () => pageHead("Edit course · Builder"),
});

type TrackForm = {
  role: RoleId;
  title: string;
  nav: string;
  image: string;
  audience: string;
  summary: string;
  visibleToAll: boolean;
};

const BLANK: TrackForm = {
  role: "specialist",
  title: "",
  nav: "",
  image: "/media/campus-cogs.jpg",
  audience: "",
  summary: "",
  visibleToAll: false,
};

function TrackEditor() {
  const { track: trackId } = Route.useParams();
  const router = useRouter();
  const isNew = trackId === "new";
  const [catalog, setCatalog] = useState<BuildTrack[] | null>(isNew ? [] : null);
  const [form, setForm] = useState<TrackForm>(BLANK);
  const [busy, setBusy] = useState(false);

  const current = catalog?.find((t) => t.id === trackId) ?? null;

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getBuildCatalog()
      .then((next) => {
        if (cancelled) return;
        setCatalog(next);
        const found = next.find((t) => t.id === trackId);
        if (found) {
          setForm({
            role: found.role,
            title: found.title,
            nav: found.nav,
            image: found.image,
            audience: found.audience,
            summary: found.summary,
            visibleToAll: found.visibleToAll,
          });
        }
      })
      .catch((err) => !cancelled && toast.error(err instanceof Error ? err.message : "Could not load the course"));
    return () => {
      cancelled = true;
    };
  }, [trackId, isNew]);

  async function refresh() {
    setCatalog(await getBuildCatalog());
  }

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveTrack({
        data: {
          id: isNew ? "" : trackId,
          role: form.role,
          title: form.title,
          nav: form.nav || form.title,
          image: form.image,
          audience: form.audience,
          summary: form.summary,
          visibleToAll: form.visibleToAll,
        },
      });
      toast.success("Course saved");
      if (isNew) {
        await router.navigate({ to: "/build/$track", params: { track: slugify(form.title) } });
      } else {
        await refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the course");
    } finally {
      setBusy(false);
    }
  }

  async function moveLesson(from: number, to: number) {
    if (!current) return;
    const next = arrayMove(current.lessons, from, to);
    setCatalog((prev) => prev?.map((t) => (t.id === current.id ? { ...t, lessons: next } : t)) ?? prev);
    try {
      setCatalog(await reorderLessons({ data: { trackId: current.id, slugs: next.map((l) => l.slug) } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the order");
      await refresh();
    }
  }

  const issues = current ? lintTrack(current) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/build" className="text-xs uppercase tracking-[0.16em] text-brass hover:text-navy">
          ← All courses
        </Link>
        <BuilderHelpButton />
      </div>

      <h1 className="mt-4 font-display text-4xl leading-none">{isNew ? "New course" : form.title || "Course"}</h1>

      <form onSubmit={(e) => void saveMeta(e)} className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input className={buildInputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Audience">
            <input className={buildInputClass} value={form.audience} placeholder="Every Specialist" onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          </Field>
          <Field label="Who can view">
            <select
              className={buildInputClass}
              value={form.visibleToAll ? "all" : form.role}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") setForm({ ...form, visibleToAll: true });
                else if (isRoleId(value)) setForm({ ...form, role: value, visibleToAll: false });
              }}
            >
              <option value="new-hires">New Hires</option>
              <option value="specialist">Specialist</option>
              <option value="mit">MIT</option>
              <option value="managers">Managers</option>
              <option value="all">All (everyone)</option>
            </select>
          </Field>
          <Field label="Short nav name">
            <input className={buildInputClass} value={form.nav} onChange={(e) => setForm({ ...form, nav: e.target.value })} />
          </Field>
        </div>
        <Field label="Summary" hint="The first line a learner reads. Write it to a person.">
          <textarea className={buildAreaClass} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </Field>
        <ImageField label="Course image" value={form.image} withLibrary onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save course"}</Button>
          {!isNew && current && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!confirm("Publish this course and notify the team it is live?")) return;
                  try {
                    await publishTrack({ data: current.id });
                    await refresh();
                    toast.success("Published — the team has been notified");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not publish");
                  }
                }}
              >
                <Rocket className="size-4" /> Publish &amp; notify
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  try {
                    await archiveTrack({ data: { id: current.id, archived: !current.archived } });
                    await refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update");
                  }
                }}
              >
                {current.archived ? "Restore (unhide)" : "Archive (hide)"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Delete this course and every lesson in it? This cannot be undone.")) return;
                  try {
                    await deleteTrack({ data: current.id });
                    toast.success("Course deleted");
                    await router.navigate({ to: "/build" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not delete");
                  }
                }}
              >
                Delete course
              </Button>
            </>
          )}
        </div>
      </form>

      {!isNew && current && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-3xl">Lessons</h2>
            <Link
              to="/build/$track/$lesson"
              params={{ track: current.id, lesson: "new" }}
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-navy px-3 text-sm font-medium text-paper hover:bg-navy-deep"
            >
              <Plus className="size-4" /> Add lesson
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {current.lessons.map((lesson, index) => (
              <li key={lesson.slug} className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-3">
                <MoveButtons index={index} count={current.lessons.length} onMove={(f, t) => void moveLesson(f, t)} label="lesson" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted">
                    {lesson.minutes} min{lesson.slides && lesson.slides.length ? ` · ${lesson.slides.length} slides` : ""}
                  </p>
                </div>
                <Link
                  to="/build/$track/$lesson"
                  params={{ track: current.id, lesson: lesson.slug }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-sm text-navy hover:border-navy/40"
                >
                  <Pencil className="size-4" /> Edit
                </Link>
                <button
                  type="button"
                  title="Duplicate"
                  aria-label="Duplicate lesson"
                  className="grid h-9 w-9 place-items-center rounded-sm border border-line text-navy hover:border-navy/40"
                  onClick={async () => {
                    try {
                      setCatalog(await duplicateLesson({ data: { trackId: current.id, slug: lesson.slug } }));
                      toast.success("Lesson duplicated");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not duplicate");
                    }
                  }}
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  aria-label="Delete lesson"
                  className="grid h-9 w-9 place-items-center rounded-sm border border-line text-danger hover:bg-paper-2"
                  onClick={async () => {
                    if (!confirm(`Delete the lesson "${lesson.title}"?`)) return;
                    try {
                      await deleteLesson({ data: { trackId: current.id, slug: lesson.slug } });
                      await refresh();
                      toast.success("Lesson removed");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not remove");
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
            {current.lessons.length === 0 && (
              <li className="rounded-md border border-dashed border-line bg-paper-2 px-4 py-8 text-center text-sm text-muted">
                No lessons yet. Add the first one.
              </li>
            )}
          </ul>

          <PreflightList issues={issues} />
        </>
      )}
    </div>
  );
}

function PreflightList({ issues }: { issues: LintIssue[] }) {
  const warns = issues.filter((i) => i.level === "warn");
  const infos = issues.filter((i) => i.level === "info");
  return (
    <div className="mt-10 rounded-lg border border-line bg-paper-2 p-5">
      <h3 className="font-display text-2xl">Pre-flight check</h3>
      {issues.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing to flag. This course is ready to publish.</p>
      ) : (
        <>
          {warns.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {warns.map((issue, i) => (
                <li key={`w${i}`} className="text-sm text-danger">
                  <span className="font-medium">{issue.where}:</span> {issue.message}
                </li>
              ))}
            </ul>
          )}
          {infos.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {infos.map((issue, i) => (
                <li key={`i${i}`} className="text-sm text-muted">
                  <span className="font-medium">{issue.where}:</span> {issue.message}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
