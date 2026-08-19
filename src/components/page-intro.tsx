import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageIntro({
  kicker,
  title,
  lede,
  invert = false,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  invert?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-2xl">
      <p className={cn("kicker", invert && "text-brass-soft")}>{kicker}</p>
      <span className={cn("rule-brass mt-3", invert && "bg-brass-soft/70")} />
      <h1
        className={cn(
          "mt-4 font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl",
          invert && "text-paper",
        )}
      >
        {title}
      </h1>
      {lede ? (
        <p className={cn("mt-6 text-lg leading-relaxed text-pretty", invert ? "text-paper/80" : "text-muted")}>
          {lede}
        </p>
      ) : null}
      {children}
    </header>
  );
}
