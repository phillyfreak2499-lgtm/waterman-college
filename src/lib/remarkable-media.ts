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

export type VideoEmbed =
  | { kind: "iframe"; src: string; original: string }
  | { kind: "file"; src: string; original: string };

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

function lastPath(parsed: URL) {
  return parsed.pathname.split("/").filter(Boolean).pop() ?? "";
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/\/(embed|shorts|live|v)\/([^/?]+)/);
      if (match) return match[2];
      if (host === "youtu.be") return parsed.pathname.replace(/^\//, "").split("/")[0];
    }
  } catch {
    return null;
  }
  return null;
}

export function embedVideo(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  const original = url;
  const yt = youtubeId(url);
  if (yt) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${yt}?rel=0`, original };
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host.includes("vimeo.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = [...parts].reverse().find((part) => /^\d+$/.test(part));
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}`, original };
    }

    if (host.includes("loom.com")) {
      const id = lastPath(parsed).replace(/\?.*$/, "");
      if (id) return { kind: "iframe", src: `https://www.loom.com/embed/${id}`, original };
    }

    if (host.includes("drive.google.com")) {
      const file = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      const id = file?.[1] || parsed.searchParams.get("id");
      if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview`, original };
    }

    if (host.includes("dropbox.com")) {
      parsed.searchParams.set("raw", "1");
      parsed.searchParams.delete("dl");
      return { kind: "file", src: parsed.toString(), original };
    }

    if (host.includes("streamable.com")) {
      const id = lastPath(parsed);
      if (id && id !== "e") return { kind: "iframe", src: `https://streamable.com/e/${id}`, original };
    }

    if (host.includes("wistia.com") || host.includes("wi.st")) {
      const id = lastPath(parsed);
      if (id) return { kind: "iframe", src: `https://fast.wistia.net/embed/iframe/${id}`, original };
    }
  } catch {
    return { kind: "iframe", src: url, original };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) {
    return { kind: "file", src: url, original };
  }
  return { kind: "iframe", src: url, original };
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
