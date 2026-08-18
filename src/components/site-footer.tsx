import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/media/seal.png" alt="" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-display text-2xl leading-none">{SITE.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-brass-soft">
                {SITE.tagline}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
            Private training for employees of {SITE.company}. {SITE.stores} stores.
            People first.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass-soft">
            Campus
          </p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li>
              <Link to="/training" className="hover:text-paper">
                Specialist Training
              </Link>
            </li>
            <li>
              <Link to="/training/$track" params={{ track: "management" }} className="hover:text-paper">
                Management Development
              </Link>
            </li>
            <li>
              <Link to="/training/$track" params={{ track: "mit" }} className="hover:text-paper">
                MIT Program
              </Link>
            </li>
            <li>
              <Link to="/remarkable" className="hover:text-paper">
                Be Remarkable
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass-soft">
            Access
          </p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li>
              <Link to="/how-it-works" className="hover:text-paper">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-paper">
                Sign in
              </Link>
            </li>
            <li>
              <a href={`mailto:${SITE.adminEmail}`} className="hover:text-paper">
                Training office
              </a>
            </li>
          </ul>
          <img
            src="/media/good-feet.png"
            alt="The Good Feet Store"
            className="mt-8 h-8 w-auto opacity-80"
          />
        </div>
      </div>
      <div className="border-t border-paper/10 px-5 py-4 text-center text-xs text-paper/45">
        {SITE.name} · {SITE.company} · For employees only
      </div>
    </footer>
  );
}
