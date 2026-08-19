import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { QUAD_GAMES } from "@/lib/quad";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/quad")({
  component: QuadPage,
  head: () => pageHead("The Quad", "Practice the feeling of the floor before a Client is in the chair."),
});

function QuadPage() {
  return (
    <SiteShell>
      <AuthGate>
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <PageIntro
            kicker="Student life"
            title="The Quad"
            lede="Why the Quad exists: practice the feeling of the floor before a Client is in the chair. The games have not moved."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {QUAD_GAMES.map((game, i) => (
              <Link
                key={game.slug}
                to="/quad/$game"
                params={{ game: game.slug }}
                className="card-surface group p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-display text-2xl italic text-brass">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="kicker">Intramural</p>
                </div>
                <h2 className="mt-4 font-display text-3xl leading-none">{game.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{game.blurb}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                  Play
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </AuthGate>
    </SiteShell>
  );
}
