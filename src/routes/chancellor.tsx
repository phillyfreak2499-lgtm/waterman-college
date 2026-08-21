import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { Redirect } from "@/lib/auth/gates";
import { useCatalog } from "@/components/catalog-provider";
import { Button } from "@/components/ui/button";
import {
  ACCESS_ROLES,
  type AccessRole,
  type DirectoryPerson,
} from "@/lib/access";
import {
  officeAddUser,
  officeApproveUser,
  officeListUsers,
  officeUpdateUser,
} from "@/lib/accounts";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  archiveTrack,
  deleteNews,
  deleteTrack,
  listOfficeTracks,
  saveLesson,
  saveNews,
  savePages,
  saveSite,
  saveTrack,
  slugify,
  uploadMedia,
  withPageDefaults,
  type PageContent,
  type SiteSettings,
} from "@/lib/cms";
import { ALL_OFF_PERMS, type Perms } from "@/lib/perms";
import {
  deleteRbacRole,
  listAudit,
  listRbacRoles,
  saveRbacRole,
  type RbacRole,
} from "@/lib/rbac";
import { listTrainerNotes, markNoteReviewed, type TrainerNote } from "@/lib/ask-trainer";
import { getWeeklyDigest, type WeeklyDigest } from "@/lib/digest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chancellor")({ component: ChancellorPage });

const TABS = [
  { id: "desk", label: "Desk" },
  { id: "people", label: "People" },
  { id: "inbox", label: "Inbox" },
  { id: "roles", label: "Roles" },
  { id: "training", label: "Training" },
  { id: "site", label: "Site" },
  { id: "log", label: "Log" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function ChancellorPage() {
  return (
    <AuthGate>
      <Gate />
    </AuthGate>
  );
}

function Gate() {
  const { access, ready } = useAccess();
  if (!ready) {
    return <div className="grid min-h-dvh place-items-center bg-navy-deep text-brass-soft">Opening the office…</div>;
  }
  if (!access.isChancellor) return <Redirect to="/" />;
  return <Office />;
}

function Office() {
  const { user } = useCurrentUserState();
  const [tab, setTab] = useState<Tab>("desk");
  return (
    <div className="min-h-dvh bg-navy-deep text-paper">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-brass-soft">
              Restricted
            </p>
            <h1 className="font-display text-2xl leading-none sm:text-3xl">Chancellor’s Office</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-brass-soft">{user?.displayName ?? "Chancellor"}</span>
            <Link to="/" className="text-paper/70 hover:text-paper">
              Campus
            </Link>
            <button type="button" className="text-paper/70 hover:text-paper" onClick={() => void signOut("/")}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 sm:px-8">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative h-11 shrink-0 px-4 text-xs font-medium uppercase tracking-[0.14em]",
                tab === item.id ? "text-paper" : "text-paper/50 hover:text-paper",
              )}
            >
              {item.label}
              <span className={cn("absolute inset-x-3 -bottom-px h-0.5", tab === item.id ? "bg-brass" : "bg-transparent")} />
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {tab === "desk" && <Desk onJump={setTab} />}
        {tab === "people" && <PeopleDesk />}
        {tab === "inbox" && <InboxDesk />}
        {tab === "roles" && <RolesDesk />}
        {tab === "training" && <TrainingDesk />}
        {tab === "site" && <SiteDesk />}
        {tab === "log" && <LogDesk />}
      </main>
    </div>
  );
}

function Desk({ onJump }: { onJump: (tab: Tab) => void }) {
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [tracks, setTracks] = useState<Awaited<ReturnType<typeof listOfficeTracks>>>([]);
  const [log, setLog] = useState<Awaited<ReturnType<typeof listAudit>>>([]);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  useEffect(() => {
    officeListUsers().then(setPeople).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load people"));
    listOfficeTracks().then(setTracks).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load training"));
    listAudit().then(setLog).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load the audit log"));
    getWeeklyDigest().then(setDigest).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load the digest"));
  }, []);
  const pending = people.filter((p) => p.accountStatus === "pending");
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Pending accounts" value={String(pending.length)} />
        <Stat label="Active trainings" value={String(tracks.filter((t) => !t.archived).length)} />
        <Stat label="On the roster" value={String(people.filter((p) => p.accountStatus === "approved").length)} />
      </div>

      {digest && (
        <section className="rounded-lg border border-paper/15 bg-navy p-5">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brass-soft">
            Weekly digest · {digest.weekOf}
          </p>
          <h2 className="mt-2 font-display text-3xl">This week on campus</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <DigestCol title="Pending" rows={digest.pending} empty="No one waiting." />
            <DigestCol title="Overdue" rows={digest.overdue} empty="Nobody is overdue." />
            <DigestCol title="Finished this week" rows={digest.finished} empty="No completions yet." />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Waiting on you</h2>
          <button type="button" className="text-sm text-brass-soft hover:text-paper" onClick={() => onJump("people")}>
            All people
          </button>
        </div>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-paper/60">No one is waiting.</p>
        ) : (
          <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
            {pending.slice(0, 6).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-paper/55">
                    @{p.username} · {p.store || "No store"} · {p.title || "No title"}
                  </p>
                </div>
                <Button size="sm" variant="brass" onClick={() => onJump("people")}>
                  Review
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-display text-3xl">Recent office actions</h2>
        <ul className="mt-4 space-y-2 text-sm text-paper/70">
          {log.slice(0, 8).map((row) => (
            <li key={row.id}>
              <span className="text-brass-soft">{row.action}</span> — {row.detail}
            </li>
          ))}
          {!log.length && <li>The log is empty.</li>}
        </ul>
      </section>
    </div>
  );
}

function PeopleDesk() {
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    officeListUsers().then(setPeople).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load people"));
    listRbacRoles().then(setRoles).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load roles"));
  }, []);

  const shown = people.filter((p) => {
    if (filter !== "all" && p.accountStatus !== filter) return false;
    const hay = `${p.name} ${p.username} ${p.store} ${p.title}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-8">
      <AddUserForm
        roles={roles}
        busy={busy === "add"}
        onAdd={async (input) => {
          setBusy("add");
          try {
            setPeople(await officeAddUser({ data: input }));
            toast.success("Account created and approved.");
            return true;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add");
            return false;
          } finally {
            setBusy(null);
          }
        }}
      />
      <div className="flex flex-wrap gap-3">
        <input
          className={darkInput}
          placeholder="Search name, store, title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={darkInput} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>
      <ul className="divide-y divide-paper/10 border-t border-paper/10">
        {shown.map((person) => (
          <UserRow
            key={person.id}
            person={person}
            roles={roles}
            busy={busy === person.id}
            onSave={async (patch) => {
              setBusy(person.id);
              try {
                setPeople(await officeUpdateUser({ data: { userId: person.id, ...patch } }));
                toast.success("Account updated.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save");
              } finally {
                setBusy(null);
              }
            }}
            onApprove={async (rbacRole) => {
              setBusy(person.id);
              try {
                setPeople(
                  await officeApproveUser({
                    data: { userId: person.id, rbacRole, accessRole: "specialist" },
                  }),
                );
                toast.success(`${person.name} is approved.`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not approve");
              } finally {
                setBusy(null);
              }
            }}
          />
        ))}
      </ul>
      {!shown.length && <p className="text-sm text-paper/55">No accounts match.</p>}
    </div>
  );
}

function UserRow({
  person,
  roles,
  busy,
  onSave,
  onApprove,
}: {
  person: DirectoryPerson;
  roles: RbacRole[];
  busy: boolean;
  onSave: (patch: {
    store: string;
    title: string;
    status: DirectoryPerson["accountStatus"];
    rbacRole: string;
    accessRole: AccessRole;
  }) => Promise<void>;
  onApprove: (rbacRole: string) => Promise<void>;
}) {
  const [store, setStore] = useState(person.store ?? "");
  const [title, setTitle] = useState(person.title);
  const [status, setStatus] = useState(person.accountStatus);
  const [rbacRole, setRbacRole] = useState(person.rbacRoleId || "sales-associate");
  useEffect(() => {
    setStore(person.store ?? "");
    setTitle(person.title);
    setStatus(person.accountStatus);
    setRbacRole(person.rbacRoleId || "sales-associate");
  }, [person.store, person.title, person.accountStatus, person.rbacRoleId]);
  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-start">
      <div>
        <p className="font-medium">{person.name}</p>
        <p className="text-sm text-paper/55">
          @{person.username} · never shows a password
        </p>
        <p className="mt-1 text-xs text-paper/40">
          Created {person.createdAt.slice(0, 10) || "—"} · Last login{" "}
          {person.lastLogin ? person.lastLogin.slice(0, 16).replace("T", " ") : "never"}
        </p>
      </div>
      <div className="grid gap-2">
        <input className={darkInput} value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store" />
        <input className={darkInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      </div>
      <div className="grid gap-2">
        <select className={darkInput} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select className={darkInput} value={rbacRole} onChange={(e) => setRbacRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {person.accountStatus === "pending" && (
            <Button size="sm" variant="brass" disabled={busy} onClick={() => void onApprove(rbacRole)}>
              Approve
            </Button>
          )}
          <Button
            size="sm"
            variant="invert"
            disabled={busy}
            onClick={() =>
              void onSave({
                store,
                title,
                status,
                rbacRole,
                accessRole: person.role,
              })
            }
          >
            Save
          </Button>
        </div>
      </div>
    </li>
  );
}

function AddUserForm({
  roles,
  busy,
  onAdd,
}: {
  roles: RbacRole[];
  busy: boolean;
  onAdd: (input: {
    username: string;
    password: string;
    fullName: string;
    store: string;
    title: string;
    rbacRole: string;
  }) => Promise<boolean>;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [store, setStore] = useState("");
  const [title, setTitle] = useState("");
  const [rbacRole, setRbacRole] = useState("sales-associate");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await onAdd({ fullName, username, password, store, title, rbacRole })) {
      setFullName("");
      setUsername("");
      setPassword("");
      setStore("");
      setTitle("");
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-lg border border-paper/15 bg-navy p-5">
      <h2 className="font-display text-3xl">Add a person</h2>
      <p className="mt-1 text-sm text-paper/60">Approved immediately. Password is hashed. You will not see it again.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <input required className={darkInput} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Username">
          <input required className={darkInput} value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Temporary password">
          <input required type="password" minLength={12} autoComplete="new-password" className={darkInput} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Store">
          <input required className={darkInput} value={store} onChange={(e) => setStore(e.target.value)} />
        </Field>
        <Field label="Title">
          <input required className={darkInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Role">
          <select className={darkInput} value={rbacRole} onChange={(e) => setRbacRole(e.target.value)}>
            {roles.filter((r) => r.id !== "super-admin").map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Button type="submit" className="mt-4" variant="invert" disabled={busy}>
        {busy ? "Adding…" : "Add and approve"}
      </Button>
    </form>
  );
}

function RolesDesk() {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [editing, setEditing] = useState<RbacRole | null>(null);
  useEffect(() => {
    listRbacRoles().then(setRoles).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load roles"));
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h2 className="font-display text-3xl">Roles</h2>
        <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
          {roles.map((role) => (
            <li key={role.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{role.name}</p>
                <p className="text-sm text-paper/55">{role.description}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="invert" onClick={() => setEditing(role)}>
                  Edit
                </Button>
                {!role.locked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-paper"
                    onClick={() => {
                      if (!confirm(`Remove the ${role.name} role?`)) return;
                      void deleteRbacRole({ data: role.id })
                        .then(setRoles)
                        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove role"));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <Button className="mt-4" variant="brass" onClick={() => setEditing({
          id: "",
          name: "",
          description: "",
          locked: false,
          accessRole: "specialist",
          perms: { ...ALL_OFF_PERMS, viewTraining: true, trainSpecialist: true },
        })}>
          New role
        </Button>
      </div>
      {editing && (
        <RoleForm
          role={editing}
          onSave={async (next) => {
            try {
              setRoles(await saveRbacRole({ data: next }));
              toast.success("Role saved.");
              setEditing(null);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save role");
            }
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function RoleForm({
  role,
  onSave,
  onCancel,
}: {
  role: RbacRole;
  onSave: (input: { id?: string; name: string; description: string; accessRole: AccessRole; perms: Perms }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [accessRole, setAccessRole] = useState<AccessRole>(role.accessRole);
  const [perms, setPerms] = useState<Perms>(role.perms);
  useEffect(() => {
    setName(role.name);
    setDescription(role.description);
    setAccessRole(role.accessRole);
    setPerms(role.perms);
  }, [role]);
  const flags: { key: keyof Perms; label: string }[] = [
    { key: "viewWhy", label: "View Why" },
    { key: "viewHow", label: "View How" },
    { key: "viewTraining", label: "Enter the hall" },
    { key: "viewDirectory", label: "Directory" },
    { key: "viewQuad", label: "The Quad" },
    { key: "viewRemarkable", label: "Be Remarkable" },
    { key: "viewTeam", label: "Team desk" },
    { key: "trainNewHires", label: "New Hire training" },
    { key: "trainSpecialist", label: "Specialist training" },
    { key: "trainMit", label: "MIT training" },
    { key: "trainManagers", label: "Manager training" },
    { key: "manageUsers", label: "Manage users" },
    { key: "manageTraining", label: "Add / edit training" },
    { key: "editSite", label: "Edit site content" },
  ];
  return (
    <form
      className="rounded-lg border border-paper/15 bg-navy p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ id: role.id || undefined, name, description, accessRole, perms });
      }}
    >
      <h3 className="font-display text-2xl">{role.id ? "Edit role" : "New role"}</h3>
      <div className="mt-4 space-y-3">
        <input className={darkInput} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" />
        <input className={darkInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <select className={darkInput} value={accessRole} onChange={(e) => setAccessRole(e.target.value as AccessRole)}>
          {ACCESS_ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              Hall path: {r.label}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          {flags.map((flag) => (
            <label key={flag.key} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={perms[flag.key]}
                onChange={(e) => setPerms({ ...perms, [flag.key]: e.target.checked })}
              />
              {flag.label}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" variant="invert">Save role</Button>
        <Button type="button" variant="ghost" className="text-paper" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TrainingDesk() {
  const { catalog, replace } = useCatalog();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listOfficeTracks>>>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState<AccessRole>("specialist");
  const [visibleToAll, setVisibleToAll] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listOfficeTracks().then(setRows).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load training"));
  }, [catalog.tracks]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = slugify(title);
      const next = await saveTrack({
        data: {
          id,
          role: role === "pending" || role === "admin" || role === "regional" || role === "trainer" || role === "sales-manager" || role === "ceo" ? "specialist" : role,
          title,
          nav: title,
          image: "/media/campus-cogs.jpg",
          audience: "Chancellor",
          summary,
          visibleToAll,
        },
      });
      replace(next);
      if (body.trim()) {
        await saveLesson({
          data: {
            trackId: id,
            slug: "overview",
            title: "Overview",
            minutes: 8,
            kicker: "Start here",
            body: body.trim(),
            takeaway: "",
          },
        });
      }
      setTitle("");
      setSummary("");
      setBody("");
      setVisibleToAll(false);
      toast.success("Training added.");
      setRows(await listOfficeTracks());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add training");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={(e) => void add(e)} className="rounded-lg border border-paper/15 bg-navy p-5">
        <h2 className="font-display text-3xl">Add training</h2>
        <p className="mt-1 text-sm text-paper/60">Existing courses stay as they are. This only adds a new one.</p>
        <div className="mt-4 grid gap-3">
          <input className={darkInput} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea className={`${darkInput} min-h-20 py-2`} required value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Description" />
          <textarea className={`${darkInput} min-h-28 py-2`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Content — text, steps, links" />
          <select
            className={darkInput}
            value={visibleToAll ? "all" : role}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all") setVisibleToAll(true);
              else {
                setRole(value as AccessRole);
                setVisibleToAll(false);
              }
            }}
          >
            <option value="new-hires">Who can view: New Hires</option>
            <option value="specialist">Who can view: Arch Support Specialists</option>
            <option value="mit">Who can view: MIT</option>
            <option value="managers">Who can view: Managers</option>
            <option value="all">Who can view: All (everyone)</option>
          </select>
        </div>
        <Button type="submit" className="mt-4" variant="invert" disabled={busy}>
          {busy ? "Saving…" : "Add training"}
        </Button>
      </form>

      <section>
        <h2 className="font-display text-3xl">All trainings</h2>
        <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
          {rows.map((track) => (
            <li key={track.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">{track.title}</p>
                <p className="text-sm text-paper/55">
                  {track.summary} · {track.role} · {track.lessons} lessons ·{" "}
                  {track.archived ? "draft / archived" : "active"} · updated {track.updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="invert"
                  onClick={() => {
                    const next = window.prompt("New title", track.title);
                    if (!next) return;
                    void saveTrack({
                      data: {
                        id: track.id,
                        role: track.role,
                        title: next,
                        nav: next,
                        image: "/media/campus-cogs.jpg",
                        audience: "",
                        summary: track.summary,
                        visibleToAll: track.visibleToAll,
                      },
                    }).then((c) => {
                      replace(c);
                      return listOfficeTracks().then(setRows);
                    }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not update training"));
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="brass"
                  onClick={() => {
                    if (!confirm(track.archived ? "Restore this training?" : "Archive this training?")) return;
                    void archiveTrack({ data: { id: track.id, archived: !track.archived } }).then(() =>
                      listOfficeTracks().then(setRows),
                    ).catch((error) => toast.error(error instanceof Error ? error.message : "Could not archive training"));
                  }}
                >
                  {track.archived ? "Restore" : "Archive"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-paper"
                  onClick={() => {
                    if (!confirm(`Permanently remove “${track.title}”? This cannot be undone.`)) return;
                    void deleteTrack({ data: track.id }).then((c) => {
                      replace(c);
                      return listOfficeTracks().then(setRows);
                    }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove training"));
                  }}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SiteDesk() {
  const { catalog, replace } = useCatalog();
  const [site, setSite] = useState<SiteSettings>(catalog.site);
  const [pages, setPages] = useState<PageContent>(withPageDefaults(catalog.pages));
  const [busy, setBusy] = useState(false);
  const siteDirty = useRef(false);
  const pagesDirty = useRef(false);
  useEffect(() => {
    if (!siteDirty.current) setSite(catalog.site);
  }, [catalog.site]);
  useEffect(() => {
    if (!pagesDirty.current) setPages(withPageDefaults(catalog.pages));
  }, [catalog.pages]);

  return (
    <div className="space-y-10">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void saveSite({ data: site })
            .then((c) => {
              siteDirty.current = false;
              replace(c);
              toast.success("Site settings saved.");
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))
            .finally(() => setBusy(false));
        }}
      >
        <h2 className="font-display text-3xl">College settings</h2>
        {(["name", "short", "tagline", "company", "adminEmail"] as const).map((key) => (
          <Field key={key} label={key}>
            <input className={darkInput} value={String(site[key] ?? "")} onChange={(e) => {
              siteDirty.current = true;
              setSite({ ...site, [key]: e.target.value });
            }} />
          </Field>
        ))}
        <Button type="submit" variant="invert" disabled={busy}>Save settings</Button>
      </form>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void savePages({ data: pages })
            .then((c) => {
              pagesDirty.current = false;
              replace(c);
              toast.success("Pages saved.");
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))
            .finally(() => setBusy(false));
        }}
      >
        <h2 className="font-display text-3xl">Home copy</h2>
        <Field label="Hero paragraph">
          <textarea className={`${darkInput} min-h-24 py-2`} value={pages.homeHeroBody} onChange={(e) => {
            pagesDirty.current = true;
            setPages({ ...pages, homeHeroBody: e.target.value });
          }} />
        </Field>
        <Field label="Hero photo">
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const raw = String(reader.result ?? "");
                const data = raw.includes(",") ? raw.split(",")[1] : raw;
                void uploadMedia({ data: { filename: file.name, mime: file.type, data: data ?? "" } }).then((up) => {
                  pagesDirty.current = true;
                  setPages((p) => ({ ...p, homeHeroImage: up.url }));
                  toast.success("Photo uploaded — save pages to publish.");
                }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not upload photo"));
              };
              reader.onerror = () => toast.error("Could not read that photo");
              reader.readAsDataURL(file);
            }}
          />
        </Field>
        <Button type="submit" variant="invert" disabled={busy}>Save pages</Button>
      </form>

      <section>
        <h2 className="font-display text-3xl">Be Remarkable posts</h2>
        <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
          {catalog.news.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-paper/55">{item.date}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-paper"
                onClick={() => {
                  if (!confirm("Remove this post?")) return;
                  void deleteNews({ data: item.id })
                    .then(replace)
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not remove post"));
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4"
          variant="brass"
          onClick={() => {
            const title = window.prompt("Post title");
            if (!title) return;
            const body = window.prompt("Post body") ?? "";
            void saveNews({
              data: {
                id: "",
                slug: "",
                title,
                date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                body,
                image: null,
              },
            }).then(replace).catch((error) => toast.error(error instanceof Error ? error.message : "Could not publish post"));
          }}
        >
          New post
        </Button>
      </section>
    </div>
  );
}

function LogDesk() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAudit>>>([]);
  useEffect(() => {
    listAudit().then(setRows).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load the audit log"));
  }, []);
  return (
    <div>
      <h2 className="font-display text-3xl">Audit log</h2>
      <p className="mt-2 text-sm text-paper/60">Approvals, roles, training, and site edits.</p>
      <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
        {rows.map((row) => (
          <li key={row.id} className="py-3">
            <p className="text-sm text-brass-soft">{row.action}</p>
            <p className="text-sm text-paper/80">{row.detail}</p>
            <p className="text-xs text-paper/40">
              {row.actorName} · {row.createdAt.slice(0, 19).replace("T", " ")}
            </p>
          </li>
        ))}
        {!rows.length && <li className="py-4 text-sm text-paper/55">No actions yet.</li>}
      </ul>
    </div>
  );
}

function DigestCol({ title, rows, empty }: { title: string; rows: WeeklyDigest["pending"]; empty: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-brass-soft">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-paper/55">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {rows.slice(0, 8).map((row, i) => (
            <li key={`${row.name}-${i}`}>
              <p className="font-medium">{row.name}</p>
              <p className="text-paper/55">{row.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InboxDesk() {
  const [notes, setNotes] = useState<TrainerNote[]>([]);
  useEffect(() => {
    listTrainerNotes().then(setNotes).catch((error) => toast.error(error instanceof Error ? error.message : "Could not load professor questions"));
  }, []);
  return (
    <div>
      <h2 className="font-display text-3xl">Ask the professor</h2>
      <p className="mt-2 text-sm text-paper/60">
        Questions from lessons land here, next to the check-ins on the training office desk.
      </p>
      <ul className="mt-6 divide-y divide-paper/10 border-t border-paper/10">
        {notes.map((note) => (
          <li key={note.id} className="py-4">
            <p className="text-sm text-brass-soft">
              {note.userName}
              {note.store ? ` · ${note.store}` : ""} · {note.trackTitle} · {note.lessonTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{note.body}</p>
            <p className="mt-2 text-xs text-paper/40">
              {note.createdAt.slice(0, 16).replace("T", " ")}
              {note.reviewedAt ? " · reviewed" : ""}
            </p>
            {!note.reviewedAt && (
              <Button
                size="sm"
                variant="invert"
                className="mt-3"
                onClick={() => {
                  void markNoteReviewed({ data: note.id })
                    .then(setNotes)
                    .catch((error) => toast.error(error instanceof Error ? error.message : "Could not update the question"));
                }}
              >
                Mark reviewed
              </Button>
            )}
          </li>
        ))}
        {!notes.length && <li className="py-6 text-sm text-paper/55">No questions yet.</li>}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-paper/15 bg-navy p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-brass-soft">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-paper/50">{label}</span>
      {children}
    </label>
  );
}

const darkInput =
  "h-11 w-full rounded-sm border border-paper/15 bg-navy-deep px-3 text-paper placeholder:text-paper/35 focus:outline-2 focus:outline-offset-1 focus:outline-brass";
