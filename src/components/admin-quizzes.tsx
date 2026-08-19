import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteQuiz,
  listHireProgress,
  listQuizInbox,
  listQuizzes,
  markQuizReviewed,
  saveQuiz,
  type HireProgressRow,
  type Quiz,
  type QuizQuestion,
  type QuizResponse,
} from "@/lib/quizzes";
import { listTrainerNotes, markNoteReviewed, type TrainerNote } from "@/lib/ask-trainer";

export function QuizEditor() {
  const blank: Quiz = {
    id: "",
    title: "",
    lessonSlug: "",
    intro: "",
    questions: [{ id: globalThis.crypto.randomUUID(), prompt: "", type: "short" }],
    sortOrder: 0,
  };
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [form, setForm] = useState<Quiz>(blank);

  useEffect(() => {
    listQuizzes()
      .then(setQuizzes)
      .catch((error) => {
        setQuizzes([]);
        toast.error(error instanceof Error ? error.message : "Could not load check-ins");
      });
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <div>
        <Button type="button" variant="outline" className="w-full" onClick={() => setForm(blank)}>
          New check-in
        </Button>
        <ul className="mt-4 space-y-1">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-sm px-3 text-left text-sm hover:bg-paper-2"
                onClick={() => setForm(quiz)}
              >
                <span className="truncate">{quiz.title}</span>
                <span className="ml-2 text-xs text-muted">{quiz.lessonSlug || "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form
        className="space-y-4 rounded-lg border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void saveQuiz({
            data: {
              ...form,
              questions: form.questions.filter((q) => q.prompt.trim()),
            },
          })
            .then((next) => {
              setQuizzes(next);
              toast.success("Check-in saved");
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"));
        }}
      >
        <h2 className="font-display text-3xl">{form.id ? "Edit check-in" : "New check-in"}</h2>
        <Field label="Title">
          <input
            className={field}
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Attaches to day" hint="Use day-01 through day-20. Leave blank for a standalone quiz.">
          <input
            className={field}
            placeholder="day-01"
            value={form.lessonSlug}
            onChange={(e) => setForm({ ...form, lessonSlug: e.target.value })}
          />
        </Field>
        <Field label="Intro">
          <textarea
            className={area}
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
          />
        </Field>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Questions</p>
          <div className="mt-3 space-y-4">
            {form.questions.map((question, i) => (
              <div key={question.id} className="grid gap-2 rounded-md border border-line bg-paper p-3">
                <input
                  className={field}
                  placeholder={`Question ${i + 1}`}
                  value={question.prompt}
                  onChange={(e) => {
                    const questions = [...form.questions];
                    questions[i] = { ...question, prompt: e.target.value };
                    setForm({ ...form, questions });
                  }}
                />
                <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                  <select
                    className={field}
                    value={question.type}
                    onChange={(e) => {
                      const type = e.target.value as QuizQuestion["type"];
                      const questions = [...form.questions];
                      questions[i] = { ...question, type };
                      setForm({ ...form, questions });
                    }}
                  >
                    <option value="short">Short answer</option>
                    <option value="long">Long answer</option>
                    <option value="choice">Multiple choice</option>
                  </select>
                  {question.type === "choice" && (
                    <input
                      className={field}
                      placeholder="Choices, separated by |"
                      value={(question.choices ?? []).join(" | ")}
                      onChange={(e) => {
                        const questions = [...form.questions];
                        questions[i] = {
                          ...question,
                          choices: e.target.value.split("|").map((c) => c.trim()).filter(Boolean),
                        };
                        setForm({ ...form, questions });
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() =>
              setForm({
                ...form,
                questions: [
                  ...form.questions,
                  { id: globalThis.crypto.randomUUID(), prompt: "", type: "short" },
                ],
              })
            }
          >
            Add a question
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save check-in</Button>
          {form.id && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!confirm("Remove this check-in?")) return;
                void deleteQuiz({ data: form.id })
                  .then((next) => {
                    setQuizzes(next);
                    setForm(blank);
                    toast.success("Removed");
                  })
                  .catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Could not remove check-in"),
                  );
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export function QuizInbox() {
  const [rows, setRows] = useState<QuizResponse[]>([]);
  const [hires, setHires] = useState<HireProgressRow[]>([]);
  const [notes, setNotes] = useState<TrainerNote[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listQuizInbox()
      .then(setRows)
      .catch((err) => {
        setRows([]);
        toast.error(err instanceof Error ? err.message : "Could not load inbox");
      });
    listHireProgress()
      .then(setHires)
      .catch((error) => {
        setHires([]);
        toast.error(error instanceof Error ? error.message : "Could not load hire progress");
      });
    listTrainerNotes()
      .then(setNotes)
      .catch((error) => {
        setNotes([]);
        toast.error(error instanceof Error ? error.message : "Could not load professor notes");
      });
  }, []);

  const filtered = rows.filter((row) => {
    const hay = `${row.userName} ${row.userEmail} ${row.quizTitle} ${row.lessonSlug}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-10">
      {notes.length > 0 && (
        <div>
          <h2 className="font-display text-3xl">Ask the professor</h2>
          <p className="mt-1 text-sm text-muted">Questions from lessons, next to the check-ins.</p>
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="text-sm font-medium">{note.userName} · {note.lessonTitle}</p>
                <p className="mt-1 text-sm text-muted">{note.body}</p>
                {!note.reviewedAt && (
                  <button
                    type="button"
                    className="mt-2 text-xs uppercase tracking-[0.12em] text-brass"
                    onClick={() =>
                      void markNoteReviewed({ data: note.id })
                        .then(setNotes)
                        .catch((error) =>
                          toast.error(error instanceof Error ? error.message : "Could not mark note"),
                        )
                    }
                  >
                    Mark reviewed
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h2 className="font-display text-3xl">New-hire progress</h2>
        <p className="mt-1 text-sm text-muted">
          Days marked complete and check-ins sent — one list instead of a folder tree.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Days</th>
                <th className="py-2 pr-4 font-medium">Check-ins</th>
                <th className="py-2 font-medium">Last sent</th>
              </tr>
            </thead>
            <tbody>
              {hires.map((row) => (
                <tr key={row.userId} className="border-b border-line hover:bg-paper-2">
                  <td className="py-3 pr-4">
                    <button type="button" className="text-left" onClick={() => setQuery(row.email)}>
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-xs text-muted">{row.email}</span>
                    </button>
                    {row.quizTitles.length > 0 && (
                      <p className="mt-1 text-xs text-muted">{row.quizTitles.join(" · ")}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {row.daysDone}/{row.daysTotal}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {row.quizzesDone}/{row.quizzesTotal}
                  </td>
                  <td className="py-3 text-muted">
                    {row.lastQuizAt ? new Date(row.lastQuizAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Inbox</h2>
            <p className="mt-1 text-sm text-muted">
              Every check-in, in one place{rows.length ? ` · ${rows.length} received` : ""}.
            </p>
          </div>
          <input
            className={`${field} max-w-xs`}
            placeholder="Search name or day"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {filtered.map((row) => (
            <li key={row.id} className="py-4">
              <button
                type="button"
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                onClick={() => setOpenId((id) => (id === row.id ? null : row.id))}
              >
                <div>
                  <p className="font-medium">{row.userName}</p>
                  <p className="text-sm text-muted">
                    {row.quizTitle}
                    {row.lessonSlug ? ` · ${row.lessonSlug}` : ""}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">
                  {row.reviewedAt ? "Read" : "New"} · {new Date(row.submittedAt).toLocaleString()}
                </p>
              </button>
              {openId === row.id && (
                <div className="mt-3 space-y-3 rounded-md bg-paper-2 p-4">
                  {row.answers.map((answer) => {
                    const prompt =
                      answer.prompt ||
                      row.questions.find((q) => q.id === answer.questionId)?.prompt ||
                      answer.questionId.replace(/-/g, " ");
                    return (
                      <div key={answer.questionId}>
                        <p className="text-sm font-medium">{prompt}</p>
                        <p className="mt-1 whitespace-pre-wrap">{answer.value}</p>
                      </div>
                    );
                  })}
                  {!row.reviewedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void markQuizReviewed({ data: row.id })
                          .then(setRows)
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : "Could not mark"),
                          );
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {!filtered.length && <p className="mt-6 text-sm text-muted">No check-ins yet.</p>}
      </div>
    </div>
  );
}

const field =
  "h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";
const area =
  "min-h-20 w-full rounded-sm border border-line bg-paper px-3 py-2 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
