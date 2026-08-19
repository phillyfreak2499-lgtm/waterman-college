import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { QuizEditor, QuizInbox } from "@/components/admin-quizzes";
import { AccountsEditor } from "@/components/admin-accounts";
import { LessonLinksEditor } from "@/components/admin-lesson-links";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { useCatalog } from "@/components/catalog-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  ACCESS_ROLES,
  accessLabel,
  assignAccess,
  assignableRoles,
  listPeople,
  type AccessRole,
  type DirectoryPerson,
} from "@/lib/access";
import {
  deleteLesson,
  deleteMedia,
  deleteNews,
  deleteTrack,
  isAdmin,
  listMedia,
  lockAdmin,
  saveLesson,
  saveNews,
  savePages,
  saveRoles,
  saveSite,
  saveTrack,
  slugify,
  unlockAdmin,
  uploadMedia,
  withPageDefaults,
  type LessonInput,
  type MediaItem,
  type NewsItem,
  type PageContent,
  type RoleCopy,
  type SiteSettings,
  type TrackInput,
} from "@/lib/cms";
import { isRoleId } from "@/lib/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const TABS = [
  { id: "accounts", label: "Accounts" },
  { id: "people", label: "People" },
  { id: "inbox", label: "Inbox" },
  { id: "quizzes", label: "Quizzes" },
  { id: "site", label: "Site" },
  { id: "news", label: "News" },
  { id: "training", label: "Training" },
  { id: "pages", label: "Pages" },
  { id: "lesson-links", label: "Lesson links" },
  { id: "library", label: "Uploads" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  return (
    <SiteShell>
      <AuthGate>
        <AdminOffice />
      </AuthGate>
    </SiteShell>
  );
}

function AdminOffice() {
  const { catalog, replace } = useCatalog();
  const { access, refresh } = useAccess();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("accounts");

  useEffect(() => {
    if (access.isAdmin || access.canSeeCompany) {
      setUnlocked(true);
      return;
    }
    if (access.canManagePeople) {
      setUnlocked(true);
      return;
    }
    isAdmin()
      .then(setUnlocked)
      .catch(() => setUnlocked(false));
  }, [access.isAdmin, access.canSeeCompany, access.canManagePeople]);

  if (unlocked === null) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-navy/10" />
        <div className="mt-6 h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  const officeOpen = access.isAdmin || access.canSeeCompany || unlocked === true;
  if (!officeOpen && !access.canManagePeople) {
    return (
      <PasswordGate
        onUnlock={() => {
          setUnlocked(true);
          void refresh();
        }}
      />
    );
  }

  const tabs = officeOpen
    ? access.isAdmin
      ? TABS
      : TABS.filter((item) => item.id === "people" || item.id === "inbox" || item.id === "quizzes")
    : TABS.filter((item) => item.id === "people");
  const active = tabs.some((item) => item.id === tab) ? tab : tabs[0].id;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
            {officeOpen ? "Training office" : "Team"}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none">
            {officeOpen ? "Admin" : "People"}
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            {officeOpen
              ? "Approve accounts, place people, check the inbox, and keep the college current. Training courses stay as they are."
              : "Place Specialists on the right path and under the right manager."}
          </p>
        </div>
        {officeOpen && access.isAdmin && (
          <Button
            variant="ghost"
            onClick={() => {
              void lockAdmin()
                .then(() => setUnlocked(false))
                .catch((error) =>
                  toast.error(error instanceof Error ? error.message : "Could not lock the office"),
                );
            }}
          >
            Lock office
          </Button>
        )}
      </div>

      <div className="mt-8 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-1 border-b border-line">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative flex h-11 items-center px-4 text-xs font-medium uppercase tracking-[0.14em]",
                active === item.id ? "text-navy" : "text-muted hover:text-navy",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5",
                  active === item.id ? "bg-navy" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {access.isAdmin && active === "accounts" && <AccountsEditor />}
        {active === "people" && <PeopleEditor />}
        {officeOpen && active === "inbox" && <QuizInbox />}
        {officeOpen && active === "quizzes" && <QuizEditor />}
        {officeOpen && active === "site" && (
          <SiteEditor site={catalog.site} roles={catalog.roles} onSave={replace} />
        )}
        {officeOpen && active === "news" && <NewsEditor news={catalog.news} onSave={replace} />}
        {officeOpen && active === "training" && (
          <TrainingEditor tracks={catalog.tracks} onSave={replace} />
        )}
        {officeOpen && active === "pages" && <PagesEditor pages={catalog.pages} onSave={replace} />}
        {officeOpen && active === "lesson-links" && <LessonLinksEditor />}
        {officeOpen && active === "library" && <Library />}
      </div>
    </div>
  );
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await unlockAdmin({ data: password.trim() });
      onUnlock();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not unlock";
      setError(message.includes("Wrong password") ? "That password did not match." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">Restricted</p>
      <h1 className="mt-3 font-display text-4xl leading-none">The office</h1>
      <p className="mt-4 text-muted">
        This page is for the training office. Enter the office password to claim the
        admin role, or ask a manager to assign yours.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4">
        <Field label="Office password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
            required
          />
        </Field>
        {error && <p className="text-sm text-navy">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";
const areaClass =
  "min-h-28 w-full rounded-sm border border-line bg-paper px-3 py-2 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PeopleEditor() {
  const { access, refresh } = useAccess();
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const options = assignableRoles(access.role);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    listPeople()
      .then((next) => {
        if (!cancelled) setPeople(next);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load people");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const filtered = people.filter((person) => {
    const hay = `${person.name} ${person.username} ${person.email} ${person.store ?? ""}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });
  const waiting = people.filter((p) => p.role === "pending").length;
  const bosses = people.filter(
    (p) =>
      p.role === "managers" ||
      p.role === "regional" ||
      p.role === "trainer" ||
      p.role === "sales-manager" ||
      p.role === "ceo" ||
      p.role === "admin",
  );

  async function save(person: DirectoryPerson, role: AccessRole, store: string, reportsTo: string) {
    setBusyId(person.id);
    try {
      const next = await assignAccess({
        data: { userId: person.id, role, store, reportsTo: reportsTo || null },
      });
      setPeople(next);
      if (person.id === access.userId) void refresh();
      toast.success(`${person.name} is now ${accessLabel(role)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign");
    } finally {
      setBusyId(null);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-3xl">People did not load</h2>
        <p role="alert" className="mt-3 text-sm text-muted">{loadError}</p>
        <Button type="button" className="mt-5" onClick={() => setLoadKey((key) => key + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">People</h2>
          <p className="mt-1 text-sm text-muted">
            {waiting ? `${waiting} waiting on assignment.` : "Everyone has a role."} Place
            Specialists under a Manager, Managers under a Regional / DM.
          </p>
        </div>
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="mt-6 divide-y divide-line border-t border-line">
        {filtered.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            options={options}
            bosses={bosses.filter((b) => b.id !== person.id)}
            busy={busyId === person.id}
            onSave={save}
          />
        ))}
      </ul>
      {!filtered.length && (
        <p className="mt-8 text-sm text-muted">No one matches that search.</p>
      )}
    </div>
  );
}

function PersonRow({
  person,
  options,
  bosses,
  busy,
  onSave,
}: {
  person: DirectoryPerson;
  options: AccessRole[];
  bosses: DirectoryPerson[];
  busy: boolean;
  onSave: (person: DirectoryPerson, role: AccessRole, store: string, reportsTo: string) => Promise<void>;
}) {
  const [role, setRole] = useState<AccessRole>(person.role);
  const [store, setStore] = useState(person.store ?? "");
  const [reportsTo, setReportsTo] = useState(person.reportsTo ?? "");
  useEffect(() => {
    setRole(person.role);
    setStore(person.store ?? "");
    setReportsTo(person.reportsTo ?? "");
  }, [person.role, person.store, person.reportsTo]);

  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[1.2fr_11rem_8rem_11rem_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium">{person.name}</p>
        <p className="truncate text-sm text-muted">
          {person.username ? `@${person.username}` : person.email}
        </p>
      </div>
      <select
        className={inputClass}
        value={role}
        onChange={(e) => {
          const value = e.target.value;
          if (ACCESS_ROLES.some((item) => item.id === value)) setRole(value as AccessRole);
        }}
      >
        {ACCESS_ROLES.filter((item) => options.includes(item.id) || item.id === person.role).map(
          (item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ),
        )}
      </select>
      <input
        className={inputClass}
        placeholder="Store"
        value={store}
        onChange={(e) => setStore(e.target.value)}
      />
      <select
        className={inputClass}
        value={reportsTo}
        onChange={(e) => setReportsTo(e.target.value)}
      >
        <option value="">Reports to…</option>
        {bosses.map((boss) => (
          <option key={boss.id} value={boss.id}>
            {boss.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        disabled={
          busy ||
          (role === person.role &&
            store === (person.store ?? "") &&
            reportsTo === (person.reportsTo ?? ""))
        }
        onClick={() => void onSave(person, role, store, reportsTo)}
      >
        {busy ? "Saving…" : "Save"}
      </Button>
    </li>
  );
}

function SiteEditor({
  site,
  roles,
  onSave,
}: {
  site: SiteSettings;
  roles: RoleCopy[];
  onSave: (c: Awaited<ReturnType<typeof saveSite>>) => void;
}) {
  const [form, setForm] = useState(site);
  const [roleForm, setRoleForm] = useState(roles);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(site), [site]);
  useEffect(() => setRoleForm(roles), [roles]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSite({ data: form });
      const next = await saveRoles({ data: roleForm });
      onSave(next);
      toast.success("Site saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campus name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Short name">
          <input className={inputClass} value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} />
        </Field>
        <Field label="Tagline">
          <input className={inputClass} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </Field>
        <Field label="Company">
          <input className={inputClass} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </Field>
        <Field label="Number of stores">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={form.stores}
            onChange={(e) => setForm({ ...form, stores: Number(e.target.value) })}
          />
        </Field>
        <Field label="Training office email">
          <input
            className={inputClass}
            type="email"
            value={form.adminEmail}
            onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          />
        </Field>
      </div>

      <div>
        <h2 className="font-display text-3xl">Training tab copy</h2>
        <p className="mt-1 text-sm text-muted">The heading each role sees on campus.</p>
        <div className="mt-4 grid gap-5">
          {roleForm.map((role, i) => (
            <div key={role.id} className="rounded-md border border-line bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-brass">{role.label}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Tab label">
                  <input
                    className={inputClass}
                    value={role.label}
                    onChange={(e) => {
                      const next = [...roleForm];
                      next[i] = { ...role, label: e.target.value };
                      setRoleForm(next);
                    }}
                  />
                </Field>
                <Field label="Kicker">
                  <input
                    className={inputClass}
                    value={role.kicker}
                    onChange={(e) => {
                      const next = [...roleForm];
                      next[i] = { ...role, kicker: e.target.value };
                      setRoleForm(next);
                    }}
                  />
                </Field>
                <Field label="Heading">
                  <input
                    className={inputClass}
                    value={role.title}
                    onChange={(e) => {
                      const next = [...roleForm];
                      next[i] = { ...role, title: e.target.value };
                      setRoleForm(next);
                    }}
                  />
                </Field>
                <Field label="Intro">
                  <input
                    className={inputClass}
                    value={role.summary}
                    onChange={(e) => {
                      const next = [...roleForm];
                      next[i] = { ...role, summary: e.target.value };
                      setRoleForm(next);
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save site"}
      </Button>
    </form>
  );
}

function NewsEditor({
  news,
  onSave,
}: {
  news: NewsItem[];
  onSave: (c: Awaited<ReturnType<typeof saveNews>>) => void;
}) {
  const blank: NewsItem = {
    id: "",
    slug: "",
    title: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    body: "",
    image: null,
  };
  const [editing, setEditing] = useState<NewsItem>(blank);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await saveNews({ data: editing });
      onSave(next);
      setEditing(blank);
      toast.success("News saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="font-display text-3xl">Be Remarkable posts</h2>
        <ul className="mt-4 space-y-3">
          {news.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface p-4">
              <button type="button" className="min-w-0 text-left" onClick={() => setEditing(item)}>
                <p className="text-xs text-muted">{item.date}</p>
                <p className="font-display text-2xl leading-tight">{item.title}</p>
              </button>
              <button
                type="button"
                className="h-11 shrink-0 px-2 text-sm text-muted hover:text-navy"
                onClick={() => {
                  if (!confirm("Remove this post?")) return;
                  void deleteNews({ data: item.id }).then((c) => {
                    onSave(c);
                    toast.success("Post removed");
                  }).catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Could not remove the post"),
                  );
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border border-line bg-surface p-5">
        <h3 className="font-display text-2xl">{editing.id ? "Edit post" : "New post"}</h3>
        <Field label="Title">
          <input className={inputClass} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
        </Field>
        <Field label="Date">
          <input className={inputClass} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
        </Field>
        <Field label="Body">
          <textarea className={areaClass} rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} required />
        </Field>
        <ImageField
          label="Optional image"
          value={editing.image ?? ""}
          onChange={(url) => setEditing({ ...editing, image: url || null })}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing.id ? "Save post" : "Publish post"}
          </Button>
          {editing.id && (
            <Button type="button" variant="ghost" onClick={() => setEditing(blank)}>
              New post
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function TrainingEditor({
  tracks,
  onSave,
}: {
  tracks: Awaited<ReturnType<typeof saveTrack>>["tracks"];
  onSave: (c: Awaited<ReturnType<typeof saveTrack>>) => void;
}) {
  const emptyTrack = (): TrackInput => ({
    id: "",
    role: "specialist",
    title: "",
    nav: "",
    image: "/media/campus-cogs.jpg",
    audience: "",
    summary: "",
  });
  const emptyLesson = (trackId: string): LessonInput => ({
    trackId,
    slug: "",
    title: "",
    minutes: 8,
    kicker: "",
    body: "",
    takeaway: "",
    evalPhases: [],
  });

  const [trackForm, setTrackForm] = useState<TrackInput>(emptyTrack());
  const [lessonForm, setLessonForm] = useState<LessonInput>(emptyLesson(""));
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = tracks.find((t) => t.id === selected);

  async function saveCurrentTrack(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await saveTrack({
        data: {
          ...trackForm,
          id: trackForm.id || slugify(trackForm.title),
          nav: trackForm.nav || trackForm.title,
        },
      });
      onSave(next);
      const id = trackForm.id || slugify(trackForm.title);
      setSelected(id);
      setTrackForm({ ...trackForm, id });
      toast.success("Course saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentLesson(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const next = await saveLesson({
        data: {
          ...lessonForm,
          trackId: selected,
          slug: lessonForm.slug || slugify(lessonForm.title),
        },
      });
      onSave(next);
      toast.success("Lesson saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setSelected(null);
            setTrackForm(emptyTrack());
            setLessonForm(emptyLesson(""));
          }}
        >
          Add a course
        </Button>
        <ul className="mt-4 space-y-1">
          {tracks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(t.id);
                  setTrackForm({
                    id: t.id,
                    role: t.role,
                    title: t.title,
                    nav: t.nav,
                    image: t.image,
                    audience: t.audience,
                    summary: t.summary,
                  });
                  setLessonForm(emptyLesson(t.id));
                }}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-sm px-3 text-left text-sm",
                  selected === t.id ? "bg-navy text-paper" : "hover:bg-paper-2",
                )}
              >
                <span className="truncate">{t.title}</span>
                <span className="ml-2 tabular-nums opacity-70">{t.lessons.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-10">
        <form onSubmit={(e) => void saveCurrentTrack(e)} className="space-y-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-display text-3xl">{trackForm.id ? "Edit course" : "New course"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input className={inputClass} value={trackForm.title} onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })} required />
            </Field>
            <Field label="Audience">
              <input className={inputClass} value={trackForm.audience} onChange={(e) => setTrackForm({ ...trackForm, audience: e.target.value })} placeholder="Every Specialist" />
            </Field>
            <Field label="Tab">
              <select
                className={inputClass}
                value={trackForm.role}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isRoleId(value)) setTrackForm({ ...trackForm, role: value });
                }}
              >
                <option value="new-hires">New Hires</option>
                <option value="specialist">Specialist</option>
                <option value="mit">MIT</option>
                <option value="managers">Managers</option>
              </select>
            </Field>
            <Field label="Short nav name">
              <input className={inputClass} value={trackForm.nav} onChange={(e) => setTrackForm({ ...trackForm, nav: e.target.value })} />
            </Field>
          </div>
          <Field label="Summary">
            <textarea className={areaClass} value={trackForm.summary} onChange={(e) => setTrackForm({ ...trackForm, summary: e.target.value })} />
          </Field>
          <ImageField label="Course image" value={trackForm.image} onChange={(url) => setTrackForm({ ...trackForm, image: url })} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save course"}
            </Button>
            {trackForm.id && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!confirm("Delete this course and its lessons?")) return;
                  void deleteTrack({ data: trackForm.id }).then((c) => {
                    onSave(c);
                    setSelected(null);
                    setTrackForm(emptyTrack());
                    toast.success("Course removed");
                  }).catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Could not remove the course"),
                  );
                }}
              >
                Delete course
              </Button>
            )}
          </div>
        </form>

        {current && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl">Lessons</h3>
              <ul className="mt-3 space-y-2">
                {current.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-sm border border-line bg-paper px-3 text-left text-sm hover:border-navy/30"
                      onClick={() =>
                        setLessonForm({
                          trackId: current.id,
                          slug: lesson.slug,
                          title: lesson.title,
                          minutes: lesson.minutes,
                          kicker: lesson.kicker ?? "",
                          body: lesson.body.join("\n\n"),
                          takeaway: lesson.takeaway ?? "",
                          evalPhases: lesson.evalPhases ?? [],
                        })
                      }
                    >
                      <span className="truncate">{lesson.title}</span>
                      <span className="ml-2 text-muted">{lesson.minutes}m</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => setLessonForm(emptyLesson(current.id))}
              >
                Add a lesson
              </Button>
            </div>
            <form onSubmit={(e) => void saveCurrentLesson(e)} className="space-y-4 rounded-lg border border-line bg-surface p-5">
              <h3 className="font-display text-2xl">{lessonForm.slug ? "Edit lesson" : "New lesson"}</h3>
              <Field label="Title">
                <input className={inputClass} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minutes">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={lessonForm.minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, minutes: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Kicker">
                  <input className={inputClass} value={lessonForm.kicker} onChange={(e) => setLessonForm({ ...lessonForm, kicker: e.target.value })} />
                </Field>
              </div>
              <Field label="Lesson text" hint="Blank line between paragraphs.">
                <textarea
                  className={areaClass}
                  rows={8}
                  value={lessonForm.body}
                  onChange={(e) => setLessonForm({ ...lessonForm, body: e.target.value })}
                  required
                />
              </Field>
              <Field label="Takeaway">
                <input className={inputClass} value={lessonForm.takeaway} onChange={(e) => setLessonForm({ ...lessonForm, takeaway: e.target.value })} />
              </Field>
              <fieldset className="rounded-md border border-line bg-paper px-4 py-3">
                <legend className="px-1 text-sm font-medium text-ink">
                  Presentation phases this lesson strengthens
                </legend>
                <p className="mt-1 text-xs text-muted">
                  When a Specialist scores under 7 on a phase, tagged lessons from{" "}
                  <strong>this course&apos;s door</strong> are suggested in their Locker.
                  Leave blank if this lesson should not auto-suggest.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["welcome", "Welcome"],
                      ["interview", "Interview"],
                      ["analysis", "Analysis"],
                      ["fitting", "Fitting"],
                      ["solution", "Solution"],
                      ["close", "Close"],
                    ] as const
                  ).map(([id, label]) => {
                    const selected = (lessonForm.evalPhases || []).includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const cur = lessonForm.evalPhases || [];
                          setLessonForm({
                            ...lessonForm,
                            evalPhases: selected
                              ? cur.filter((p) => p !== id)
                              : [...cur, id],
                          });
                        }}
                        className={
                          selected
                            ? "rounded-sm border border-navy bg-navy px-3 py-1.5 text-xs font-medium text-paper"
                            : "rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-medium text-navy hover:border-navy/30"
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save lesson"}
                </Button>
                {lessonForm.slug && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (!confirm("Remove this lesson?")) return;
                      void deleteLesson({ data: { trackId: current.id, slug: lessonForm.slug } }).then((c) => {
                        onSave(c);
                        setLessonForm(emptyLesson(current.id));
                        toast.success("Lesson removed");
                      }).catch((error) =>
                        toast.error(error instanceof Error ? error.message : "Could not remove the lesson"),
                      );
                    }}
                  >
                    Delete lesson
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PagesEditor({
  pages,
  onSave,
}: {
  pages: PageContent;
  onSave: (c: Awaited<ReturnType<typeof savePages>>) => void;
}) {
  const [form, setForm] = useState(() => withPageDefaults(pages));
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(withPageDefaults(pages)), [pages]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      onSave(await savePages({ data: form }));
      toast.success("Pages saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof PageContent>(key: K, value: PageContent[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6">
      <h2 className="font-display text-3xl">Home & How it works</h2>
      <p className="text-sm text-muted">
        Change the copy and the photos. Uploads appear immediately — no publish step.
      </p>
      <ImageField
        label="Home — main photo (behind the headline)"
        value={form.homeHeroImage}
        onChange={(url) => set("homeHeroImage", url || "/media/campus-cogs.jpg")}
        allowClear
        clearTo="/media/campus-cogs.jpg"
      />
      <Field label="Home — hero paragraph">
        <textarea className={areaClass} value={form.homeHeroBody} onChange={(e) => set("homeHeroBody", e.target.value)} />
      </Field>
      <Field label="Home — standard heading">
        <input className={inputClass} value={form.homeStandardTitle} onChange={(e) => set("homeStandardTitle", e.target.value)} />
      </Field>
      <Field label="Home — standard body">
        <textarea className={areaClass} value={form.homeStandardBody} onChange={(e) => set("homeStandardBody", e.target.value)} />
      </Field>
      <ImageField
        label="Home — teaching photo"
        value={form.homeTeachImage}
        onChange={(url) => set("homeTeachImage", url || "/media/teaching-vs-training.jpg")}
        allowClear
        clearTo="/media/teaching-vs-training.jpg"
      />
      <Field label="Home — teaching heading">
        <input className={inputClass} value={form.homeTeachTitle} onChange={(e) => set("homeTeachTitle", e.target.value)} />
      </Field>
      <Field label="Home — teaching body">
        <textarea className={areaClass} value={form.homeTeachBody} onChange={(e) => set("homeTeachBody", e.target.value)} />
      </Field>
      <ImageField
        label="Home — onboarding photo"
        value={form.homeOnboardImage}
        onChange={(url) => set("homeOnboardImage", url || "/media/classroom.jpg")}
        allowClear
        clearTo="/media/classroom.jpg"
      />
      <Field label="Home — onboarding heading">
        <input className={inputClass} value={form.homeOnboardTitle} onChange={(e) => set("homeOnboardTitle", e.target.value)} />
      </Field>
      <Field label="Home — onboarding body">
        <textarea className={areaClass} value={form.homeOnboardBody} onChange={(e) => set("homeOnboardBody", e.target.value)} />
      </Field>
      <Field label="How it works — kicker">
        <input className={inputClass} value={form.howKicker} onChange={(e) => set("howKicker", e.target.value)} />
      </Field>
      <Field label="How it works — title">
        <input className={inputClass} value={form.howTitle} onChange={(e) => set("howTitle", e.target.value)} />
      </Field>
      <Field label="How it works — intro">
        <textarea className={areaClass} value={form.howIntro} onChange={(e) => set("howIntro", e.target.value)} />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save pages"}
      </Button>
    </form>
  );
}

function Library() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listMedia()
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load uploads");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div>
      <h2 className="font-display text-3xl">Uploads</h2>
      <p className="mt-2 text-sm text-muted">
        Add photos here, then use them on a course, a news post, or the home page. Keep images under 1.5 MB.
      </p>
      {error && (
        <div className="mt-4 rounded-md border border-line bg-surface p-4">
          <p role="alert" className="text-sm text-muted">{error}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </Button>
        </div>
      )}
      <div className="mt-5">
        <ImageField
          label="Upload an image"
          value=""
          onChange={() => {
            listMedia()
              .then(setItems)
              .catch((reason) =>
                toast.error(reason instanceof Error ? reason.message : "Could not refresh uploads"),
              );
          }}
          onUploaded={(item) => setItems((prev) => [item, ...prev])}
        />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-md border border-line bg-surface">
            <img src={item.data} alt="" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted">
              <span className="truncate">{item.filename}</span>
              <button
                type="button"
                className="shrink-0 text-navy hover:underline"
                onClick={() => {
                  if (!confirm(`Delete ${item.filename}? Existing pages using it will show a missing image.`)) return;
                  void deleteMedia({ data: item.id })
                    .then(() => {
                      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
                      toast.success("Upload removed");
                    })
                    .catch((reason) =>
                      toast.error(reason instanceof Error ? reason.message : "Could not remove the upload"),
                    );
                }}
              >
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUploaded,
  allowClear,
  clearTo,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (item: MediaItem) => void;
  allowClear?: boolean;
  clearTo?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await fileToPayload(file);
      const uploaded = await uploadMedia({ data: payload });
      onChange(uploaded.url);
      onUploaded?.({
        id: uploaded.id,
        filename: uploaded.filename,
        mime: file.type,
        data: uploaded.url,
      });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {value && (
        <img src={value} alt="" className="mb-3 h-28 w-full rounded-sm border border-line object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
          className="block min-w-0 flex-1 text-sm"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {allowClear && value && value !== clearTo && (
          <button
            type="button"
            className="h-11 shrink-0 text-sm text-muted hover:text-navy"
            onClick={() => onChange(clearTo ?? "")}
          >
            Use default
          </button>
        )}
      </div>
    </div>
  );
}

function fileToPayload(file: File) {
  return new Promise<{ filename: string; mime: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.split(",")[1] : result;
      resolve({ filename: file.name, mime: file.type || "image/jpeg", data: data ?? "" });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
