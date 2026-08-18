import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/content";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks });

const steps = [
  {
    n: "01",
    title: "Be an employee",
    body: `Each student must be an employee of ${SITE.company}. This campus is not public.`,
  },
  {
    n: "02",
    title: "Register for an account",
    body: "Create a login to access the courses. Use the email you work with so your manager can find you.",
  },
  {
    n: "03",
    title: "Get approved",
    body: "If your access needs a manager’s eye, you’ll hear from the training office. Until then, start with the public pages and come back signed in.",
  },
  {
    n: "04",
    title: "Start learning",
    body: "Begin with Specialist Training or, if you are new, the six-week Onboarding Program. Be the best version of you.",
  },
];

function HowItWorks() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
          Admission
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          How it works
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Waterman College is a private training ground. Four steps from hire to
          the chair.
        </p>
        <ol className="mt-14 space-y-10">
          {steps.map((s) => (
            <li key={s.n} className="grid gap-2 border-t border-line pt-8 sm:grid-cols-[5rem_1fr]">
              <span className="font-display text-3xl italic text-brass">{s.n}</span>
              <div>
                <h2 className="font-display text-3xl leading-none">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild className="mt-14">
          <Link to="/login">Create your account</Link>
        </Button>
      </div>
    </SiteShell>
  );
}
