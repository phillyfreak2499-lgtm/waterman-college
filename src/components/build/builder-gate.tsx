import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";

/**
 * Gate the Training Building Center to builders: anyone with the manageTraining
 * permission (Professors + granted bosses) or an admin/Chancellor. This is a
 * cosmetic gate — every builder server fn re-checks with assertCanBuildTraining.
 */
export function BuilderGate({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <AuthGate>
        <GateBody>{children}</GateBody>
      </AuthGate>
    </SiteShell>
  );
}

function GateBody({ children }: { children: ReactNode }) {
  const { access, ready } = useAccess();
  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }
  const canBuild = access.perms.manageTraining || access.isAdmin;
  if (!canBuild) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="kicker">Training Building Center</p>
        <h1 className="mt-3 font-display text-4xl">This workshop is closed to you.</h1>
        <p className="mt-4 text-muted">
          Building trainings is for Professors and managers. If you should have access, ask the Chancellor to grant
          your role the training permission.
        </p>
        <Link to="/training" search={{}} className="mt-6 inline-block text-navy underline">
          Back to Training
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
