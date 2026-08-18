import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { AuthGate } from "@/components/auth-gate";
import { tips } from "@/lib/content";

export const Route = createFileRoute("/remarkable")({ component: Remarkable });

function Remarkable() {
  return (
    <SiteShell>
      <AuthGate>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
            Weekly
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none">
            Be Remarkable
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            A small, usable standard for the floor this week. Read it in the huddle.
            Practice it on the next Client.
          </p>
          <ol className="mt-12 space-y-8">
            {tips.map((t) => (
              <li key={t.slug} className="border-t border-line pt-8">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{t.date}</p>
                <h2 className="mt-2 font-display text-3xl leading-tight">{t.title}</h2>
                <p className="mt-3 leading-relaxed text-ink/90">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </AuthGate>
    </SiteShell>
  );
}
