import { useId } from "react";
import { isRoleId, type RoleId } from "@/lib/content";
import {
  audiencePaths,
  COURSE_FORMATS,
  DEFAULT_FORMAT,
  formatLabel,
  type CourseCategory,
  type CourseFormat,
} from "@/lib/course-audience";
import { cn } from "@/lib/utils";

export const AUDIENCE_PATHS: { id: RoleId; label: string }[] = [
  { id: "new-hires", label: "New Hires" },
  { id: "specialist", label: "Specialists" },
  { id: "mit", label: "MIT" },
  { id: "managers", label: "Managers" },
];

export const AUDIENCE_LABELS: Record<RoleId, string> = Object.fromEntries(
  AUDIENCE_PATHS.map((path) => [path.id, path.label]),
) as Record<RoleId, string>;

export function toggleAudienceRole(current: RoleId[], role: RoleId) {
  return current.includes(role) ? current.filter((item) => item !== role) : [...current, role];
}

/** Everything the course editors set about who sees a course and what it is. */
export type CourseSettings = {
  role: RoleId;
  visibleToAll: boolean;
  audienceRoles: RoleId[];
  format: CourseFormat;
  categoryIds: string[];
};

export const NEW_COURSE_SETTINGS: CourseSettings = {
  role: "specialist",
  visibleToAll: false,
  audienceRoles: ["specialist"],
  format: DEFAULT_FORMAT,
  categoryIds: [],
};

/** Editor state for an existing course, with its stored audience filled in. */
export function courseSettingsOf(track: {
  role: RoleId;
  visibleToAll?: boolean;
  audienceRoles?: RoleId[];
  format?: CourseFormat;
  categoryIds?: string[];
}): CourseSettings {
  return {
    role: track.role,
    visibleToAll: track.visibleToAll === true,
    audienceRoles: audiencePaths(track),
    format: track.format ?? DEFAULT_FORMAT,
    categoryIds: track.categoryIds ?? [],
  };
}

/** The problem to show before saving, or null when the settings are complete. */
export function courseSettingsProblem(settings: CourseSettings, isNew: boolean) {
  if (!settings.visibleToAll && !settings.audienceRoles.length) {
    return "Choose at least one path, or Everyone.";
  }
  if (isNew && !settings.categoryIds.length) return "Pick at least one category.";
  return null;
}

function nextHomePath(current: RoleId | undefined, roles: RoleId[]): RoleId {
  if (current && roles.includes(current)) return current;
  return roles[0] && isRoleId(roles[0]) ? roles[0] : current ?? "specialist";
}

export function AudienceFields({
  visibleToAll,
  audienceRoles,
  role,
  onChange,
  dark = false,
  compact = false,
}: {
  visibleToAll: boolean;
  audienceRoles: RoleId[];
  /** Current home path; kept when it is still in the audience. */
  role?: RoleId;
  onChange: (next: { visibleToAll: boolean; audienceRoles: RoleId[]; role: RoleId }) => void;
  dark?: boolean;
  /** One wrapping row of small boxes, for a course list row. */
  compact?: boolean;
}) {
  const box = compact
    ? dark
      ? "rounded-sm border border-paper/20 bg-navy px-2 py-1 text-xs text-paper"
      : "rounded-sm border border-line bg-paper px-2 py-1 text-xs text-ink"
    : dark
      ? "rounded-sm border border-paper/20 bg-navy px-3 py-2 text-sm text-paper"
      : "rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink";

  function emit(all: boolean, roles: RoleId[]) {
    onChange({ visibleToAll: all, audienceRoles: roles, role: nextHomePath(role, roles) });
  }

  return (
    <div className={compact ? "flex flex-wrap gap-1.5" : "space-y-2"}>
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
      {!compact && (
        <p className={dark ? "text-xs text-paper/50" : "text-xs text-muted"}>
          Check more than one group when the course belongs on more than one path.
        </p>
      )}
    </div>
  );
}

export function FormatField({
  value,
  onChange,
  dark = false,
}: {
  value: CourseFormat;
  onChange: (next: CourseFormat) => void;
  dark?: boolean;
}) {
  const name = useId();
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Format">
      {COURSE_FORMATS.map((format) => (
        <label
          key={format.id}
          className={cn(
            "flex items-start gap-2 rounded-sm border px-3 py-2 text-sm",
            dark ? "border-paper/20 bg-navy text-paper" : "border-line bg-paper text-ink",
            value === format.id && (dark ? "border-brass" : "border-navy"),
          )}
        >
          <input
            type="radio"
            className="mt-1"
            name={name}
            checked={value === format.id}
            onChange={() => onChange(format.id)}
          />
          <span>
            <span className="font-medium">{format.label}</span>
            <span className={cn("block text-xs", dark ? "text-paper/55" : "text-muted")}>{format.test}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function CategoryChips({
  categories,
  value,
  onChange,
  dark = false,
}: {
  categories: readonly CourseCategory[];
  value: string[];
  onChange: (next: string[]) => void;
  dark?: boolean;
}) {
  if (!categories.length) {
    return (
      <p className={dark ? "text-xs text-paper/50" : "text-xs text-muted"}>
        No categories yet. Add some in the Categories panel.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => {
        const on = value.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((id) => id !== category.id) : [...value, category.id])}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-medium",
              on
                ? dark
                  ? "border-brass bg-brass text-navy-deep"
                  : "border-navy bg-navy text-paper"
                : dark
                  ? "border-paper/25 text-paper/80 hover:border-paper/60"
                  : "border-line text-ink hover:border-navy/40",
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

/** Audience, format and category pickers together — used by every course editor. */
export function CourseSettingsFields({
  value,
  onChange,
  categories,
  dark = false,
}: {
  value: CourseSettings;
  onChange: (next: CourseSettings) => void;
  categories: readonly CourseCategory[];
  dark?: boolean;
}) {
  const heading = cn(
    "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em]",
    dark ? "text-paper/50" : "text-muted",
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <span className={heading}>Who sees it</span>
        <AudienceFields
          dark={dark}
          role={value.role}
          visibleToAll={value.visibleToAll}
          audienceRoles={value.audienceRoles}
          onChange={(next) => onChange({ ...value, ...next })}
        />
      </div>
      <div>
        <span className={heading}>Format</span>
        <FormatField dark={dark} value={value.format} onChange={(format) => onChange({ ...value, format })} />
      </div>
      <div className="sm:col-span-2">
        <span className={heading}>Categories</span>
        <CategoryChips
          dark={dark}
          categories={categories}
          value={value.categoryIds}
          onChange={(categoryIds) => onChange({ ...value, categoryIds })}
        />
      </div>
    </div>
  );
}

/** Small format badge for course cards and the course page header. */
export function FormatBadge({ format, className }: { format: CourseFormat | undefined; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-navy/85 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass-soft",
        className,
      )}
    >
      {formatLabel(format)}
    </span>
  );
}
