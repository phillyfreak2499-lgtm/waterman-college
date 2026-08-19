import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ACCESS_ROLES,
  accessLabel,
  type AccessRole,
  type DirectoryPerson,
} from "@/lib/access";
import {
  approveAccount,
  createAccount,
  deleteAccount,
  denyAccount,
  listAccounts,
  listPasswordResetRequests,
  resolvePasswordReset,
  updateAccountRole,
  type PasswordResetRequest,
} from "@/lib/accounts";

const inputClass =
  "h-11 w-full rounded-sm border border-line bg-paper px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy";

const POSITIONS = ACCESS_ROLES.filter((item) => item.id !== "pending");

export function AccountsEditor() {
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [resets, setResets] = useState<PasswordResetRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    Promise.all([listAccounts(), listPasswordResetRequests()])
      .then(([nextPeople, nextResets]) => {
        if (!cancelled) {
          setPeople(nextPeople);
          setResets(nextResets);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load accounts");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const queue = people.filter((p) => p.accountStatus === "pending");
  const denied = people.filter((p) => p.accountStatus === "denied");
  const active = people.filter((p) => p.accountStatus === "approved");

  async function run(id: string, work: () => Promise<DirectoryPerson[]>, ok: string) {
    setBusy(id);
    try {
      setPeople(await work());
      toast.success(ok);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the account");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function resetPassword(requestId: string, temporaryPassword: string) {
    setBusy(requestId);
    try {
      setResets(await resolvePasswordReset({ data: { requestId, temporaryPassword } }));
      toast.success("Temporary password issued");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the password");
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-3xl">Accounts did not load</h2>
        <p role="alert" className="mt-3 text-sm text-muted">{loadError}</p>
        <Button type="button" className="mt-5" onClick={() => setLoadKey((key) => key + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <AddAccountForm
        busy={busy === "create"}
        onCreate={(input) =>
          run("create", () => createAccount({ data: input }), `${input.firstName} is on the roster.`)
        }
      />

      <section>
        <h2 className="font-display text-3xl">Password reset requests</h2>
        <p className="mt-1 text-sm text-muted">
          Issue a temporary password. The person must replace it after signing in.
        </p>
        {resets.length ? (
          <ul className="mt-5 divide-y divide-line border-t border-line">
            {resets.map((request) => (
              <PasswordResetRow
                key={request.id}
                request={request}
                busy={busy === request.id}
                onReset={resetPassword}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted">No open reset requests.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-3xl">Approval queue</h2>
        <p className="mt-1 text-sm text-muted">
          {queue.length
            ? `${queue.length} waiting. Approve with a position, or deny.`
            : "No one is waiting."}
        </p>
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {queue.map((person) => (
            <QueueRow
              key={person.id}
              person={person}
              busy={busy === person.id}
              onApprove={(role) =>
                run(person.id, () => approveAccount({ data: { userId: person.id, role } }), `${person.name} is approved.`)
              }
              onDeny={() =>
                run(person.id, () => denyAccount({ data: person.id }), `${person.name} was denied.`)
              }
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-3xl">Accounts</h2>
        <p className="mt-1 text-sm text-muted">
          Change a position or remove someone from the college.
        </p>
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {active.map((person) => (
            <ActiveRow
              key={person.id}
              person={person}
              busy={busy === person.id}
              onRole={(role) =>
                run(
                  person.id,
                  () => updateAccountRole({ data: { userId: person.id, role } }),
                  `${person.name} is now ${accessLabel(role)}.`,
                )
              }
              onDelete={() => {
                if (!confirm(`Delete ${person.name}? This cannot be undone.`)) return;
                void run(person.id, () => deleteAccount({ data: person.id }), `${person.name} was removed.`);
              }}
            />
          ))}
        </ul>
        {!active.length && <p className="mt-6 text-sm text-muted">No approved accounts yet.</p>}
      </section>

      {denied.length > 0 && (
        <section>
          <h2 className="font-display text-3xl">Denied</h2>
          <ul className="mt-5 divide-y divide-line border-t border-line">
            {denied.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted">@{person.username || "—"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busy === person.id}
                    onClick={() =>
                      void run(
                        person.id,
                        () => approveAccount({ data: { userId: person.id, role: "specialist" } }),
                        `${person.name} was restored.`,
                      )
                    }
                  >
                    Restore as Specialist
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy === person.id}
                    onClick={() => {
                      if (!confirm(`Delete ${person.name}?`)) return;
                      void run(person.id, () => deleteAccount({ data: person.id }), "Removed.");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PasswordResetRow({
  request,
  busy,
  onReset,
}: {
  request: PasswordResetRequest;
  busy: boolean;
  onReset: (requestId: string, temporaryPassword: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onReset(request.id, password)) setPassword("");
  }

  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[1.2fr_16rem_auto] lg:items-end">
      <div>
        <p className="font-medium">{request.name}</p>
        <p className="text-sm text-muted">@{request.username || "—"}</p>
      </div>
      <form className="contents" onSubmit={(event) => void submit(event)}>
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Temporary password
          </span>
          <input
            required
            type="password"
            minLength={12}
            autoComplete="new-password"
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy || password.length < 12}>
          {busy ? "Resetting…" : "Issue password"}
        </Button>
      </form>
    </li>
  );
}

function QueueRow({
  person,
  busy,
  onApprove,
  onDeny,
}: {
  person: DirectoryPerson;
  busy: boolean;
  onApprove: (role: AccessRole) => void;
  onDeny: () => void;
}) {
  const [role, setRole] = useState<AccessRole>("specialist");
  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[1.2fr_12rem_auto] lg:items-center">
      <div>
        <p className="font-medium">{person.name}</p>
        <p className="text-sm text-muted">
          @{person.username || "—"} · asked {person.createdAt.slice(0, 10) || "recently"}
        </p>
      </div>
      <select
        className={inputClass}
        value={role}
        onChange={(e) => setRole(e.target.value as AccessRole)}
      >
        {POSITIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => onApprove(role)}>
          Approve
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onDeny}>
          Deny
        </Button>
      </div>
    </li>
  );
}

function ActiveRow({
  person,
  busy,
  onRole,
  onDelete,
}: {
  person: DirectoryPerson;
  busy: boolean;
  onRole: (role: AccessRole) => void;
  onDelete: () => void;
}) {
  const [role, setRole] = useState<AccessRole>(person.role);
  useEffect(() => setRole(person.role), [person.role]);
  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[1.2fr_12rem_auto] lg:items-center">
      <div>
        <p className="font-medium">{person.name}</p>
        <p className="text-sm text-muted">@{person.username || "—"}</p>
      </div>
      <select
        className={inputClass}
        value={role}
        onChange={(e) => setRole(e.target.value as AccessRole)}
      >
        {ACCESS_ROLES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={busy || role === person.role}
          onClick={() => onRole(role)}
        >
          Save position
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function AddAccountForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (input: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: AccessRole;
  }) => Promise<boolean>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccessRole>("specialist");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const created = await onCreate({ firstName, lastName, username, password, role });
    if (created) {
      setFirstName("");
      setLastName("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-lg border border-line bg-surface p-5">
      <h2 className="font-display text-3xl">Add a person</h2>
      <p className="mt-1 text-sm text-muted">
        Skip the queue. They can sign in immediately with this username and password.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            First name
          </span>
          <input required className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Last name
          </span>
          <input required className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Username
          </span>
          <input required className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Password
          </span>
          <input
            required
            type="password"
            minLength={12}
            autoComplete="new-password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Position
          </span>
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as AccessRole)}>
            {POSITIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button type="submit" className="mt-5" disabled={busy}>
        {busy ? "Adding…" : "Add to the college"}
      </Button>
    </form>
  );
}
