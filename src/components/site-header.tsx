import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SITE } from "@/lib/content";
import { cn } from "@/lib/utils";

const links = [
  { to: "/training", label: "Training" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/remarkable", label: "Be Remarkable" },
];

export function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const tone = inverted ? "text-paper" : "text-navy";

  return (
    <header
      className={cn(
        "relative z-40 border-b",
        inverted ? "border-paper/15 bg-navy" : "border-line bg-paper",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link to="/" className={cn("flex items-center gap-3", tone)}>
          <img
            src="/media/seal.png"
            alt=""
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
          />
          <span className="font-display text-xl leading-none tracking-tight sm:text-[1.35rem]">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-[0.8rem] font-medium uppercase tracking-[0.16em] opacity-80 transition-opacity hover:opacity-100",
                tone,
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-sm bg-navy/10" />
          ) : user ? (
            <div className={cn(inverted && "text-paper [&_button]:text-paper")}>
              <UserButton />
            </div>
          ) : (
            <Link
              to="/login"
              className={cn(
                "inline-flex h-10 items-center rounded-sm px-4 text-sm font-medium",
                inverted
                  ? "bg-paper text-navy hover:bg-paper-2"
                  : "bg-navy text-paper hover:bg-navy-deep",
              )}
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className={cn("grid h-11 w-11 place-items-center md:hidden", tone)}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-5 py-5 md:hidden",
            inverted ? "border-paper/15 bg-navy text-paper" : "border-line bg-paper text-navy",
          )}
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="pt-3">
                <UserButton />
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-11 items-center justify-center rounded-sm bg-navy text-sm font-medium text-paper"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
