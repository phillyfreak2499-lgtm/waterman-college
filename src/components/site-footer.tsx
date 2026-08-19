import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/components/catalog-provider";
import { InstallBanner } from "@/components/install-app";

export function SiteFooter() {
  const { catalog } = useCatalog();
  const site = catalog.site;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <img
              src="/media/waterman-logo-light.png"
              alt="Waterman Arch Supports"
              className="h-5 w-auto object-contain object-left"
            />
            <img src="/media/seal.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
          </div>
          <p className="mt-5 font-display text-2xl leading-none">{site.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-brass-soft">
            Of Getting Smarter
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
            We start with why a Client walked in. Then we train the person who
            will meet them. Private campus for employees of {site.company}.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass-soft">
            The Golden Circle
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/80">
            <li>
              <Link to="/why" className="transition-colors hover:text-paper">
                Why we exist
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="transition-colors hover:text-paper">
                How we train
              </Link>
            </li>
            <li>
              <Link to="/training" search={{}} className="transition-colors hover:text-paper">
                What we do — the hall
              </Link>
            </li>
            <li>
              <Link to="/remarkable" className="transition-colors hover:text-paper">
                Be Remarkable
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass-soft">
            Admission
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/80">
            <li>
              <Link to="/register" className="transition-colors hover:text-paper">
                Create an account
              </Link>
            </li>
            <li>
              <Link to="/login" className="transition-colors hover:text-paper">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/directory" className="transition-colors hover:text-paper">
                Directory
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="transition-colors hover:text-paper">
                Notifications
              </Link>
            </li>
            <li>
              <Link to="/install" className="transition-colors hover:text-paper">
                Get the app
              </Link>
            </li>
            <li>
              <Link to="/quad" className="transition-colors hover:text-paper">
                The Quad
              </Link>
            </li>
          </ul>
          <p className="mt-8 font-display text-lg tracking-wide text-paper/80">
            The Good Feet Store
          </p>
        </div>
      </div>
      <InstallBanner />
      <div className="border-t border-paper/10 px-5 py-4 text-center text-xs tracking-wide text-paper/45">
        © {year} {site.name} · {site.company} · Employees only
      </div>
    </footer>
  );
}
