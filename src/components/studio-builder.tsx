import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useCatalog } from "@/components/catalog-provider";
import { Button } from "@/components/ui/button";
import {
  deleteLesson,
  saveLesson,
  saveTrack,
  slugify,
  type LessonInput,
  type TrackInput,
} from "@/lib/cms";
import { lessonLineKey, saveLessonLink } from "@/lib/lesson-links";
import { QUAD_GAMES } from "@/lib/quad";
import { isRoleId } from "@/lib/content";

const darkInput =
  "h-11 w-full rounded-sm border border-paper/15 bg-navy-deep px-3 text-paper placeholder:text-paper/35 focus:outline-2 focus:outline-offset-1 focus:outline-brass";

type Template = {
  id: string;
  label: string;
  blurb: string;
  minutes: number;
  kicker: string;
  body: string;
  takeaway: string;
  videoPrompt?: boolean;
  gameSlug?: string;
};

const TEMPLATES: Template[] = [
  {
    id: "video",
    label: "Video lesson",
    blurb: "Watch, then do. Paste a YouTube, Vimeo, or Drive link.",
    minutes: 8,
    kicker: "Watch this",
    body: "VIDEO \u00b7 Watch this first\n\nAfter the video, write what you will do differently with the next Client.\n\nPRACTICE \u00b7 Run it once on the floor today.",
    takeaway: "See it. Then do it with a Client.",
    videoPrompt: true,
  },
  {
    id: "roleplay",
    label: "Roleplay",
    blurb: "Two chairs. One Client. One Specialist.",
    minutes: 12,
    kicker: "On the floor",
    body: "ROLEPLAY \u00b7 Pair up. One Client, one Specialist.\n\nThe Client walks in with a real complaint. The Specialist runs the chair without skipping the interview.\n\nAfter three minutes, swap. Coach one thing only \u2014 not five.",
    takeaway: "One correction. Then run it again.",
  },
  {
    id: "floor",
    label: "Floor drill",
    blurb: "A five-minute drill they can run between Clients.",
    minutes: 5,
    kicker: "Between Clients",
    body: "PRACTICE \u00b7 Five minutes on the floor.\n\nName the last Client\u2019s primary complaint out loud. Name the support you would start with. Name the 4th if it belongs.\n\nIf you cannot name all three, you were guessing.",
    takeaway: "If you cannot say it out loud, you cannot sell it.",
  },
  {
    id: "fourth",
    label: "4th support",
    blurb: "Place the mention. Do not dump the cart.",
    minutes: 10,
    kicker: "The 4th",
    body: "VIDEO \u00b7 The 4th \u2014 place the mention\n\nThe leftover shoe is not leftover. It is the next pair they did not know to ask for.\n\nPRACTICE \u00b7 Open The 4th in the Quad and run three placements.\n\nROLEPLAY \u00b7 Client already owns two supports. Place the 4th without a pitch.",
    takeaway: "Place it. Do not pitch it.",
    videoPrompt: true,
    gameSlug: "the-4th",
  },
  {
    id: "onboard",
    label: "New-hire day",
    blurb: "One day on the 30-day path.",
    minutes: 20,
    kicker: "Day on purpose",
    body: "Today has one job. Not five.\n\nGFA \u00b7 Open the form for this day\n\nWrite the one skill they must leave able to do. Then watch them do it.\n\nIf they only heard it, the day did not count.",
    takeaway: "They leave able to do one thing.",
  },
  {
    id: "quiz",
    label: "Check-in",
    blurb: "Lesson first. Questions on the Quizzes tab after you save.",
    minutes: 6,
    kicker: "Prove it",
    body: "Read this once. Then open the check-in.\n\nWrite the answer in their words, not ours.\n\nIf they cannot explain it to a Client tomorrow, they do not have it yet.",
    takeaway: "A check-in is not a test. It is proof they can say it.",
  },
];

function emptyLesson(trackId: string): LessonInput {
  return {
    trackId,
    slug: "",
    title: "",
    minutes: 8,
    kicker: "",
    body: "",
    takeaway: "",
    evalPhases: [],
  };
}

export function LessonsDesk() {
  const { catalog, replace } = useCatalog();
  const [trackId, setTrackId] = useState(catalog.tracks[0]?.id ?? "");
  const [lessonForm, setLessonForm] = useState<LessonInput>(emptyLesson(catalog.tracks[0]?.id ?? ""));
  const [videoUrl, setVideoUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const current = catalog.tracks.find((track) => track.id === trackId);

  function insertTag(prefix: string) {
    setLessonForm({
      ...lessonForm,
      body: lessonForm.body ? `${lessonForm.body}\n\n${prefix}` : prefix,
    });
  }

  async function attachLine(slug: string, line: string, url: string, tag: string) {
    const key = lessonLineKey(line);
    if (!key || !url.trim()) return;
    await saveLessonLink({
      data: {
        trackId,
        lessonSlug: slug,
        lineKey: key,
        tag,
        label: lessonForm.title || tag,
        url: url.trim(),
      },
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!trackId) {
      toast.error("Pick a course first.");
      return;
    }
    setBusy(true);
    try {
      const slug = lessonForm.slug || slugify(lessonForm.title);
      let body = lessonForm.body;
      if (videoUrl.trim() && !body.includes("VIDEO \u00b7")) {
        body = body ? `${body}\n\nVIDEO \u00b7 Watch this` : "VIDEO \u00b7 Watch this";
      }
      if (fileUrl.trim() && !body.includes("GFA \u00b7") && !body.includes("FORM \u00b7")) {
        body = body ? `${body}\n\nGFA \u00b7 Open the file` : "GFA \u00b7 Open the file";
      }
      const next = await saveLesson({ data: { ...lessonForm, trackId, slug, body } });
      replace(next);
      if (videoUrl.trim()) {
        await attachLine(slug, "VIDEO \u00b7 Watch this", videoUrl, "VIDEO").catch(() => undefined);
      }
      if (fileUrl.trim()) {
        await attachLine(slug, "GFA \u00b7 Open the file", fileUrl, "GFA").catch(() => undefined);
      }
      setLessonForm({ ...lessonForm, slug, body });
      toast.success("Lesson is on the campus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Course</span>
          <select
            className={darkInput}
            value={trackId}
            onChange={(e) => {
              setTrackId(e.target.value);
              setLessonForm(emptyLesson(e.target.value));
              setVideoUrl("");
              setFileUrl("");
            }}
          >
            {catalog.tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="invert"
          className="mt-4 w-full"
          onClick={() => {
            setLessonForm(emptyLesson(trackId));
            setVideoUrl("");
            setFileUrl("");
          }}
        >
          New lesson
        </Button>
        <ul className="mt-4 space-y-1">
          {(current?.lessons ?? []).map((lesson) => (
            <li key={lesson.slug}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-sm px-3 text-left text-sm hover:bg-navy"
                onClick={() => {
                  setLessonForm({
                    trackId,
                    slug: lesson.slug,
                    title: lesson.title,
                    minutes: lesson.minutes,
                    kicker: lesson.kicker ?? "",
                    body: lesson.body.join("\n\n"),
                    takeaway: lesson.takeaway ?? "",
                    evalPhases: lesson.evalPhases ?? [],
                  });
                  setVideoUrl("");
                  setFileUrl("");
                }}
              >
                <span className="truncate">{lesson.title}</span>
                <span className="ml-2 text-paper/50">{lesson.minutes}m</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={(e) => void save(e)} className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
        <h2 className="font-display text-3xl">{lessonForm.slug ? "Edit lesson" : "Write a lesson"}</h2>
        <p className="text-sm text-paper/60">
          This is the training they read. Add a video link, a file, or a tagged line. Save puts it on the live hall.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Title</span>
          <input
            className={darkInput}
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Minutes</span>
            <input
              className={darkInput}
              type="number"
              min={1}
              value={lessonForm.minutes}
              onChange={(e) => setLessonForm({ ...lessonForm, minutes: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Kicker</span>
            <input
              className={darkInput}
              value={lessonForm.kicker}
              onChange={(e) => setLessonForm({ ...lessonForm, kicker: e.target.value })}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["VIDEO \u00b7 ", "Video line"],
            ["ROLEPLAY \u00b7 ", "Roleplay"],
            ["GFA \u00b7 ", "File / form"],
            ["PRACTICE \u00b7 ", "Practice"],
          ].map(([prefix, label]) => (
            <button
              key={label}
              type="button"
              className="rounded-sm border border-paper/20 px-3 py-1.5 text-xs hover:border-brass/40"
              onClick={() => insertTag(prefix)}
            >
              + {label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Lesson text</span>
          <textarea
            className={`${darkInput} min-h-48 py-2`}
            rows={10}
            value={lessonForm.body}
            onChange={(e) => setLessonForm({ ...lessonForm, body: e.target.value })}
            required
          />
          <span className="mt-1 block text-xs text-paper/40">
            Blank line between paragraphs. Tagged lines become tappable once a link is attached.
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">
            Video link (YouTube, Vimeo, Drive)
          </span>
          <input
            className={darkInput}
            type="url"
            placeholder="https://"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">
            File or slide link (Drive, Dropbox, PDF)
          </span>
          <input
            className={darkInput}
            type="url"
            placeholder="https://"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Takeaway</span>
          <input
            className={darkInput}
            value={lessonForm.takeaway}
            onChange={(e) => setLessonForm({ ...lessonForm, takeaway: e.target.value })}
          />
        </label>
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
            {busy ? "Saving\u2026" : "Save lesson to campus"}
          </Button>
          {lessonForm.slug && (
            <Button
              type="button"
              variant="ghost"
              className="text-paper"
              onClick={() => {
                if (!confirm("Remove this lesson?")) return;
                void deleteLesson({ data: { trackId, slug: lessonForm.slug } })
                  .then((next) => {
                    replace(next);
                    setLessonForm(emptyLesson(trackId));
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
  );
}

export function StudioTemplates() {
  const { catalog, replace } = useCatalog();
  const [trackId, setTrackId] = useState(catalog.tracks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Template>(TEMPLATES[0]);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [newCourse, setNewCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [audience, setAudience] = useState("Every Specialist");
  const [who, setWho] = useState<"specialist" | "new-hires" | "mit" | "managers" | "all">("specialist");

  const games = useMemo(() => QUAD_GAMES, []);

  async function createFromTemplate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let targetTrack = trackId;
      if (newCourse) {
        if (!courseTitle.trim()) throw new Error("Name the new course.");
        const id = slugify(courseTitle);
        const payload: TrackInput = {
          id,
          role: who === "all" ? "specialist" : who,
          title: courseTitle.trim(),
          nav: courseTitle.trim(),
          image: "/media/campus-cogs.jpg",
          audience,
          summary: picked.blurb,
          visibleToAll: who === "all",
        };
        if (!isRoleId(payload.role)) payload.role = "specialist";
        const next = await saveTrack({ data: payload });
        replace(next);
        targetTrack = id;
        setTrackId(id);
      }
      if (!targetTrack) throw new Error("Pick a course.");
      const lessonTitle = title.trim() || picked.label;
      let body = picked.body;
      if (picked.gameSlug) {
        const game = games.find((item) => item.slug === picked.gameSlug);
        if (game) body += `\n\nPRACTICE \u00b7 Open ${game.title} in the Quad`;
      }
      const slug = slugify(lessonTitle);
      const saved = await saveLesson({
        data: {
          trackId: targetTrack,
          slug,
          title: lessonTitle,
          minutes: picked.minutes,
          kicker: picked.kicker,
          body,
          takeaway: picked.takeaway,
          evalPhases: [],
        },
      });
      replace(saved);
      if (videoUrl.trim()) {
        const key = lessonLineKey("VIDEO \u00b7 Watch this first") || lessonLineKey("VIDEO \u00b7 Watch this");
        if (key) {
          await saveLessonLink({
            data: {
              trackId: targetTrack,
              lessonSlug: slug,
              lineKey: key,
              tag: "VIDEO",
              label: lessonTitle,
              url: videoUrl.trim(),
            },
          }).catch(() => undefined);
        }
      }
      toast.success("Training is on the campus.");
      setTitle("");
      setVideoUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build that");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-3xl">Build from a template</h2>
        <p className="mt-2 max-w-2xl text-sm text-paper/60">
          Pick the kind of training. Drop it on a course \u2014 or start a new course. Then paste the video or file.
        </p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPicked(item)}
            className={
              picked.id === item.id
                ? "rounded-lg border border-brass bg-brass/15 p-4 text-left"
                : "rounded-lg border border-paper/15 bg-navy p-4 text-left hover:border-brass/40"
            }
          >
            <p className="font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-paper/55">{item.blurb}</p>
          </button>
        ))}
      </div>
      <form onSubmit={(e) => void createFromTemplate(e)} className="space-y-4 rounded-lg border border-paper/15 bg-navy p-5">
        <h3 className="font-display text-2xl">{picked.label}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={newCourse} onChange={(e) => setNewCourse(e.target.checked)} />
          Start a new course for this
        </label>
        {newCourse ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Course title</span>
              <input className={darkInput} value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required={newCourse} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Audience</span>
              <input className={darkInput} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Who sees it</span>
              <select className={darkInput} value={who} onChange={(e) => setWho(e.target.value as typeof who)}>
                <option value="new-hires">New Hires</option>
                <option value="specialist">Specialists</option>
                <option value="mit">MIT</option>
                <option value="managers">Managers</option>
                <option value="all">Every position</option>
              </select>
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Drop onto this course</span>
            <select className={darkInput} value={trackId} onChange={(e) => setTrackId(e.target.value)}>
              {catalog.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Lesson title</span>
          <input
            className={darkInput}
            placeholder={picked.label}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {picked.videoPrompt && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Video link</span>
            <input className={darkInput} type="url" placeholder="https://" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </label>
        )}
        <Button type="submit" variant="invert" disabled={busy}>
          {busy ? "Building\u2026" : "Build and put on campus"}
        </Button>
      </form>

      <section>
        <h2 className="font-display text-3xl">Attach a Quad game</h2>
        <p className="mt-2 text-sm text-paper/60">
          Games already live on campus. Put the practice line in a lesson, then send people to the Quad.
        </p>
        <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
          {games.map((game) => (
            <li key={game.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{game.title}</p>
                <p className="text-sm text-paper/55">{game.blurb}</p>
              </div>
              <button
                type="button"
                className="text-sm text-brass-soft hover:text-paper"
                onClick={() => {
                  const line = `PRACTICE \u00b7 Open ${game.title} in the Quad`;
                  void navigator.clipboard?.writeText(line);
                  toast.success("Copied. Paste it into a lesson.");
                }}
              >
                Copy practice line
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
