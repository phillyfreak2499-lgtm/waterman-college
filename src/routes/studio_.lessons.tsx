import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { LessonsDesk } from "@/components/studio-builder";
import { Redirect } from "@/lib/auth/gates";
import { pageHead } from "@/lib/page-title";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/studio/lessons")({
  component: Page,
  head: () => pageHead("Write a lesson", "Write training and put it on the campus."),
});

function Page() {
  return (
    <AuthGate>
      <Gate />
    </AuthGate>
  );
}

function Gate() {
  const { access, ready } = useAccess();
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-navy-deep text-brass-soft">
        Opening the lesson desk…
      </div>
    );
  }
  if (!access.canOpenStudio) return <Redirect to="/" />;
  return <Shell />;
}

function Shell() {
  const { user } = useCurrentUserState();
  return (
    <div className="min-h-dvh bg-navy-deep text-paper">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-brass-soft">
              Training Office · Writer
            </p>
            <h1 className="font-display text-2xl leading-none sm:text-3xl">Lessons</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-brass-soft">{user?.displayName ?? "Professor"}</span>
            <Link to="/studio" className="text-paper/70 hover:text-paper">
              Office
            </Link>
            <Link to="/studio/build" className="text-paper/70 hover:text-paper">
              Build
            </Link>
            <Link to="/training" search={{}} className="text-paper/70 hover:text-paper">
              Hall
            </Link>
            <button type="button" className="text-paper/70 hover:text-paper" onClick={() => void signOut("/")}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <LessonsDesk />
      </main>
    </div>
  );
}
