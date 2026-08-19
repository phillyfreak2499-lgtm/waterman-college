import { createFileRoute, Link } from "@tanstack/react-router";
import { useCatalog } from "@/components/catalog-provider";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorks,
  head: () => pageHead("How it works", "Create an account, wait for the office, then enter the hall."),
});

function HowItWorks() {
  const { catalog } = useCatalog();
  const site = catalog.site;
  const pages = catalog.pages;

  const steps = [
    {
      n: "01",
      title: "Create an account",
      body: "Choose a username and password. Give us your first and last name so the office knows who you are. Nothing leaves this website.",
    },
    {
      n: "02",
      title: "The office reviews the request",
      body: "An administrator approves or denies each person. Until you are approved, the hall stays closed. This keeps the campus private to employees of the company.",
    },
    {
      n: "03",
      title: "You are placed",
      body: "The office assigns your position — New Hire, Specialist, MIT, Manager, or above — and who you report to. That decides which door opens for you.",
    },
    {
      n: "04",
      title: "Sign in and start with why",
      body: "Use the username and password you created. Enter the hall. The courses inside have not moved. Be the person the Client hoped to meet.",
    },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <PageIntro
          kicker={pages.howKicker}
          title={pages.howTitle}
          lede={`${pages.howIntro} Reserved for employees of ${site.company}.`}
        />
        <ol className="relative mt-16">
          <span
            aria-hidden
            className="absolute top-3 bottom-6 left-[1.05rem] hidden w-px bg-line sm:block"
          />
          {steps.map((s) => (
            <li key={s.n} className="relative grid gap-3 pb-12 last:pb-0 sm:grid-cols-[3.25rem_1fr] sm:gap-6">
              <span className="relative z-10 grid size-9 place-items-center rounded-full border border-brass/50 bg-paper font-display text-lg italic text-brass">
                {s.n.replace(/^0/, "")}
              </span>
              <div className="sm:pt-0.5">
                <p className="font-display text-sm italic text-brass sm:hidden">{s.n}</p>
                <h2 className="font-display text-3xl leading-none">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-pretty text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-10">
          <Button asChild>
            <Link to="/register">Create an account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}
