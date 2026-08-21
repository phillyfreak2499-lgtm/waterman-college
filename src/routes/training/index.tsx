import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { ProgressPanel } from "@/components/progress-panel";
import { SiteShell } from "@/components/site-shell";
import { TrainingTabs } from "@/components/training-tabs";
import { VaultHall } from "@/components/vault-hall";
import { useProgress } from "@/components/progress-provider";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { accessLabel } from "@/lib/access";
import { isRoleId, type RoleId, type Track } from "@/lib/content";
import { trackDeck } from "@/lib/decks";
import { ledgerProgress, trackStats } from "@/lib/progress-stats";
import type { ProgressRow } from "@/lib/progress";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/training/")({
  validateSearch: (search: Record<string, unknown>): { role?: RoleId } => ({
    role: isRoleId(search.role) ? search.role : undefined,
  }),
  component: TrainingHome,
  head: () => pageHead("Training", "Open the vault. Choose your door. The lessons have not moved."),
});

function TrainingHome() {
  const { role } = Route.useSearch();
  if (!role) {
    return <VaultEntry />;
  }
  return (
    <SiteShell>
      <AuthGate>
        <Campus />
      </AuthGate>
    </SiteShell>
  );
}

function VaultEntry() {
  const { user, isPending } = useCurrentUserState();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || isPending) return <VaultHall armed={false} />;
  if (!user) return <RedirectToSignIn />;
  return <VaultHall armed />;
}

function Campus() {
  const { role: roleParam } = Route.useSearch();
  const { catalog } = useCatalog();
  const { access, ready: accessReady } = useAccess();
  const { rows, ready } = useProgress();

  if (!accessReady) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  if (access.role === "pending" || !access.allowedTabs.length) {
    return <LockedPath role={access.role} />;
  }

  const role = roleParam && access.allowedTabs.includes(roleParam) ? roleParam : access.allowedTabs[0];
  const meta = catalog.roles.find((r) => r.id === role) ?? catalog.roles[0];
  const visible = catalog.tracks.filter((t) => t.role === role || t.visibleToAll);
  const slideTracks = visible.filter((t) => trackDeck(t.id));
  const coreTracks = visible.filter((t) => !trackDeck(t.id));
  const assignedExtra = catalog.tracks.filter(
    (t) => access.assignedTrackIds.includes(t.id) && t.role !== role && !t.visibleToAll,
  );
  const seriesLabel = role === "managers" ? "Burgundy Track" : role === "specialist" ? "Blue Track" : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <TrainingTabs active={role} />

      <div className="mt-8">
        <ProgressPanel role={role} />
      </div>

      <p className="kicker mt-10">{meta.kicker}</p>
      <span className="rule-brass mt-3" />
      <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
        {meta.title}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{meta.summary}</p>
      <p className="mt-3 text-sm text-muted">
        Assigned as {accessLabel(access.role)}
        {access.store ? ` · ${access.store}` : ""}
      </p>

      {slideTracks.length > 0 && (
        <section className="mt-10">
          {seriesLabel && <p className="kicker mb-4">{seriesLabel}</p>}
          <TrackGrid tracks={slideTracks} rows={rows} ready={ready} />
        </section>
      )}

      {coreTracks.length > 0 && (
        <section className={slideTracks.length ? "mt-14" : "mt-10"}>
          {slideTracks.length > 0 && <p className="kicker mb-4">Campus courses</p>}
          <TrackGrid tracks={coreTracks} rows={rows} ready={ready} />
        </section>
      )}

      {assignedExtra.length > 0 && (
        <div className="mt-14">
          <p className="kicker">Assigned to you</p>
          <h2 className="mt-2 font-display text-3xl">From your manager</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {assignedExtra.map((t) => {
              const stats = trackStats(rows, t);
              return (
                <Link
                  key={t.id}
                  to="/training/$track"
                  params={{ track: t.id }}
                  className="card-surface p-6"
                >
                  <p className="kicker">Assigned</p>
                  <h3 className="mt-2 font-display text-3xl leading-none">{t.title}</h3>
                  <p className="mt-3 text-sm text-muted">
                    {ready ? `${stats.done}/${stats.total} lessons` : "—"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TrackGrid({
  tracks,
  rows,
  ready,
}: {
  tracks: Track[];
  rows: ProgressRow[];
  ready: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {tracks.map((t) => {
        const stats = trackStats(rows, t);
        const deck = trackDeck(t.id);
        const pct = ready && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
        return (
          <Link
            key={t.id}
            to="/training/$track"
            params={{ track: t.id }}
            className="card-surface group overflow-hidden"
          >
            <div className="relative aspect-[2/1] overflow-hidden">
              <img
                src={t.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {deck && (
                <span className="absolute left-3 top-3 rounded-sm bg-navy/85 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
                  {deck.label}
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="kicker">
                  {stats.total > 0 && stats.done === stats.total
                    ? "Complete"
                    : stats.started > 0
                      ? "In progress"
                      : t.audience}
                </p>
                <p className="text-xs tabular-nums text-muted">
                  {ready ? `${stats.done}/${stats.total}` : "—"}
                </p>
              </div>
              <h2 className="mt-2 font-display text-3xl leading-none">{t.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.summary}</p>
              <p className="mt-4 text-sm text-navy">
                {ready ? ledgerProgress(rows, [t]).line : "—"}
              </p>
              <div className="progress-track mt-4">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
