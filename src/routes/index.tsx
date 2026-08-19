import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCatalog } from "@/components/catalog-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => pageHead("People first", "Private employee campus for Waterman Arch Supports and The Good Feet Store."),
});

function Home() {
  const { catalog } = useCatalog();
  const pages = catalog.pages;

  return (
    <SiteShell invertedHeader>
      <section className="relative isolate min-h-[30rem] overflow-hidden bg-navy text-paper sm:min-h-[44rem]">
        <img
          src={pages.homeHeroImage || "/media/campus-cogs.jpg"}
          alt="Waterman College campus hall"
          className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/62 to-navy/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[30rem] max-w-6xl items-end px-5 pb-14 pt-16 sm:min-h-[44rem] sm:px-8 sm:pb-24 sm:pt-28">
          <div className="max-w-2xl">
            <p className="kicker text-brass-soft">Why we exist</p>
            <span className="rule-brass mt-4 bg-brass-soft/80" />
            <h1 className="mt-5 font-display text-4xl leading-[0.95] tracking-tight text-balance sm:mt-6 sm:text-7xl">
              People first.
              <span className="block italic text-brass-soft">Then the work.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-pretty text-paper/85 sm:text-lg">
              {pages.homeHeroBody}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="invert">
                <Link to="/register">Create an account</Link>
              </Button>
              <Button asChild size="lg" variant="brass">
                <Link to="/why">Start with why</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="kicker">Why</p>
        <span className="rule-brass mt-3" />
        <h2 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          {pages.homeStandardTitle}
        </h2>
        <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-pretty text-muted">
          {pages.homeStandardBody}
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-10">
          {[
            {
              n: "01",
              title: "The Client is why",
              body: "Start every conversation with the human in the chair. Pain, hope, and trust come before any product.",
            },
            {
              n: "02",
              title: "The Specialist is how",
              body: "We train people, not pitches. Practice, observation, and a second try — so they can do it tomorrow.",
            },
            {
              n: "03",
              title: "The work is what",
              body: "Courses, the hall, the Quad, and the huddle exist to serve the first two. Never the other way around.",
            },
          ].map((item) => (
            <article key={item.n} className="border-t border-line pt-6">
              <p className="font-display text-2xl italic text-brass">{item.n}</p>
              <h3 className="mt-3 font-display text-2xl leading-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <img
            src={pages.homeTeachImage || "/media/teaching-vs-training.jpg"}
            alt="Teaching versus training in a Waterman classroom"
            className="aspect-[4/3] w-full rounded-lg object-cover shadow-card"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p className="kicker">How</p>
            <span className="rule-brass mt-3" />
            <h2 className="mt-5 font-display text-4xl leading-tight">
              {pages.homeTeachTitle}
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-pretty text-muted">
              {pages.homeTeachBody}
            </p>
            <Button asChild className="mt-8">
              <Link to="/how-it-works">
                How the college works <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="kicker">What</p>
            <span className="rule-brass mt-3" />
            <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
              {pages.homeOnboardTitle}
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              {pages.homeOnboardBody}
            </p>
          </div>
          <img
            src={pages.homeOnboardImage || "/media/classroom.jpg"}
            alt="The Good Feet Store shopfront where new Specialists begin"
            /* The source photo is portrait (1200x1600); a centred 4:3 crop cut
               through the storefront sign. Bias the crop upward so the sign and
               the windows both stay in frame. */
            className="aspect-[4/3] w-full rounded-lg object-cover object-[center_20%] shadow-card"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            {
              to: "/training" as const,
              kicker: "The hall",
              title: "Training",
              body: "Open the vault. Choose your door. The lessons have not moved.",
            },
            {
              to: "/directory" as const,
              kicker: "People",
              title: "Directory",
              body: "Offices, stores, managers, and the sales floor — one roster.",
            },
            {
              to: "/quad" as const,
              kicker: "Student life",
              title: "The Quad",
              body: "College games for the floor: practice before the Client arrives.",
            },
            {
              to: "/remarkable" as const,
              kicker: "The standard",
              title: "Be Remarkable",
              body: "The weekly huddle note. Small enough to use today.",
            },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              {...(card.to === "/training" ? { search: {} } : {})}
              className="card-surface group p-6"
            >
              <p className="kicker">{card.kicker}</p>
              <h3 className="mt-3 font-display text-3xl leading-none">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{card.body}</p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                Enter
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src="/media/seal.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-10 h-64 w-64 opacity-[0.08] sm:h-80 sm:w-80"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="kicker text-brass-soft">Admission</p>
            <span className="rule-brass mt-3 bg-brass-soft/80" />
            <h2 className="mt-5 font-display text-4xl leading-tight">
              Ask to join. The office opens the door.
            </h2>
            <p className="mt-4 leading-relaxed text-paper/75">
              Create a username and password. The training office approves each
              person, assigns a position, and then the hall is yours.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="invert">
              <Link to="/register">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="brass">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
