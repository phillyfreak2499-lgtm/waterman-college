import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { tracks } from "@/lib/content";
import { listProgress } from "@/lib/progress";

export const Route = createFileRoute("/training/")({ component: TrainingHome });

function TrainingHome() {
  return (
    <SiteShell>
      <AuthGate>
        <Campus />
      </AuthGate>
    </SiteShell>
  );
}

function Campus() {
  const [done, setDone] = useState<string[] | null>(null);
  useEffect(() => {
    listProgress()
      .then(setDone)
      .catch(() => setDone([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
        Specialist Training
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
        You are the first thing our <em>Clients</em> experience.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        Before any product changes hands, a Specialist changes the room. Pick a
        track. Mark lessons complete as you go.
      </p>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {tracks.map((t) => {
          const total = t.lessons.length;
          const finished =
            done?.filter((k) => k.startsWith(`${t.id}/`)).length ?? 0;
          return (
            <Link
              key={t.id}
              to="/training/$track"
              params={{ track: t.id }}
              className="group overflow-hidden rounded-lg border border-line bg-surface"
            >
              <div className="aspect-[2/1] overflow-hidden">
                <img
                  src={t.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brass">
                    {t.audience}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {done ? `${finished}/${total}` : "—"}
                  </p>
                </div>
                <h2 className="mt-2 font-display text-3xl leading-none">{t.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.summary}</p>
                <div className="mt-5 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-navy"
                    style={{ width: done ? `${(finished / total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
