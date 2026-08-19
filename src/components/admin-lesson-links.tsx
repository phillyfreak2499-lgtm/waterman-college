import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { ExternalLink, Link2, Link2Off, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCatalog } from "@/components/catalog-provider";
import { Button } from "@/components/ui/button";
import {
  deleteLessonLink,
  firstUrlFromText,
  lessonLineKey,
  listAllLessonLinks,
  normalizeResourceUrl,
  saveLessonLink,
  tagOfLine,
  type LessonLink,
} from "@/lib/lesson-links";
import { cn, errorMessage } from "@/lib/utils";

/**
 * Office editor for lesson resource links.
 *
 * Lesson bodies carry tagged lines (GFA, ROLEPLAY, SOLUTION, VIDEO, …) that
 * named a resource but linked nowhere. This screen lists every tagged line in
 * the catalog and lets the office attach a destination to it.
 *
 * Three ways to set a link, deliberately:
 *   1. Drag a link from another browser tab (or the address bar) onto the row.
 *   2. Focus the row and paste a URL.
 *   3. Type into the text field.
 *
 * (1) is the fast path, but it is an ENHANCEMENT only. Dragging is unavailable
 * to keyboard users and awkward on touch, so the text field is always present
 * and fully sufficient — WCAG 2.2 SC 2.5.7 (Dragging Movements).
 */

type Row = {
  trackId: string;
  trackTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  lineKey: string;
  tag: string;
  text: string;
};

export function LessonLinksEditor() {
  const { catalog } = useCatalog();
  const [links, setLinks] = useState<Record<string, LessonLink>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listAllLessonLinks()
      .then((rows) => {
        if (cancelled) return;
        setLinks(Object.fromEntries(rows.map((row) => [rowId(row.trackId, row.lessonSlug, row.lineKey), row])));
        setError(null);
      })
      .catch((reason) => {
        if (!cancelled) setError(errorMessage(reason, "Could not load lesson links."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Every tagged line across the catalog, flattened.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const track of catalog.tracks) {
      for (const lesson of track.lessons) {
        for (const line of lesson.body) {
          const tag = tagOfLine(line);
          const lineKey = lessonLineKey(line);
          if (!tag || !lineKey) continue;
          out.push({
            trackId: track.id,
            trackTitle: track.title,
            lessonSlug: lesson.slug,
            lessonTitle: lesson.title,
            lineKey,
            tag,
            text: line,
          });
        }
      }
    }
    return out;
  }, [catalog]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyUnlinked && links[rowId(row.trackId, row.lessonSlug, row.lineKey)]) return false;
      if (!needle) return true;
      return `${row.tag} ${row.text} ${row.lessonTitle} ${row.trackTitle}`.toLowerCase().includes(needle);
    });
  }, [rows, links, query, onlyUnlinked]);

  const linkedCount = rows.filter((row) => links[rowId(row.trackId, row.lessonSlug, row.lineKey)]).length;

  async function attach(row: Row, rawUrl: string) {
    let url: string;
    try {
      url = normalizeResourceUrl(rawUrl);
    } catch (reason) {
      toast.error(errorMessage(reason, "That link could not be used."));
      return;
    }
    const id = rowId(row.trackId, row.lessonSlug, row.lineKey);
    const previous = links[id];
    // Optimistic: the row shows the new link immediately, and rolls back on failure.
    setLinks((current) => ({
      ...current,
      [id]: { trackId: row.trackId, lessonSlug: row.lessonSlug, lineKey: row.lineKey, tag: row.tag, label: row.text.slice(0, 200), url },
    }));
    try {
      const saved = await saveLessonLink({
        data: {
          trackId: row.trackId,
          lessonSlug: row.lessonSlug,
          lineKey: row.lineKey,
          tag: row.tag,
          label: row.text.slice(0, 200),
          url,
        },
      });
      setLinks((current) => ({ ...current, [id]: saved }));
      toast.success(`Linked ${row.tag}`);
    } catch (reason) {
      setLinks((current) => {
        const next = { ...current };
        if (previous) next[id] = previous;
        else delete next[id];
        return next;
      });
      toast.error(errorMessage(reason, "Could not save that link."));
    }
  }

  async function detach(row: Row) {
    const id = rowId(row.trackId, row.lessonSlug, row.lineKey);
    const previous = links[id];
    setLinks((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    try {
      await deleteLessonLink({
        data: { trackId: row.trackId, lessonSlug: row.lessonSlug, lineKey: row.lineKey },
      });
      toast.success("Link removed");
    } catch (reason) {
      if (previous) setLinks((current) => ({ ...current, [id]: previous }));
      toast.error(errorMessage(reason, "Could not remove that link."));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading lesson links">
        <div className="h-10 w-64 animate-pulse rounded-sm bg-navy/10" />
        <div className="h-40 w-full animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Lesson links</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Lines tagged <span className="font-medium text-brass">GFA</span>,{" "}
          <span className="font-medium text-brass">ROLEPLAY</span>,{" "}
          <span className="font-medium text-brass">SOLUTION</span> and{" "}
          <span className="font-medium text-brass">VIDEO</span> become tappable links for staff once
          you attach a destination. <strong>Drag a link onto a row</strong> from another tab, paste
          one onto a focused row, or type it in. The lesson wording never changes.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-hall-burgundy/40 bg-hall-burgundy/5 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="lesson-link-search">
          Search lesson lines
        </label>
        <input
          id="lesson-link-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a tag, lesson, or phrase"
          className="h-11 w-full max-w-sm rounded-sm border border-line bg-surface px-3 text-ink shadow-sm shadow-navy/5 focus:outline-2 focus:outline-offset-1 focus:outline-navy"
        />
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={onlyUnlinked}
            onChange={(event) => setOnlyUnlinked(event.target.checked)}
            className="size-4"
          />
          Only lines without a link
        </label>
        <p className="ml-auto text-sm tabular-nums text-muted">
          {linkedCount} of {rows.length} linked
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-line bg-surface px-4 py-6 text-muted">
          {rows.length === 0
            ? "No tagged lines found in the current catalog."
            : "Nothing matches that filter."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <LinkRow
              key={rowId(row.trackId, row.lessonSlug, row.lineKey)}
              row={row}
              link={links[rowId(row.trackId, row.lessonSlug, row.lineKey)]}
              onAttach={attach}
              onDetach={detach}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function rowId(trackId: string, lessonSlug: string, lineKey: string) {
  return `${trackId}//${lessonSlug}//${lineKey}`;
}

function LinkRow({
  row,
  link,
  onAttach,
  onDetach,
}: {
  row: Row;
  link?: LessonLink;
  onAttach: (row: Row, url: string) => Promise<void>;
  onDetach: (row: Row) => Promise<void>;
}) {
  const [over, setOver] = useState(false);
  const [draft, setDraft] = useState(link?.url ?? "");
  const [busy, setBusy] = useState(false);
  // Nested dragenter/dragleave on child nodes would otherwise flicker the
  // highlight; count depth instead of toggling on every event.
  const depth = useRef(0);

  useEffect(() => {
    setDraft(link?.url ?? "");
  }, [link?.url]);

  const rest = row.text.startsWith(`${row.tag} · `)
    ? row.text.slice(row.tag.length + 3)
    : row.text.slice(row.tag.length + 1);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
    depth.current = 0;
    setOver(false);
    const dt = event.dataTransfer;
    const raw =
      dt.getData("text/uri-list") || dt.getData("text/plain") || dt.getData("text") || "";
    const url = firstUrlFromText(raw);
    if (!url) {
      toast.error("That drop did not contain a web link.");
      return;
    }
    void run(() => onAttach(row, url));
  }

  return (
    <li
      onDragEnter={(event) => {
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => {
        // Required for the drop event to fire at all.
        event.preventDefault();
        event.dataTransfer.dropEffect = "link";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={onDrop}
      onPaste={(event) => {
        const url = firstUrlFromText(event.clipboardData?.getData("text") ?? "");
        if (!url) return;
        event.preventDefault();
        void run(() => onAttach(row, url));
      }}
      className={cn(
        "rounded-md border bg-surface p-4 shadow-card transition-colors",
        over ? "border-navy bg-navy/5 ring-2 ring-navy/30" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-brass">
          {row.tag}
        </span>
        <p className="min-w-0 flex-1 text-ink">{rest}</p>
        {link ? (
          <span className="inline-flex items-center gap-1 text-xs text-brass">
            <Link2 className="size-3.5" aria-hidden="true" /> Linked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Link2Off className="size-3.5" aria-hidden="true" /> No link
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        {row.trackTitle} · {row.lessonTitle}
      </p>

      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void run(() => onAttach(row, draft));
        }}
      >
        <label className="sr-only" htmlFor={`url-${rowId(row.trackId, row.lessonSlug, row.lineKey)}`}>
          Destination for this {row.tag} line
        </label>
        <input
          id={`url-${rowId(row.trackId, row.lessonSlug, row.lineKey)}`}
          type="url"
          inputMode="url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Drop a link here, or paste / type https://…"
          className="h-10 min-w-0 flex-1 rounded-sm border border-line bg-paper px-3 text-sm text-ink focus:outline-2 focus:outline-offset-1 focus:outline-navy"
        />
        <Button type="submit" size="sm" disabled={busy || !draft.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Save"}
        </Button>
        {link && (
          <>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brass underline underline-offset-4 hover:text-navy"
            >
              Open <ExternalLink className="size-3" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void run(() => onDetach(row))}
            >
              Remove
            </Button>
          </>
        )}
      </form>
    </li>
  );
}
