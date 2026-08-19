import { Link } from "@tanstack/react-router";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { useProgress } from "@/components/progress-provider";
import { type RoleId } from "@/lib/content";
import { roleStats } from "@/lib/progress-stats";
import { cn } from "@/lib/utils";

export function TrainingTabs({ active }: { active: RoleId }) {
  const { rows, ready } = useProgress();
  const { catalog } = useCatalog();
  const { access } = useAccess();
  const visible = catalog.roles.filter((role) => access.allowedTabs.includes(role.id));

  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
      <nav
        aria-label="Training roles"
        className="flex min-w-max gap-1 border-b border-line sm:min-w-0 sm:flex-wrap"
      >
        {visible.map((role) => {
          const isActive = role.id === active;
          const stats = roleStats(rows, role.id, catalog.tracks);
          return (
            <Link
              key={role.id}
              to="/training"
              search={{ role: role.id }}
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-2 px-4 text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors",
                isActive ? "text-navy" : "text-muted hover:text-navy",
              )}
            >
              {role.label}
              <span
                className={cn(
                  "tabular-nums text-[0.65rem] tracking-normal",
                  isActive ? "text-brass" : "text-muted/80",
                )}
              >
                {ready ? `${stats.done}/${stats.total}` : "—"}
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-colors",
                  isActive ? "bg-navy" : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
