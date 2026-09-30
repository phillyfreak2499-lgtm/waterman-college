import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { useAccess } from "@/components/access-provider";
import { useCatalog } from "@/components/catalog-provider";
import { LockedPath } from "@/components/locked-path";
import { PageIntro } from "@/components/page-intro";
import { RemarkableMediaFields, RemarkableVideo, TagPills } from "@/components/remarkable-media";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { listRemarkableMedia, saveRemarkableMedia, type RemarkableMedia } from "@/lib/remarkable-media";
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
  const [media, setMedia] = useState<Record<string, RemarkableMedia>>({});
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    void listRemarkableMedia()
      .then(setMedia)
      .catch(() => setMedia({}));
  }, []);

  const allTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const item of Object.values(media)) {
      for (const name of item.tags) {
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tags.push(name);
      }
    }
    return tags.sort((a, b) => a.localeCompare(b));
  }, [media]);

  const needle = query.trim().toLowerCase();
  const posts = catalog.news.filter((item) => {
    const extra = media[item.id];
    const tags = extra?.tags ?? [];
    if (tag && !tags.some((name) => name.toLowerCase() === tag.toLowerCase())) return false;
    if (!needle) return true;
    const hay = [item.title, item.body, item.date, ...tags, extra?.videoUrl ?? ""].join(" ").toLowerCase();
    return hay.includes(needle);
  });
  const [featured, ...rest] = posts;
  const canEdit = access.canOpenStudio || access.isAdmin || access.isChancellor;

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

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <PageIntro
        kicker="Weekly"
        title="Be Remarkable"
        lede="Why we huddle: so the next Client meets someone who already decided to be remarkable. Read it once. Use it on the floor."
      />

      <div className="mt-10 space-y-4">
        <label className="block">
          <span className="sr-only">Search posts</span>
          <input
            className="field-input"
            value={query}
            placeholder="Search posts, tags, or videos"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {allTags.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Browse by tag</p>
            <TagPills
              tags={allTags}
              active={tag}
              onToggle={(name) => setTag((current) => (current?.toLowerCase() === name.toLowerCase() ? null : name))}
            />
          </div>
        )}
      </div>

      {featured ? (
        <article className="mt-12 border-t border-line pt-10">
          <p className="kicker">Latest</p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">{featured.date}</p>
          <h2 className="mt-2 font-display text-4xl leading-tight">{featured.title}</h2>
          <TagPills tags={media[featured.id]?.tags ?? []} />
          <p className="mt-4 text-lg leading-relaxed text-ink/90">{featured.body}</p>
          {featured.image && (
            <img src={featured.image} alt="" className="mt-6 w-full rounded-md object-cover shadow-card" />
          )}
          <RemarkableVideo url={media[featured.id]?.videoUrl} />
          <PostMediaEditor
            newsId={featured.id}
            media={media[featured.id]}
            canEdit={canEdit}
            onSaved={(next) => setMedia((current) => ({ ...current, [next.newsId]: next }))}
          />
        </article>
      ) : (
        <p className="mt-12 text-muted">No posts match that search.</p>
      )}
      {rest.length > 0 && (
        <ol className="mt-6 space-y-8">
          {rest.map((item) => (
            <li key={item.id} className="border-t border-line pt-8">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.date}</p>
              <h2 className="mt-2 font-display text-3xl leading-tight">{item.title}</h2>
              <TagPills tags={media[item.id]?.tags ?? []} />
              <p className="mt-3 leading-relaxed text-ink/90">{item.body}</p>
              {item.image && (
                <img src={item.image} alt="" className="mt-5 w-full rounded-md object-cover shadow-card" />
              )}
              <RemarkableVideo url={media[item.id]?.videoUrl} />
              <PostMediaEditor
                newsId={item.id}
                media={media[item.id]}
                canEdit={canEdit}
                onSaved={(next) => setMedia((current) => ({ ...current, [next.newsId]: next }))}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PostMediaEditor({
  newsId,
  media,
  canEdit,
  onSaved,
}: {
  newsId: string;
  media?: RemarkableMedia;
  canEdit: boolean;
  onSaved: (next: RemarkableMedia) => void;
}) {
  const [open, setOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(media?.videoUrl ?? "");
  const [tags, setTags] = useState<string[]>(media?.tags ?? []);
  const [busy, setBusy] = useState(false);
  if (!canEdit) return null;
  return (
    <div className="mt-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : "Add video or tags"}
      </Button>
      {open && (
        <form
          className="mt-3 space-y-3 rounded-md border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void saveRemarkableMedia({ data: { newsId, videoUrl, tags } })
              .then((saved) => {
                onSaved(saved);
                setOpen(false);
                toast.success("Video and tags saved.");
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))
              .finally(() => setBusy(false));
          }}
        >
          <RemarkableMediaFields
            videoUrl={videoUrl}
            tags={tags}
            inputClass="field-input"
            onChange={(next) => {
              setVideoUrl(next.videoUrl);
              setTags(next.tags);
            }}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save video and tags"}
          </Button>
        </form>
      )}
    </div>
  );
}
