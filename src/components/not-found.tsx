import { Link } from "@tanstack/react-router";
import { SiteShell } from "./site-shell";
import { Button } from "./ui/button";

export function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="kicker">404</p>
        <span className="rule-brass mx-auto mt-3" />
        <h1 className="mt-5 font-display text-5xl leading-none">This page isn’t on campus</h1>
        <p className="mt-4 text-muted">The path you followed doesn’t match a course or page.</p>
        <Button asChild className="mt-8">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </SiteShell>
  );
}
