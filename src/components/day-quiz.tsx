import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listQuizzes,
  myQuizResponses,
  submitQuiz,
  type MyResponse,
  type Quiz,
} from "@/lib/quizzes";

export function DayQuiz({ lessonSlug }: { lessonSlug: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [mine, setMine] = useState<MyResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listQuizzes(), myQuizResponses()])
      .then(([all, responses]) => {
        if (!cancelled) {
          setQuizzes(all.filter((quiz) => quiz.lessonSlug === lessonSlug));
          setMine(responses);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Could not load the check-in");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lessonSlug]);

  if (!quizzes.length) return null;

  return (
    <div className="mt-12 space-y-6">
      {quizzes.map((quiz) => (
        <QuizForm
          key={quiz.id}
          quiz={quiz}
          prior={mine.find((r) => r.quizId === quiz.id)}
          onSaved={setMine}
        />
      ))}
    </div>
  );
}

function QuizForm({
  quiz,
  prior,
  onSaved,
}: {
  quiz: Quiz;
  prior?: MyResponse;
  onSaved: (rows: MyResponse[]) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const question of quiz.questions) {
      next[question.id] = prior?.answers.find((a) => a.questionId === question.id)?.value ?? "";
    }
    setValues(next);
  }, [quiz, prior]);

  async function submit() {
    setBusy(true);
    try {
      const answers = quiz.questions.map((question) => ({
        questionId: question.id,
        prompt: question.prompt,
        value: (values[question.id] ?? "").trim(),
      }));
      if (answers.some((a) => !a.value)) {
        toast.error("Answer every question before you send it.");
        return;
      }
      onSaved(await submitQuiz({ data: { quizId: quiz.id, answers } }));
      toast.success("Sent to the training office");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Check-in</p>
      <h2 className="mt-1 font-display text-3xl leading-none">{quiz.title}</h2>
      {quiz.intro && <p className="mt-3 text-sm text-muted">{quiz.intro}</p>}
      {prior && (
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-navy">
          Submitted — you can update it
        </p>
      )}
      <div className="mt-5 space-y-4">
        {quiz.questions.map((question) => (
          <label key={question.id} className="block">
            <span className="mb-1.5 block text-sm font-medium">{question.prompt}</span>
            {question.type === "choice" && question.choices?.length ? (
              <select
                className="h-11 w-full rounded-sm border border-line bg-paper px-3"
                value={values[question.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [question.id]: e.target.value }))}
              >
                <option value="">Choose…</option>
                {question.choices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                className="min-h-20 w-full rounded-sm border border-line bg-paper px-3 py-2"
                value={values[question.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [question.id]: e.target.value }))}
              />
            )}
          </label>
        ))}
      </div>
      <Button type="button" className="mt-5" disabled={busy} onClick={() => void submit()}>
        {busy ? "Sending…" : prior ? "Update answers" : "Send to the office"}
      </Button>
    </section>
  );
}
