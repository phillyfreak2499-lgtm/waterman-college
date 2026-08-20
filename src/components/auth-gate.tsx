import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAccess } from "@/components/access-provider";
import { PageSkeleton } from "@/components/page-skeleton";
import { Redirect, RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const { access, ready } = useAccess();
  const location = useLocation();
  if (isPending || (user && !ready)) {
    return <PageSkeleton label="Opening this page" />;
  }
  if (!user) return <RedirectToSignIn />;
  if (access.mustChangePassword && location.pathname !== "/change-password") {
    return <Redirect to="/change-password" />;
  }
  return <>{children}</>;
}
