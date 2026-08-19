import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { QUAD_GAMES } from "@/lib/quad";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/quad_/$game")({
  component: GamePage,
  head: ({ params }) => {
    const game = QUAD_GAMES.find((g) => g.slug === params.game);
    return pageHead(game?.title ?? "The Quad");
  },
});

function GamePage() {
  return (
    <SiteShell>
      <AuthGate>
        <GameFrame />
      </AuthGate>
    </SiteShell>
  );
}

function GameFrame() {
  const { game: slug } = Route.useParams();
  const game = QUAD_GAMES.find((g) => g.slug === slug);
  if (!game) throw notFound();
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        to="/quad"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brass hover:text-navy"
      >
        <ArrowLeft className="size-3.5" /> Back to The Quad
      </Link>
      <p className="kicker mt-6">Intramural</p>
      <span className="rule-brass mt-3" />
      <h1 className="mt-4 font-display text-3xl leading-none sm:text-4xl">{game.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{game.blurb}</p>
      <div className="mt-7 overflow-hidden rounded-lg border border-line bg-paper shadow-card">
        <iframe
          title={game.title}
          src={game.file}
          className="block h-[70dvh] min-h-[20rem] w-full bg-paper"
        />
      </div>
    </div>
  );
}
