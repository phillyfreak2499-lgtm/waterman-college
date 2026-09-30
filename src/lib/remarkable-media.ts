import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const REMARKABLE_TAGS = [
  "Huddle",
  "Client Experience",
  "Product",
  "Floor",
  "Leadership",
  "Recognition",
  "Culture",
  "Training clip",
  "Story",
] as const;

export type RemarkableTag = (typeof REMARKABLE_TAGS)[number];

export type RemarkableMedia = {
  newsId: string;
  videoUrl: string | null;
  tags: string[];
};

function cleanUrl(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Video link must be text.");
  const url = value.trim();
  if (!url) return null;
  if (url.length > 2000) throw new Error("Video link is too long.");
  if (!/^https?:\/\//i.test(url)) throw new Error("Video link must start with http:// or https://");
  return url;
}

export function parseTags(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n]/)
      : [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const tag = String(item ?? "").trim().replace(/\s+/g, " ");
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag.slice(0, 40));
    if (tags.length >= 12) break;
  }
  return tags;
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/", "").slice(0, 20);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      const embed = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function embedVideo(url: string | null | undefined) {
  if (!url) return null;
  const yt = youtubeId(url);
  if (yt) return { kind: "iframe" as const, src: `https://www.youtube-nocookie.com/embed/${yt}` };
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { kind: "iframe" as const, src: `https://player.vimeo.com/video/${id}` };
    }
    if (parsed.hostname.includes("loom.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return { kind: "iframe" as const, src: `https://www.loom.com/embed/${id}` };
    }
  } catch {
    return { kind: "link" as const, href: url };
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kind: "file" as const, src: url };
  return { kind: "link" as const, href: url };
}

function parseStoredTags(raw: string | null) {
  if (!raw) return [];
  try {
    return parseTags(JSON.parse(raw));
  } catch {
    return parseTags(raw);
  }
}

export const listRemarkableMedia = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    try {
      const rows = await sql<{ news_id: string; video_url: string | null; tags: string }>`
        select news_id, video_url, tags from cms_news_media limit 1000
      `;
      const map: Record<string, RemarkableMedia> = {};
      for (const row of rows) {
        map[row.news_id] = {
          newsId: row.news_id,
          videoUrl: row.video_url,
          tags: parseStoredTags(row.tags),
        };
      }
      return map;
    } catch {
      return {};
    }
  });

export const saveRemarkableMedia = createServerFn({ method: "POST" })
  .validator((input: { newsId: string; videoUrl?: string | null; tags?: string[] | string }) => {
    if (!input || typeof input.newsId !== "string" || !input.newsId || input.newsId.length > 120) {
      throw new Error("Post id is required.");
    }
    return {
      newsId: input.newsId,
      videoUrl: cleanUrl(input.videoUrl),
      tags: parseTags(input.tags),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { readAccessProfile } = await import("@/lib/access");
    const profile = await readAccessProfile(context.userId);
    if (!profile.isAdmin && !profile.isChancellor && !profile.canOpenStudio) {
      throw new Error("Forbidden");
    }
    const sql = await getSql();
    await sql`
      insert into cms_news_media (news_id, video_url, tags, updated_at)
      values (${data.newsId}, ${data.videoUrl}, ${JSON.stringify(data.tags)}, now())
      on conflict (news_id) do update set
        video_url = excluded.video_url,
        tags = excluded.tags,
        updated_at = now()
    `;
    return { newsId: data.newsId, videoUrl: data.videoUrl, tags: data.tags } satisfies RemarkableMedia;
  });
