import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/why")({
  component: WhyPage,
  head: () => pageHead("Why we exist", "Start with why. Waterman College exists so a Client can live with less pain."),
});

function WhyPage() {
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src="/media/classroom-wide.jpg"
          alt="A Waterman training room"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-navy/72" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <PageIntro
            invert
            kicker="The Golden Circle"
            title="Start with why."
            lede="People don’t buy what you do. They buy why you do it. Waterman College is built on that order — why, then how, then what."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          {[
            {
              n: "01",
              label: "Why",
              title: "Less pain.",
              body: "A person walked in because something hurts. That hope is sacred.",
            },
            {
              n: "02",
              label: "How",
              title: "Train the person.",
              body: "Belonging first. Craft second. Standard last. Practice in the open.",
            },
            {
              n: "03",
              label: "What",
              title: "A campus.",
              body: "Four doors, a hall, a huddle, and games that prepare the floor.",
            },
          ].map((item) => (
            <article key={item.n} className="border-t border-line pt-6">
              <p className="font-display text-2xl italic text-brass">{item.n}</p>
              <p className="mt-3 kicker">{item.label}</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <img
            src="/media/classroom-circle.jpg"
            alt="Specialists seated in a circle during training"
            className="aspect-[4/3] w-full rounded-lg object-cover shadow-card"
          />
          <div>
            <p className="kicker">Why</p>
            <span className="rule-brass mt-3" />
            <h2 className="mt-5 font-display text-4xl leading-tight">
              So a Client can live with less pain.
            </h2>
            <p className="mt-5 leading-relaxed text-pretty text-ink/90">
              That is the whole college. Not a better close. Not a fuller cart. A
              person walked into a Good Feet store because something hurts, and
              they hoped the first face they saw would treat that as sacred. We
              exist to make sure it is.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="lg:order-2">
          <img
            src="/media/classroom-table.jpg"
            alt="A trainer working with Specialists at a table"
            className="aspect-[4/3] w-full rounded-lg object-cover shadow-card"
          />
        </div>
        <div>
          <p className="kicker">How</p>
          <span className="rule-brass mt-3" />
          <h2 className="mt-5 font-display text-4xl leading-tight">
            We train the person who will meet them.
          </h2>
          <p className="mt-5 leading-relaxed text-pretty text-ink/90">
            Belonging first. Craft second. Standard last. New Hires learn the
            room. Specialists own the relationship. MIT learn to lead themselves.
            Managers keep the people who keep the Clients. We practice in the
            open, get observed, and try again.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-paper-2">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="kicker">What</p>
          <span className="rule-brass mt-3" />
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            A hall with four doors, and a campus around it.
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-pretty text-ink/90">
            The courses inside those doors are the work your trainers already
            wrote. This website does not rewrite them. It gives them a college
            worthy of the why — a first impression that matches the one we ask
            every Specialist to give a Client.
          </p>
          <blockquote className="mt-10 max-w-2xl border-l-2 border-brass pl-5 font-display text-2xl leading-snug italic text-navy sm:text-3xl">
            Be the person the Client hoped to meet.
          </blockquote>
          <div className="mt-12 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/how-it-works">How admission works</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
