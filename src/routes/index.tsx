import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { SITE, tracks } from "@/lib/content";

export const Route = createFileRoute("/")({ component: Home });

const featured = tracks.filter((t) =>
  ["client-experience", "flow", "product", "culture"].includes(t.id),
);

function Home() {
  return (
    <SiteShell invertedHeader>
      <section className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src="/media/campus-front.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/45 via-navy/60 to-navy" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-brass-soft">
            {SITE.company}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-[3.1rem] leading-[0.92] tracking-tight sm:text-7xl">
            Pain Free Learning
            <span className="block italic text-brass-soft">for Pain Free Living.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">
            You are the first thing our Clients experience. Waterman College trains
            Specialists and managers to own the relationship — not just the sale.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="invert">
              <Link to="/login">
                Sign in to train <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="brass">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
              The standard
            </p>
            <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              We don’t train Specialists to fill a role.{" "}
              <em>We train them to own a relationship.</em>
            </h2>
          </div>
          <p className="text-[1.05rem] leading-relaxed text-muted">
            Before any product changes hands, a Specialist changes the room. The way
            you greet, listen, guide, and serve determines whether a Client leaves
            with the right solution — or leaves at all.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {featured.map((t) => (
            <Link
              key={t.id}
              to="/training/$track"
              params={{ track: t.id }}
              className="group overflow-hidden rounded-lg border border-line bg-surface"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={t.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brass">
                  {t.audience}
                </p>
                <h3 className="mt-2 font-display text-3xl leading-none">{t.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <img
            src="/media/teaching-vs-training.jpg"
            alt="Teaching is what we do to others. Training is what we do with others."
            className="w-full rounded-lg border border-line"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
              How we teach
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight">
              Teaching is what we do to others. Training is what we do with others.
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-muted">
              This is a training ground, not a lecture hall. Practice, be observed,
              try again. If you leave a session only knowing something, we failed.
              If you leave able to do something with a Client tomorrow, we did our
              job.
            </p>
            <Button asChild className="mt-8">
              <Link to="/training">
                Enter campus <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
            Onboarding
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight">
            Your first six weeks, on purpose.
          </h2>
          <p className="mt-5 leading-relaxed text-muted">
            New Specialists follow a six-week path from belonging to advising —
            Client Experience, Flow, Product, and Culture — with a trainer in
            earshot, not in the chair.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/training/$track" params={{ track: "onboarding" }}>View onboarding</Link>
          </Button>
        </div>
        <img
          src="/media/classroom.jpg"
          alt="Training classroom at Waterman College"
          className="w-full rounded-lg border border-line object-cover"
        />
      </section>
    </SiteShell>
  );
}
