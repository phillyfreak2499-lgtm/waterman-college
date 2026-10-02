import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAccess } from "@/components/access-provider";
import { FormatBadge } from "@/components/audience-fields";
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
import {
  COURSE_FORMATS,
  formatRank,
  isCourseFormat,
  onPathTab,
  searchText,
  type CourseFormat,
} from "@/lib/course-audience";
import { trackDeck } from "@/lib/decks";
import { ledgerProgress, trackStats } from "@/lib/progress-stats";
import type { ProgressRow } from "@/lib/progress";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

type CampusSearch = { role?: RoleId; format?: CourseFormat; category?: string };

export const Route = createFileRoute("/training/")({
  // format and category ride in the URL like ?role= so a manager can text a
  // link such as "Specialist → Mastery → Product Knowledge".
  validateSearch: (search: Record<string, unknown>): CampusSearch => ({
    role: isRoleId(search.role) ? search.role : undefined,
    format: isCourseFormat(search.format) ? search.format : undefined,
    category:
      typeof search.category === "string" && /^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(search.category)
        ? search.category
        : undefined,
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
  const { role: roleParam, format, category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { catalog } = useCatalog();
  const { access, ready: accessReady } = useAccess();
  const { rows, ready } = useProgress();
  const [query, setQuery] = useState("");
  const role = roleParam && access.allowedTabs.includes(roleParam) ? roleParam : access.allowedTabs[0];

  // Step 1: the path tab — every course whose audience includes it, plus Everyone.
  const onTab = useMemo(
    () => (role ? catalog.tracks.filter((t) => onPathTab(t, role)) : []),
    [catalog.tracks, role],
  );
  // Step 2: format. Step 3: category, or a search across the whole path.
  const byFormat = format ? onTab.filter((t) => (t.format ?? "read-respond") === format) : onTab;
  const categoryCounts = new Map<string, number>();
  for (const t of byFormat) {
    for (const id of t.categoryIds ?? []) categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
  }
  const chips = catalog.categories.filter((c) => categoryCounts.has(c.id));
  const activeCategory = category && categoryCounts.has(category) ? category : undefined;
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? onTab.filter((t) => searchText(t, catalog.categories).includes(needle))
    : activeCategory
      ? byFormat.filter((t) => t.categoryIds?.includes(activeCategory))
      : byFormat;
  const groups = COURSE_FORMATS.map((f) => ({
    ...f,
    tracks: shown.filter((t) => formatRank(t.format) === formatRank(f.id)),
  })).filter((group) => group.tracks.length > 0);

  function setFilter(next: Partial<CampusSearch>) {
    void navigate({ search: (prev: CampusSearch) => ({ ...prev, ...next }), replace: true });
  }

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

  const meta = catalog.roles.find((r) => r.id === role) ?? catalog.roles[0];
  const assignedExtra = catalog.tracks.filter(
    (t) => access.assignedTrackIds.includes(t.id) && !onPathTab(t, role),
  );

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

      {onTab.length > 0 && (
        <div className="mt-10 space-y-3">
          <ChipRow label="Format">
            <Chip active={!format} onClick={() => setFilter({ format: undefined, category: undefined })}>
              All
            </Chip>
            {COURSE_FORMATS.map((f) => (
              <Chip
                key={f.id}
                active={format === f.id}
                onClick={() => setFilter({ format: f.id, category: undefined })}
              >
                {f.label}
              </Chip>
            ))}
          </ChipRow>
          {chips.length > 0 && (
            <ChipRow label="Category">
              {chips.map((c) => (
                <Chip
                  key={c.id}
                  active={activeCategory === c.id}
                  onClick={() => setFilter({ category: activeCategory === c.id ? undefined : c.id })}
                >
                  {c.label}
                  <span className="tabular-nums opacity-70">{categoryCounts.get(c.id)}</span>
                </Chip>
              ))}
            </ChipRow>
          )}
          <label className="relative block max-w-md">
            <span className="sr-only">Search this path</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search all of ${meta.label}`}
              className="h-11 w-full rounded-sm border border-line bg-paper pl-9 pr-3 text-sm text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy"
            />
          </label>
        </div>
      )}

      {groups.map((group, index) => (
        <section key={group.id} className={index === 0 ? "mt-8" : "mt-14"}>
          {(!format || needle) && <p className="kicker mb-4">{group.label}</p>}
          <TrackGrid tracks={group.tracks} rows={rows} ready={ready} />
        </section>
      ))}

      {onTab.length > 0 && groups.length === 0 && (
        <p className="mt-8 text-sm text-muted">
          {needle ? `Nothing on this path matches “${query.trim()}”.` : "No courses match these filters yet."}
        </p>
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
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <FormatBadge format={t.format} />
                {deck && (
                  <span className="rounded-sm bg-navy/85 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft">
                    {deck.label}
                  </span>
                )}
              </div>
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

/** A labelled chip row that scrolls sideways inside itself, never the page. */
function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="w-16 shrink-0 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
        <div className="flex w-max gap-2 py-1" role="group" aria-label={label}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium",
        active ? "border-navy bg-navy text-paper" : "border-line bg-paper text-ink hover:border-navy/40",
      )}
    >
      {children}
    </button>
  );
}
