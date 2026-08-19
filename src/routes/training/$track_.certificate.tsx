import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { SiteShell } from "@/components/site-shell";
import { useProgress } from "@/components/progress-provider";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { trackStats } from "@/lib/progress-stats";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/training/$track_/certificate")({
  component: CertificatePage,
});

function CertificatePage() {
  return (
    <SiteShell>
      <AuthGate>
        <CertificateGate />
      </AuthGate>
    </SiteShell>
  );
}

function CertificateGate() {
  const { track: trackId } = Route.useParams();
  const { catalog, ready } = useCatalog();
  const { access, ready: accessReady } = useAccess();
  const { rows, ready: progressReady } = useProgress();
  const { user } = useCurrentUserState();
  const track = catalog.tracks.find((t) => t.id === trackId);

  if (!ready || !accessReady || !progressReady) {
    return <div className="mx-auto max-w-3xl px-5 py-24"><div className="h-40 animate-pulse rounded-md bg-navy/5" /></div>;
  }
  if (!track) throw notFound();
  if (!access.allowedTabs.includes(track.role) && !access.assignedTrackIds.includes(track.id)) {
    return <LockedPath role={access.role} title="This course is not on your path." />;
  }
  const stats = trackStats(rows, track);
  if (stats.total === 0 || stats.done < stats.total) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brass">Seal</p>
        <h1 className="mt-3 font-display text-4xl">Finish the course first.</h1>
        <p className="mt-4 text-muted">The certificate is issued when every lesson in this track is complete.</p>
        <Button asChild className="mt-8">
          <Link to="/training/$track" params={{ track: track.id }}>
            Back to the course
          </Link>
        </Button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/training/$track" params={{ track: track.id }} className="text-sm text-brass hover:text-navy">
          Back to {track.title}
        </Link>
        <Button type="button" onClick={() => window.print()}>
          Print the seal
        </Button>
      </div>

      <article className="relative mt-8 overflow-hidden border-[10px] border-navy bg-paper px-6 py-12 text-center sm:px-12 sm:py-16">
        <img
          src="/media/seal.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
        />
        <div className="relative border border-brass/50 px-5 py-10 sm:px-10 sm:py-14">
          <img src="/media/waterman-logo.png" alt="" className="mx-auto h-6 w-auto object-contain" />
          <img src="/media/seal.png" alt="" className="mx-auto mt-5 h-14 w-14 object-contain" />
          <p className="mt-5 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-brass">
            COGS · College of Getting Smarter
          </p>
          <h1 className="mt-4 font-display text-4xl leading-none sm:text-5xl">Certificate of Completion</h1>
          <p className="mt-8 text-sm uppercase tracking-[0.16em] text-muted">This certifies that</p>
          <p className="mt-3 font-display text-4xl italic leading-none">{user?.displayName || "A Specialist"}</p>
          <p className="mt-8 text-sm leading-relaxed text-muted">
            has completed the course
          </p>
          <p className="mt-3 font-display text-3xl leading-tight">{track.title}</p>
          <p className="mt-8 text-sm text-muted">{today}</p>
          <p className="mt-10 text-[0.65rem] uppercase tracking-[0.2em] text-brass">
            Pain free learning for pain free living
          </p>
        </div>
      </article>
    </div>
  );
}