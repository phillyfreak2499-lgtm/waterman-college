import { isRoleId, type RoleId } from "@/lib/content";

export const AUDIENCE_PATHS: { id: RoleId; label: string }[] = [
  { id: "new-hires", label: "New Hires" },
  { id: "specialist", label: "Specialists" },
  { id: "mit", label: "MIT" },
  { id: "managers", label: "Managers" },
];

export function toggleAudienceRole(current: RoleId[], role: RoleId) {
  return current.includes(role) ? current.filter((item) => item !== role) : [...current, role];
}

export function AudienceFields({
  visibleToAll,
  audienceRoles,
  onChange,
  dark = false,
}: {
  visibleToAll: boolean;
  audienceRoles: RoleId[];
  onChange: (next: { visibleToAll: boolean; audienceRoles: RoleId[]; role: RoleId }) => void;
  dark?: boolean;
}) {
  const box = dark
    ? "rounded-sm border border-paper/20 bg-navy px-3 py-2 text-sm text-paper"
    : "rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink";

  function emit(all: boolean, roles: RoleId[]) {
    onChange({
      visibleToAll: all,
      audienceRoles: roles,
      role: roles[0] && isRoleId(roles[0]) ? roles[0] : "specialist",
    });
  }

  return (
    <div className="space-y-2">
      <label className={`flex items-center gap-2 ${box}`}>
        <input
          type="checkbox"
          checked={visibleToAll}
          onChange={(e) => emit(e.target.checked, audienceRoles)}
        />
        Everyone
      </label>
      {AUDIENCE_PATHS.map((path) => (
        <label key={path.id} className={`flex items-center gap-2 ${box}`}>
          <input
            type="checkbox"
            disabled={visibleToAll}
            checked={visibleToAll || audienceRoles.includes(path.id)}
            onChange={() => emit(false, toggleAudienceRole(audienceRoles, path.id))}
          />
          {path.label}
        </label>
      ))}
      <p className={dark ? "text-xs text-paper/50" : "text-xs text-muted"}>
        Check more than one group when the course belongs on more than one path.
      </p>
    </div>
  );
}
