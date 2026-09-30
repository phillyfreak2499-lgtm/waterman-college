import { REMARKABLE_TAGS, embedVideo } from "@/lib/remarkable-media";

export function RemarkableVideo({ url }: { url: string | null | undefined }) {
  const embed = embedVideo(url);
  if (!embed) return null;
  if (embed.kind === "iframe") {
    return (
      <div className="mt-6 overflow-hidden rounded-md border border-line bg-navy shadow-card">
        <div className="relative aspect-video">
          <iframe
            src={embed.src}
            title="Be Remarkable video"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }
  if (embed.kind === "file") {
    return (
      <video className="mt-6 w-full rounded-md bg-navy shadow-card" src={embed.src} controls preload="metadata" />
    );
  }
  return (
    <a
      href={embed.href}
      target="_blank"
      rel="noreferrer"
      className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-line bg-surface px-4 text-sm font-medium text-navy hover:border-navy"
    >
      Open video
    </a>
  );
}

export function TagPills({
  tags,
  active,
  onToggle,
}: {
  tags: string[];
  active?: string | null;
  onToggle?: (tag: string) => void;
}) {
  if (!tags.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => {
        const on = active?.toLowerCase() === tag.toLowerCase();
        const className = on
          ? "border-navy bg-navy text-paper"
          : "border-line bg-surface text-navy/80 hover:border-navy";
        if (!onToggle) {
          return (
            <span key={tag} className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${className}`}>
              {tag}
            </span>
          );
        }
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${className}`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

export function RemarkableMediaFields({
  videoUrl,
  tags,
  onChange,
  inputClass,
}: {
  videoUrl: string;
  tags: string[];
  onChange: (next: { videoUrl: string; tags: string[] }) => void;
  inputClass: string;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Video link</span>
        <input
          className={inputClass}
          value={videoUrl}
          placeholder="YouTube, Vimeo, Loom, or a direct .mp4 link"
          onChange={(e) => onChange({ videoUrl: e.target.value, tags })}
        />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Tags</span>
        <div className="flex flex-wrap gap-2">
          {REMARKABLE_TAGS.map((tag) => {
            const on = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  onChange({
                    videoUrl,
                    tags: on
                      ? tags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
                      : [...tags, tag],
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] ${
                  on ? "border-brass bg-brass/20 text-brass" : "border-line text-muted hover:border-navy hover:text-navy"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <input
          className={`${inputClass} mt-3`}
          value={tags.filter((tag) => !REMARKABLE_TAGS.includes(tag as (typeof REMARKABLE_TAGS)[number])).join(", ")}
          placeholder="Extra tags, comma separated"
          onChange={(e) => {
            const extra = e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
            const preset = tags.filter((tag) =>
              REMARKABLE_TAGS.some((known) => known.toLowerCase() === tag.toLowerCase()),
            );
            onChange({ videoUrl, tags: [...preset, ...extra] });
          }}
        />
      </div>
    </div>
  );
}
