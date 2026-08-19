import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message = import.meta.env.PROD
    ? "An unexpected error occurred. Please try again."
    : error.message || "An unexpected error occurred. Try reloading the page.";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-8" strokeWidth={1.75} />
      </span>
      <p className="kicker">Campus interruption</p>
      <h1 className="font-display text-3xl leading-none sm:text-4xl">Something went wrong</h1>
      <p className="max-w-md text-sm leading-relaxed break-words text-muted">{message}</p>
      <Link
        to="/"
        className="mt-2 inline-flex h-11 items-center rounded-sm bg-navy px-5 text-sm font-medium text-paper hover:bg-navy-deep"
      >
        Return home
      </Link>
    </main>
  );
}
