import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/remarkable")({
  component: Remarkable,
  head: () => pageHead("Be Remarkable", "The weekly huddle note. Small enough to use today."),
});

function Remarkable() {
  return (
    <SiteShell>
      <AuthGate>
        <RemarkableList />
      </AuthGate>
    </SiteShell>
  );
}

function RemarkableList() {
  const { catalog } = useCatalog();
  const { access, ready } = useAccess();

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }
  if (access.role === "pending") {
    return <LockedPath role={access.role} />;
  }

  const [featured, ...rest] = catalog.news;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <PageIntro
        kicker="Weekly"
        title="Be Remarkable"
        lede="Why we huddle: so the next Client meets someone who already decided to be remarkable. Read it once. Use it on the floor."
      />
      {featured && (
        <article className="mt-12 border-t border-line pt-10">
          <p className="kicker">Latest</p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">{featured.date}</p>
          <h2 className="mt-2 font-display text-4xl leading-tight">{featured.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/90">{featured.body}</p>
          {featured.image && (
            <img
              src={featured.image}
              alt=""
              className="mt-6 w-full rounded-md object-cover shadow-card"
            />
          )}
        </article>
      )}
      {rest.length > 0 && (
        <ol className="mt-6 space-y-8">
          {rest.map((t) => (
            <li key={t.id} className="border-t border-line pt-8">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{t.date}</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">{t.title}</h2>
              <p className="mt-3 leading-relaxed text-ink/90">{t.body}</p>
              {t.image && (
                <img src={t.image} alt="" className="mt-5 w-full rounded-md object-cover shadow-card" />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
