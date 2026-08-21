import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccess } from "@/components/access-provider";
import { AuthGate } from "@/components/auth-gate";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  deleteStore,
  getDirectory,
  placeDirectoryPerson,
  saveStore,
  type DirectoryEntry,
  type DirectorySnapshot,
  type StoreCard,
} from "@/lib/directory";
import type { AccessRole } from "@/lib/access";
import { deleteRegion, saveRegion, type Region } from "@/lib/regions";
import { Initials } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/directory")({
  component: DirectoryPage,
  head: () => pageHead("Directory", "The office, then every store — managers first, then the sales floor."),
});

function DirectoryPage() {
  return (
    <SiteShell>
      <AuthGate>
        <DirectoryDesk />
      </AuthGate>
    </SiteShell>
  );
}

function DirectoryDesk() {
  const { access } = useAccess();
  const [snap, setSnap] = useState<DirectorySnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getDirectory()
      .then((next) => {
        if (!cancelled) setSnap(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setSnap(null);
          setError(err instanceof Error ? err.message : "Could not load the directory");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [access.userId, reloadKey]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">Directory</p>
        <h1 className="mt-3 font-display text-4xl leading-none">The directory did not load.</h1>
        <p className="mt-4 text-muted">{error}</p>
        <Button type="button" className="mt-7" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  if (!snap) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="h-10 w-56 animate-pulse rounded-sm bg-navy/10" />
        <div className="mt-8 h-48 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const match = (person: DirectoryEntry) => {
    if (!q) return true;
    return `${person.name} ${person.email} ${person.title} ${person.roleLabel} ${person.storeName ?? ""}`
      .toLowerCase()
      .includes(q);
  };
  const office = snap.office.filter(match);
  const stores = snap.stores
    .map((store) => ({
      ...store,
      managers: store.managers.filter(match),
      sales: store.sales.filter(match),
      hidden: q
        ? !store.name.toLowerCase().includes(q) &&
          !store.city.toLowerCase().includes(q) &&
          !store.managers.some(match) &&
          !store.sales.some(match)
        : false,
    }))
    .filter((s) => !s.hidden);
  const unassigned = snap.unassigned.filter(match);

  // Split the floor into regions (East, West, …) plus an Unassigned bucket.
  // Named regions always show for editors so stores can be moved into them;
  // the Unassigned bucket only appears when it actually holds stores.
  const regionGroups = [
    ...snap.regions.map((r) => ({
      id: r.id as string | null,
      name: r.name,
      stores: stores.filter((s) => s.regionId === r.id),
    })),
    { id: null as string | null, name: "Unassigned", stores: stores.filter((s) => !s.regionId) },
  ].filter((g) => g.stores.length > 0 || (g.id !== null && snap.canEdit));

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-5 py-10 sm:px-8 sm:py-14">
      <p className="kicker">
        Waterman Arch Supports
      </p>
      <span className="rule-brass mt-3" />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">Directory</h1>
          <p className="mt-4 max-w-xl text-muted">
            The office, then every store — managers first, then the sales floor.
            {snap.canEdit ? " You can add stores and place people from this page." : ""}
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search the directory</span>
          <input
            className="field-input pr-3"
            placeholder="Search name, store, or title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <section className="mt-12">
        <SectionHead
          kicker="Headquarters"
          title="Administrative staff"
          count={`${office.length}`}
        />
        {office.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {office.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                snap={snap}
                onChange={setSnap}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No administrative staff match.</p>
        )}
      </section>

      <section className="mt-16">
        <SectionHead kicker="The floor" title="Stores" count={`${stores.length}`} />
        {snap.canEdit && (
          <RegionManager regions={snap.regions} reload={() => setReloadKey((k) => k + 1)} />
        )}
        {snap.canEdit && <AddStoreForm regions={snap.regions} onChange={setSnap} />}
        <div className="mt-8 space-y-12">
          {regionGroups.map((group) => (
            <div key={group.id ?? "unassigned"}>
              <div className="flex items-end justify-between gap-3 border-b border-line pb-2">
                <h3 className="font-display text-2xl leading-none">{group.name}</h3>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {group.stores.length} {group.stores.length === 1 ? "store" : "stores"}
                </p>
              </div>
              {group.stores.length ? (
                <div className="mt-5 space-y-6">
                  {group.stores.map((store) => (
                    <StoreBlock key={store.id} store={store} snap={snap} onChange={setSnap} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">No stores in this region yet.</p>
              )}
            </div>
          ))}
        </div>
        {!stores.length && (
          <p className="mt-4 text-sm text-muted">
            {snap.canEdit
              ? "Add stores above, create regions, then assign each store to a region."
              : "No stores listed yet."}
          </p>
        )}
      </section>

      {snap.canEdit && unassigned.length > 0 && (
        <section className="mt-16">
          <SectionHead
            kicker="Needs a home"
            title="Unassigned"
            count={`${unassigned.length}`}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                snap={snap}
                onChange={setSnap}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  count,
}: {
  kicker: string;
  title: string;
  count: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass">{kicker}</p>
        <h2 className="mt-1 font-display text-3xl leading-none">{title}</h2>
      </div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{count}</p>
    </div>
  );
}

function RegionManager({ regions, reload }: { regions: Region[]; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await saveRegion({ data: { name } });
      setName("");
      reload();
      toast.success("Region added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save region");
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    if (!editName.trim()) return;
    try {
      await saveRegion({ data: { id, name: editName } });
      setEditId(null);
      reload();
      toast.success("Region renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename region");
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete the ${label} region? Its stores become Unassigned.`)) return;
    try {
      await deleteRegion({ data: id });
      reload();
      toast.success("Region deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete region");
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="mt-4" onClick={() => setOpen(true)}>
        Manage regions
      </Button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">Regions</p>
        <button
          type="button"
          className="text-xs uppercase tracking-[0.12em] text-muted hover:text-navy"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {regions.map((r) => (
          <li key={r.id} className="flex items-center gap-2">
            {editId === r.id ? (
              <>
                <input
                  className={fieldClass}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Button type="button" onClick={() => void rename(r.id)}>
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditId(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.12em] text-muted hover:text-navy"
                  onClick={() => {
                    setEditId(r.id);
                    setEditName(r.name);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.12em] text-muted hover:text-navy"
                  onClick={() => void remove(r.id, r.name)}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
        {regions.length === 0 && (
          <li className="text-sm text-muted">No regions yet — add East and West below.</li>
        )}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          className={fieldClass}
          placeholder="New region (e.g. East)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="button" disabled={busy} onClick={() => void add()}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </div>
    </div>
  );
}

function AddStoreForm({
  regions,
  onChange,
}: {
  regions: Region[];
  onChange: (snap: DirectorySnapshot) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [regionId, setRegionId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      onChange(await saveStore({ data: { name, city, phone, regionId: regionId || null } }));
      setName("");
      setCity("");
      setPhone("");
      setRegionId("");
      setOpen(false);
      toast.success("Store added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save store");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="mt-4" onClick={() => setOpen(true)}>
        Add a store
      </Button>
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
      <input
        className={fieldClass}
        placeholder="Store name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <select
        className={fieldClass}
        value={regionId}
        onChange={(e) => setRegionId(e.target.value)}
      >
        <option value="">No region</option>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="button" disabled={busy} onClick={() => void submit()}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const fieldClass =
  "h-11 min-w-0 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";

/** Word patterns for each weekday, indexed by Date#getDay (0 = Sunday). */
const DAY_PATTERNS = [
  /\bsun(day)?s?\b/i,
  /\bmon(day)?s?\b/i,
  /\btue(s|sday)?s?\b/i,
  /\bwed(s|nesday)?s?\b/i,
  /\bthu(r|rs|rsday)?s?\b/i,
  /\bfri(day)?s?\b/i,
  /\bsat(urday)?s?\b/i,
];

/** True when the free-text days-off note mentions today's weekday. */
function isOffToday(daysOff: string, now: Date = new Date()): boolean {
  if (!daysOff.trim()) return false;
  return DAY_PATTERNS[now.getDay()].test(daysOff);
}

function StoreBlock({
  store,
  snap,
  onChange,
}: {
  store: StoreCard;
  snap: DirectorySnapshot;
  onChange: (snap: DirectorySnapshot) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [city, setCity] = useState(store.city);
  const [phone, setPhone] = useState(store.phone);
  const [regionId, setRegionId] = useState(store.regionId ?? "");

  useEffect(() => {
    setName(store.name);
    setCity(store.city);
    setPhone(store.phone);
    setRegionId(store.regionId ?? "");
  }, [store.name, store.city, store.phone, store.regionId]);

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          {editing ? (
            <div className="grid gap-2 sm:grid-cols-4">
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
              <input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <select className={fieldClass} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                <option value="">No region</option>
                {snap.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <h3 className="font-display text-3xl leading-none">{store.name}</h3>
              <p className="mt-2 text-sm text-muted">
                {[store.city, store.phone].filter(Boolean).join(" · ") || "Store team"}
              </p>
            </>
          )}
        </div>
        {snap.canEdit && (
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void saveStore({ data: { id: store.id, name, city, phone, regionId: regionId || null } })
                      .then((next) => {
                        onChange(next);
                        setEditing(false);
                        toast.success("Store updated");
                      })
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"));
                  }}
                >
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!confirm(`Remove ${store.name} from the directory?`)) return;
                    void deleteStore({ data: store.id })
                      .then(onChange)
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not remove"));
                  }}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        )}
      </header>
      <div className="grid gap-0 md:grid-cols-2">
        <Roster
          label="Managers"
          people={store.managers}
          empty="No manager listed yet."
          snap={snap}
          onChange={onChange}
        />
        <Roster
          label="Arch Support Specialists"
          people={store.sales}
          empty="No specialists listed yet."
          snap={snap}
          onChange={onChange}
          lined
        />
      </div>
    </article>
  );
}

function Roster({
  label,
  people,
  empty,
  snap,
  onChange,
  lined,
}: {
  label: string;
  people: DirectoryEntry[];
  empty: string;
  snap: DirectorySnapshot;
  onChange: (snap: DirectorySnapshot) => void;
  lined?: boolean;
}) {
  return (
    <div className={cn("px-5 py-4", lined && "border-t border-line md:border-l md:border-t-0")}>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brass">{label}</p>
      {people.length ? (
        <ul className="mt-3 space-y-3">
          {people.map((person) => (
            <li key={person.id}>
              <PersonCard person={person} snap={snap} onChange={onChange} compact />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

function PersonCard({
  person,
  snap,
  onChange,
  compact,
}: {
  person: DirectoryEntry;
  snap: DirectorySnapshot;
  onChange: (snap: DirectorySnapshot) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState(person.storeId ?? "");
  const [title, setTitle] = useState(person.title);
  const [phone, setPhone] = useState(person.phone);
  const [daysOff, setDaysOff] = useState(person.daysOff);
  const [role, setRole] = useState<AccessRole>(
    person.role === "managers" || person.role === "mit" ? person.role : "specialist",
  );
  const [region, setRegion] = useState(person.regionId ?? "");
  const displayTitle = person.title || person.roleLabel;

  useEffect(() => {
    setStoreId(person.storeId ?? "");
    setTitle(person.title);
    setPhone(person.phone);
    setDaysOff(person.daysOff);
    setRole(person.role === "managers" || person.role === "mit" ? person.role : "specialist");
    setRegion(person.regionId ?? "");
  }, [person.id, person.storeId, person.title, person.phone, person.daysOff, person.role, person.regionId]);

  return (
    <div className={cn("min-w-0", compact ? "" : "rounded-md border border-line bg-paper p-4")}>
      <div className="flex items-start gap-3">
        <Initials
          name={person.name}
          src={person.imageUrl}
          className={compact ? "size-8 text-[0.65rem]" : "size-10"}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{person.name}</p>
          <p className="truncate text-sm text-muted">{displayTitle}</p>
          {person.email && (
            <p className="mt-1 truncate text-sm">
              <a
                className="text-navy underline-offset-2 hover:underline"
                href={`mailto:${person.email}`}
              >
                {person.email}
              </a>
            </p>
          )}
          {person.phone && <p className="truncate text-sm text-muted">{person.phone}</p>}
          {person.daysOff && (
            <p className="truncate text-xs text-muted">
              Off {person.daysOff}
              {isOffToday(person.daysOff) && (
                <span className="font-medium text-brass"> · off today</span>
              )}
            </p>
          )}
        </div>
      </div>
      {snap.canEdit && (
        <>
          <button
            type="button"
            className="mt-2 text-xs uppercase tracking-[0.12em] text-muted hover:text-navy"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Place"}
          </button>
          {open && (
            <div className="mt-3 grid gap-2">
              <select
                className={fieldClass}
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <option value="">No store — office or unassigned</option>
                {snap.stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldClass}
                value={role}
                onChange={(e) => setRole(e.target.value as AccessRole)}
              >
                <option value="managers">Manager</option>
                <option value="specialist">Arch Support Specialist</option>
                <option value="mit">MIT</option>
              </select>
              <select
                className={fieldClass}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">No region (scopes DMs & Professors)</option>
                {snap.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                className={fieldClass}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className={fieldClass}
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className={fieldClass}
                placeholder="Days off (e.g. Sun & Wed)"
                maxLength={60}
                value={daysOff}
                onChange={(e) => setDaysOff(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void placeDirectoryPerson({
                    data: {
                      userId: person.id,
                      storeId: storeId || null,
                      title,
                      phone,
                      daysOff,
                      regionId: region || null,
                      role:
                        person.role === "pending" ||
                        person.role === "managers" ||
                        person.role === "specialist" ||
                        person.role === "mit"
                          ? role
                          : person.role,
                    },
                  })
                    .then((next) => {
                      onChange(next);
                      setOpen(false);
                      toast.success(`Updated ${person.name}`);
                    })
                    .catch((err) => toast.error(err instanceof Error ? err.message : "Could not place"));
                }}
              >
                Save
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
