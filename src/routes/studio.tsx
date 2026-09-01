import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { LessonLinksEditor } from "@/components/admin-lesson-links";
import { QuizEditor, QuizInbox } from "@/components/admin-quizzes";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { useCatalog } from "@/components/catalog-provider";
import { Redirect } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { listTrainerNotes, markNoteReviewed, type TrainerNote } from "@/lib/ask-trainer";
import {
  archiveTrack,
  deleteLesson,
  deleteMedia,
  deleteNews,
  deleteTrack,
  listMedia,
  listOfficeTracks,
  saveLesson,
  saveNews,
  saveTrack,
  slugify,
  uploadMedia,
  type LessonInput,
  type MediaItem,
  type NewsItem,
  type TrackInput,
} from "@/lib/cms";
import { isRoleId } from "@/lib/content";
import { assignTraining, getTeam, revokeTraining, type TeamSnapshot } from "@/lib/org";
import { pageHead } from "@/lib/page-title";
import { QUAD_GAMES } from "@/lib/quad";
import { getStudioDesk, listStudioRoles, setStudioRoleAccess, type StudioDesk } from "@/lib/studio";
import type { RbacRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  head: () => pageHead("Training Office", "Create courses, upload media, and publish training onto the campus."),
});

const TABS = [
  { id: "desk", label: "Desk" },
  { id: "courses", label: "Courses" },
  { id: "library", label: "Library" },
  { id: "news", label: "Publish" },
  { id: "quizzes", label: "Quizzes" },
  { id: "links", label: "Links" },
  { id: "inbox", label: "Inbox" },
  { id: "assign", label: "Assign" },
  { id: "doors", label: "Doors" },
  { id: "tools", label: "Tools" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function StudioPage() {
  return (
    <AuthGate>
      <Gate />
    </AuthGate>
  );
}

function Gate() {
  const { access, ready } = useAccess();
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-navy-deep text-brass-soft">
        Opening the Training Office…
      </div>
    );
  }
  if (!access.canOpenStudio) return <Redirect to="/" />;
  return <Office />;
}

function Office() {
  const { user } = useCurrentUserState();
  const [tab, setTab] = useState<Tab>("desk");
  return (
    <div className="min-h-dvh bg-navy-deep text-paper">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-brass-soft">
              Professor · Restricted
            </p>
            <h1 className="font-display text-2xl leading-none sm:text-3xl">Training Office</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-brass-soft">{user?.displayName ?? "Professor"}</span>
            <Link to="/" className="text-paper/70 hover:text-paper">
              Campus
            </Link>
            <Link to="/training" search={{}} className="text-paper/70 hover:text-paper">
              Hall
            </Link>
            <button type="button" className="text-paper/70 hover:text-paper" onClick={() => void signOut("/")}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 sm:px-8">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative h-11 shrink-0 px-4 text-xs font-medium uppercase tracking-[0.14em]",
                tab === item.id ? "text-paper" : "text-paper/50 hover:text-paper",
              )}
            >
              {item.label}
              <span className={cn("absolute inset-x-3 -bottom-px h-0.5", tab === item.id ? "bg-brass" : "bg-transparent")} />
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {tab === "desk" && <Desk onJump={setTab} />}
        {tab === "courses" && <CoursesDesk />}
        {tab === "library" && <LibraryDesk />}
        {tab === "news" && <PublishDesk />}
        {tab === "quizzes" && (
          <PaperPanel title="Quizzes">
            <QuizEditor />
            <div className="mt-10">
              <QuizInbox />
            </div>
          </PaperPanel>
        )}
        {tab === "links" && (
          <PaperPanel title="Lesson links">
            <LessonLinksEditor />
          </PaperPanel>
        )}
        {tab === "inbox" && <InboxDesk />}
        {tab === "assign" && <AssignDesk />}
        {tab === "doors" && <DoorsDesk />}
        {tab === "tools" && <ToolsDesk />}
      </main>
    </div>
  );
}

function Desk({ onJump }: { onJump: (tab: Tab) => void }) {
  const [desk, setDesk] = useState<StudioDesk | null>(null);
  useEffect(() => {
    getStudioDesk()
      .then(setDesk)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not open the desk"));
  }, []);
  return (
    <div className="space-y-8">
      <section>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brass-soft">
          Walk in. Build it. Put it on the campus.
        </p>
        <h2 className="mt-2 font-display text-4xl">Your studio</h2>
        <p className="mt-3 max-w-2xl text-sm text-paper/65">
          Courses, photos, quizzes, links, and assignments leave this office and land on the live hall.
          Flip a door and a position sees it — or does not.
        </p>
      </section>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Live courses" value={desk ? String(desk.liveCourses) : "—"} />
        <Stat label="Drafts" value={desk ? String(desk.draftCourses) : "—"} />
        <Stat label="Open questions" value={desk ? String(desk.pendingQuestions) : "—"} />
        <Stat label="On the roster" value={desk ? String(desk.roster) : "—"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Jump label="Write a course" onClick={() => onJump("courses")} />
        <Jump label="Upload media" onClick={() => onJump("library")} />
        <Jump label="Answer the inbox" onClick={() => onJump("inbox")} />
        <Jump label="Toggle doors" onClick={() => onJump("doors")} />
      </div>
      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Ask the professor</h2>
          <button type="button" className="text-sm text-brass-soft hover:text-paper" onClick={() => onJump("inbox")}>
            Full inbox
          </button>
        </div>
        {!desk ? (
          <p className="mt-3 text-sm text-paper/55">Loading the desk…</p>
        ) : desk.notes.length === 0 ? (
          <p className="mt-3 text-sm text-paper/55">No questions yet. When a Specialist gets stuck, it lands here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
            {desk.notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="text-sm text-brass-soft">
                  {note.userName}
                  {note.store ? ` · ${note.store}` : ""} · {note.trackTitle}
                </p>
                <p className="mt-1 text-sm text-paper/80">{note.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CoursesDesk() {
  const { catalog, replace } = useCatalog();
  const emptyTrack = (): TrackInput => ({
    id: "",
    role: "specialist",
    title: "",
    nav: "",
    image: "/media/campus-cogs.jpg",
    audience: "",
    summary: "",
    visibleToAll: false,
  });
  const emptyLesson = (trackId: string): LessonInput => ({
    trackId,
    slug: "",
    title: "",
    minutes: 8,
    kicker: "",
    body: "",
    takeaway: "",
    evalPhases: [],
  });
  const [trackForm, setTrackForm] = useState<TrackInput>(emptyTrack());
  const [lessonForm, setLessonForm] = useState<LessonInput>(emptyLesson(""));
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = catalog.tracks.find((track) => track.id === selected);

  async function saveCurrentTrack(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = trackForm.id || slugify(trackForm.title);
      const next = await saveTrack({
        data: { ...trackForm, id, nav: trackForm.nav || trackForm.title },
      });
      replace(next);
      setSelected(id);
      setTrackForm({ ...trackForm, id });
      toast.success("Course is on the campus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentLesson(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const next = await saveLesson({
        data: {
          ...lessonForm,
          trackId: selected,
          slug: lessonForm.slug || slugify(lessonForm.title),
        },
      });
      replace(next);
      toast.success("Lesson saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <div>
        <Button
          type="button"
          variant="invert"
          className="w-full"
          onClick={() => {
            setSelected(null);
            setTrackForm(emptyTrack());
            setLessonForm(emptyLesson(""));
          }}
        >
          New course
        </Button>
        <ul className="mt-4 space-y-1">
          {catalog.tracks.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(track.id);
                  setTrackForm({
                    id: track.id,
                    role: track.role,
                    title: track.title,
                    nav: track.nav,
                    image: track.image,
                    audience: track.audience,
                    summary: track.summary,
                    visibleToAll: track.visibleToAll,
                  });
                  setLessonForm(emptyLesson(track.id));
                }}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-sm px-3 text-left text-sm",
                  selected === track.id ? "bg-brass text-navy-deep" : "hover:bg-navy",
                )}
              >
                <span className="truncate">{track.title}</span>
                <span className="ml-2 tabular-nums opacity-70">{track.lessons.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-10">
        <form onSubmit={(e) => void saveCurrentTrack(e)} className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
          <h2 className="font-display text-3xl">{trackForm.id ? "Edit course" : "New course"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input className={darkInput} value={trackForm.title} onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })} required />
            </Field>
            <Field label="Audience">
              <input className={darkInput} value={trackForm.audience} onChange={(e) => setTrackForm({ ...trackForm, audience: e.target.value })} placeholder="Every Specialist" />
            </Field>
            <Field label="Who sees it on campus">
              <select
                className={darkInput}
                value={trackForm.visibleToAll ? "all" : trackForm.role}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "all") setTrackForm({ ...trackForm, visibleToAll: true });
                  else if (isRoleId(value)) setTrackForm({ ...trackForm, role: value, visibleToAll: false });
                }}
              >
                <option value="new-hires">New Hires only</option>
                <option value="specialist">Specialists (and above)</option>
                <option value="mit">MIT path</option>
                <option value="managers">Managers</option>
                <option value="all">Every position</option>
              </select>
            </Field>
            <Field label="Short nav name">
              <input className={darkInput} value={trackForm.nav} onChange={(e) => setTrackForm({ ...trackForm, nav: e.target.value })} />
            </Field>
          </div>
          <Field label="Summary — this is what they read in the hall">
            <textarea className={`${darkInput} min-h-20 py-2`} value={trackForm.summary} onChange={(e) => setTrackForm({ ...trackForm, summary: e.target.value })} />
          </Field>
          <ImageUpload label="Course image" value={trackForm.image} onChange={(url) => setTrackForm({ ...trackForm, image: url })} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="invert" disabled={busy}>
              {busy ? "Saving…" : "Save to campus"}
            </Button>
            {trackForm.id && (
              <>
                <Button
                  type="button"
                  variant="brass"
                  onClick={() => {
                    void archiveTrack({ data: { id: trackForm.id, archived: true } })
                      .then(replace)
                      .then(() => toast.success("Moved to drafts."))
                      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not archive"));
                  }}
                >
                  Archive
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-paper"
                  onClick={() => {
                    if (!confirm("Permanently remove this course and its lessons?")) return;
                    void deleteTrack({ data: trackForm.id })
                      .then((next) => {
                        replace(next);
                        setSelected(null);
                        setTrackForm(emptyTrack());
                        toast.success("Course removed.");
                      })
                      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove"));
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </form>

        {current && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl">Lessons</h3>
              <ul className="mt-3 space-y-2">
                {current.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-sm border border-paper/15 bg-navy-deep px-3 text-left text-sm hover:border-brass/40"
                      onClick={() =>
                        setLessonForm({
                          trackId: current.id,
                          slug: lesson.slug,
                          title: lesson.title,
                          minutes: lesson.minutes,
                          kicker: lesson.kicker ?? "",
                          body: lesson.body.join("\n\n"),
                          takeaway: lesson.takeaway ?? "",
                          evalPhases: lesson.evalPhases ?? [],
                        })
                      }
                    >
                      <span className="truncate">{lesson.title}</span>
                      <span className="ml-2 text-paper/50">{lesson.minutes}m</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="invert" className="mt-3" onClick={() => setLessonForm(emptyLesson(current.id))}>
                Add a lesson
              </Button>
            </div>
            <form onSubmit={(e) => void saveCurrentLesson(e)} className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
              <h3 className="font-display text-2xl">{lessonForm.slug ? "Edit lesson" : "New lesson"}</h3>
              <Field label="Title">
                <input className={darkInput} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minutes">
                  <input
                    className={darkInput}
                    type="number"
                    min={1}
                    value={lessonForm.minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, minutes: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Kicker">
                  <input className={darkInput} value={lessonForm.kicker} onChange={(e) => setLessonForm({ ...lessonForm, kicker: e.target.value })} />
                </Field>
              </div>
              <Field label="Lesson text" hint="Blank line between paragraphs. Tag lines with VIDEO ·, ROLEPLAY ·, GFA · to attach links later.">
                <textarea
                  className={`${darkInput} min-h-40 py-2`}
                  rows={8}
                  value={lessonForm.body}
                  onChange={(e) => setLessonForm({ ...lessonForm, body: e.target.value })}
                  required
                />
              </Field>
              <Field label="Takeaway">
                <input className={darkInput} value={lessonForm.takeaway} onChange={(e) => setLessonForm({ ...lessonForm, takeaway: e.target.value })} />
              </Field>
              <fieldset className="rounded-md border border-paper/15 px-4 py-3">
                <legend className="px-1 text-sm">Presentation phases this lesson strengthens</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["welcome", "interview", "analysis", "fitting", "solution", "close"] as const).map((id) => {
                    const on = (lessonForm.evalPhases || []).includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const cur = lessonForm.evalPhases || [];
                          setLessonForm({
                            ...lessonForm,
                            evalPhases: on ? cur.filter((phase) => phase !== id) : [...cur, id],
                          });
                        }}
                        className={
                          on
                            ? "rounded-sm border border-brass bg-brass px-3 py-1.5 text-xs font-medium text-navy-deep"
                            : "rounded-sm border border-paper/20 px-3 py-1.5 text-xs font-medium text-paper hover:border-brass/40"
                        }
                      >
                        {id[0].toUpperCase() + id.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="invert" disabled={busy}>
                  {busy ? "Saving…" : "Save lesson"}
                </Button>
                {lessonForm.slug && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-paper"
                    onClick={() => {
                      if (!confirm("Remove this lesson?")) return;
                      void deleteLesson({ data: { trackId: current.id, slug: lessonForm.slug } })
                        .then((next) => {
                          replace(next);
                          setLessonForm(emptyLesson(current.id));
                          toast.success("Lesson removed.");
                        })
                        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove"));
                    }}
                  >
                    Delete lesson
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryDesk() {
  const [items, setItems] = useState<MediaItem[]>([]);
  useEffect(() => {
    listMedia()
      .then(setItems)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load uploads"));
  }, []);
  return (
    <div>
      <h2 className="font-display text-3xl">Media library</h2>
      <p className="mt-2 text-sm text-paper/60">
        Upload a photo, then drop it on a course, a lesson card, or a Be Remarkable post. Keep files under 1.5 MB.
      </p>
      <div className="mt-5">
        <ImageUpload
          label="Upload an image"
          value=""
          onChange={() => {
            listMedia()
              .then(setItems)
              .catch((error) => toast.error(error instanceof Error ? error.message : "Could not refresh"));
          }}
          onUploaded={(item) => setItems((prev) => [item, ...prev])}
        />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-md border border-paper/15 bg-navy">
            <img src={item.data} alt="" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-paper/60">
              <span className="truncate">{item.filename}</span>
              <button
                type="button"
                className="shrink-0 text-brass-soft hover:text-paper"
                onClick={() => {
                  if (!confirm(`Delete ${item.filename}?`)) return;
                  void deleteMedia({ data: item.id })
                    .then(() => {
                      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
                      toast.success("Removed.");
                    })
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove"));
                }}
              >
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function PublishDesk() {
  const { catalog, replace } = useCatalog();
  const blank: NewsItem = {
    id: "",
    slug: "",
    title: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    body: "",
    image: null,
  };
  const [editing, setEditing] = useState<NewsItem>(blank);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      replace(await saveNews({ data: editing }));
      setEditing(blank);
      toast.success("Posted to Be Remarkable.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="font-display text-3xl">On the campus</h2>
        <p className="mt-2 text-sm text-paper/60">These posts appear on Be Remarkable the moment you save.</p>
        <ul className="mt-4 space-y-3">
          {catalog.news.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-paper/15 bg-navy p-4">
              <button type="button" className="min-w-0 text-left" onClick={() => setEditing(item)}>
                <p className="text-xs text-paper/50">{item.date}</p>
                <p className="font-display text-2xl leading-tight">{item.title}</p>
              </button>
              <button
                type="button"
                className="h-11 shrink-0 px-2 text-sm text-paper/55 hover:text-paper"
                onClick={() => {
                  if (!confirm("Remove this post?")) return;
                  void deleteNews({ data: item.id })
                    .then(replace)
                    .then(() => toast.success("Post removed."))
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove"));
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
        <h3 className="font-display text-2xl">{editing.id ? "Edit post" : "New post"}</h3>
        <Field label="Title">
          <input className={darkInput} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
        </Field>
        <Field label="Date">
          <input className={darkInput} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
        </Field>
        <Field label="Body">
          <textarea className={`${darkInput} min-h-28 py-2`} rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} required />
        </Field>
        <ImageUpload label="Optional image" value={editing.image ?? ""} onChange={(url) => setEditing({ ...editing, image: url || null })} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="invert" disabled={busy}>
            {busy ? "Saving…" : editing.id ? "Save post" : "Publish"}
          </Button>
          {editing.id && (
            <Button type="button" variant="ghost" className="text-paper" onClick={() => setEditing(blank)}>
              New post
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function InboxDesk() {
  const [notes, setNotes] = useState<TrainerNote[]>([]);
  useEffect(() => {
    listTrainerNotes()
      .then(setNotes)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load questions"));
  }, []);
  return (
    <div>
      <h2 className="font-display text-3xl">Ask the professor</h2>
      <p className="mt-2 text-sm text-paper/60">Questions from lessons land on this desk.</p>
      <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
        {notes.map((note) => (
          <li key={note.id} className="py-4">
            <p className="text-sm text-brass-soft">
              {note.userName}
              {note.store ? ` · ${note.store}` : ""} · {note.trackTitle} · {note.lessonTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{note.body}</p>
            <p className="mt-2 text-xs text-paper/40">
              {note.createdAt.slice(0, 16).replace("T", " ")}
              {note.reviewedAt ? " · reviewed" : ""}
            </p>
            {!note.reviewedAt && (
              <Button
                size="sm"
                variant="invert"
                className="mt-3"
                onClick={() => {
                  void markNoteReviewed({ data: note.id })
                    .then(setNotes)
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not update"));
                }}
              >
                Mark reviewed
              </Button>
            )}
          </li>
        ))}
        {!notes.length && <li className="py-6 text-sm text-paper/55">No questions yet.</li>}
      </ul>
    </div>
  );
}

function AssignDesk() {
  const [team, setTeam] = useState<TeamSnapshot | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    getTeam()
      .then(setTeam)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load the roster"));
  }, []);
  const people = (team?.people ?? []).filter((person) => {
    const hay = `${person.name} ${person.store ?? ""} ${person.roleLabel}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });
  return (
    <div>
      <h2 className="font-display text-3xl">Assign a course</h2>
      <p className="mt-2 text-sm text-paper/60">
        Put a course on someone’s path. It shows in their Locker the next time they open campus.
      </p>
      <input className={`${darkInput} mt-4 max-w-xs`} placeholder="Search the roster" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
        {people.map((person) => (
          <li key={person.id} className="grid gap-3 py-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-paper/55">
                {person.roleLabel}
                {person.store ? ` · ${person.store}` : ""} · {person.pct}% of path
              </p>
              {person.assignments.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-paper/50">
                  {person.assignments.map((assignment) => (
                    <li key={assignment.id} className="flex items-center gap-2">
                      <span>{assignment.trackTitle}</span>
                      <button
                        type="button"
                        className="text-brass-soft hover:text-paper"
                        onClick={() => {
                          void revokeTraining({ data: { assignmentId: assignment.id } })
                            .then(setTeam)
                            .catch((error) => toast.error(error instanceof Error ? error.message : "Could not revoke"));
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select
              className={darkInput}
              defaultValue=""
              onChange={(e) => {
                const trackId = e.target.value;
                e.target.value = "";
                if (!trackId) return;
                void assignTraining({ data: { userId: person.id, trackId } })
                  .then(setTeam)
                  .then(() => toast.success(`Assigned to ${person.name}.`))
                  .catch((error) => toast.error(error instanceof Error ? error.message : "Could not assign"));
              }}
            >
              <option value="">Assign a course…</option>
              {(team?.tracks ?? []).map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {team && !people.length && <p className="mt-6 text-sm text-paper/55">No one matches.</p>}
    </div>
  );
}

function DoorsDesk() {
  const { catalog, replace } = useCatalog();
  const { access } = useAccess();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listOfficeTracks>>>([]);
  const [roles, setRoles] = useState<RbacRole[] | null>(null);
  const canFlipOffice = access.isChancellor || access.perms.manageUsers;

  useEffect(() => {
    listOfficeTracks()
      .then(setRows)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load courses"));
    if (canFlipOffice) {
      listStudioRoles()
        .then(setRoles)
        .catch(() => setRoles([]));
    }
  }, [canFlipOffice, catalog.tracks]);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-3xl">Course doors</h2>
        <p className="mt-2 text-sm text-paper/60">
          Each course lives on a door. Change the door and it appears — or disappears — for that position on the live hall.
          Archive hides it from everyone without deleting the work.
        </p>
        <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
          {rows.map((track) => (
            <li key={track.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_12rem_auto] sm:items-center">
              <div>
                <p className="font-medium">{track.title}</p>
                <p className="text-sm text-paper/55">
                  {track.lessons} lessons · {track.archived ? "draft" : "live"} · updated {track.updatedAt}
                </p>
              </div>
              <select
                className={darkInput}
                value={track.visibleToAll ? "all" : track.role}
                onChange={(e) => {
                  const value = e.target.value;
                  void saveTrack({
                    data: {
                      id: track.id,
                      role: value === "all" ? "specialist" : isRoleId(value) ? value : "specialist",
                      title: track.title,
                      nav: track.title,
                      image: "/media/campus-cogs.jpg",
                      audience: "",
                      summary: track.summary,
                      visibleToAll: value === "all",
                    },
                  })
                    .then((next) => {
                      replace(next);
                      return listOfficeTracks().then(setRows);
                    })
                    .then(() => toast.success("Door updated."))
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not update"));
                }}
              >
                <option value="new-hires">New Hires</option>
                <option value="specialist">Specialists</option>
                <option value="mit">MIT</option>
                <option value="managers">Managers</option>
                <option value="all">Every position</option>
              </select>
              <Button
                size="sm"
                variant={track.archived ? "brass" : "invert"}
                onClick={() => {
                  void archiveTrack({ data: { id: track.id, archived: !track.archived } })
                    .then(replace)
                    .then(() => listOfficeTracks().then(setRows))
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not update"));
                }}
              >
                {track.archived ? "Publish" : "Unpublish"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {canFlipOffice && (
        <section>
          <h2 className="font-display text-3xl">Who can open this office</h2>
          <p className="mt-2 text-sm text-paper/60">
            Flip a position and that role sees Training Office in the nav — or loses it. The Chancellor always keeps a key.
          </p>
          <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
            {(roles ?? []).map((role) => {
              const open = role.id === "super-admin" || role.perms.viewStudio || role.perms.manageTraining;
              return (
                <li key={role.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-paper/55">{role.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={open ? "brass" : "invert"}
                    disabled={role.id === "super-admin"}
                    onClick={() => {
                      void setStudioRoleAccess({ data: { roleId: role.id, open: !open } })
                        .then(setRoles)
                        .then(() => toast.success(open ? "Office closed for that position." : "Office opened for that position."))
                        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not update"));
                    }}
                  >
                    {open ? "On" : "Off"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function ToolsDesk() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-3xl">Campus tools</h2>
        <p className="mt-2 text-sm text-paper/60">
          Floor mode, huddles, health, and the Quad games. Send people here from a lesson, or open them while you coach.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard to="/floor" label="Floor mode" blurb="Large targets between Clients." />
          <ToolCard to="/huddle" label="Huddle pack" blurb="Run the morning stand-up from one page." />
          <ToolCard to="/team/health" label="Training health" blurb="Who is behind. Who needs an eval." />
          <ToolCard to="/team" label="Team desk" blurb="Evaluate a presentation. Assign a path." />
          <ToolCard to="/locker" label="My Locker" blurb="See campus the way a Specialist sees it." />
          <ToolCard to="/quad" label="The Quad" blurb="Every practice game in one courtyard." />
        </div>
      </section>
      <section>
        <h2 className="font-display text-3xl">Practice games</h2>
        <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
          {QUAD_GAMES.map((game) => (
            <li key={game.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{game.title}</p>
                <p className="text-sm text-paper/55">{game.blurb}</p>
              </div>
              <Link to="/quad/$game" params={{ game: game.slug }} className="text-sm text-brass-soft hover:text-paper">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ToolCard({ to, label, blurb }: { to: string; label: string; blurb: string }) {
  return (
    <Link to={to} className="rounded-lg border border-paper/15 bg-navy p-4 hover:border-brass/40">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-paper/55">{blurb}</p>
    </Link>
  );
}

function PaperPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-paper/60">Same tools as the light office — they write to the live campus.</p>
      <div className="mt-6 overflow-hidden rounded-lg bg-paper p-5 text-ink shadow-card">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-paper/15 bg-navy p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-brass-soft">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function Jump({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-paper/15 bg-navy px-4 py-3 text-left text-sm hover:border-brass/40"
    >
      {label}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-paper/40">{hint}</span>}
    </label>
  );
}

function ImageUpload({
  label,
  value,
  onChange,
  onUploaded,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (item: MediaItem) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await fileToPayload(file);
      const uploaded = await uploadMedia({ data: payload });
      onChange(uploaded.url);
      onUploaded?.({
        id: uploaded.id,
        filename: uploaded.filename,
        mime: file.type,
        data: uploaded.url,
      });
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">{label}</span>
      {value && <img src={value} alt="" className="mb-3 h-28 w-full rounded-sm border border-paper/15 object-cover" />}
      <input type="file" accept="image/*" className="block min-w-0 text-sm" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} />
    </div>
  );
}

function fileToPayload(file: File) {
  return new Promise<{ filename: string; mime: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.split(",")[1] : result;
      resolve({ filename: file.name, mime: file.type || "image/jpeg", data: data ?? "" });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const darkInput =
  "h-11 w-full rounded-sm border border-paper/15 bg-navy-deep px-3 text-paper placeholder:text-paper/35 focus:outline-2 focus:outline-offset-1 focus:outline-brass";
