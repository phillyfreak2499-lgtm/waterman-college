import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteShell({
  children,
  invertedHeader = false,
}: {
  children: ReactNode;
  invertedHeader?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-paper text-ink">
      <SiteHeader inverted={invertedHeader} />
      <div id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
