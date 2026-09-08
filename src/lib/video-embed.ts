/**
 * Turn a YouTube or Vimeo URL into a safe in-page embed.
 *
 * We never inject the raw URL into an iframe. Instead we extract the video ID
 * and build a fixed embed src on a known host, so the CSP `frame-src` allow-list
 * (`www.youtube-nocookie.com`, `player.vimeo.com` — see
 * server/middleware/security-headers.ts) is sufficient and nothing else can be
 * framed. Anything we don't recognise returns null and the caller falls back to
 * a plain external link.
 *
 * Pure module: safe on client and server.
 */

export type VideoEmbed = { provider: "youtube" | "vimeo"; id: string; src: string; title: string };

function parseUrl(raw: string): URL | null {
  const value = String(raw ?? "").trim();
  if (!value || value.length > 2048) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const YT_ID = /^[a-zA-Z0-9_-]{6,20}$/;
const VIMEO_ID = /^[0-9]{6,15}$/;

export function parseVideoEmbed(raw: string): VideoEmbed | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube — watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let id = url.searchParams.get("v") ?? "";
    if (!id) {
      const m = url.pathname.match(/^\/(?:shorts|embed|v)\/([^/?#]+)/);
      if (m) id = m[1];
    }
    if (YT_ID.test(id)) {
      return {
        provider: "youtube",
        id,
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        title: "YouTube video",
      };
    }
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split(/[/?#]/)[0];
    if (YT_ID.test(id)) {
      return {
        provider: "youtube",
        id,
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        title: "YouTube video",
      };
    }
    return null;
  }

  // Vimeo — vimeo.com/<id>, player.vimeo.com/video/<id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:^|\/)(\d{6,15})(?:$|[/?#])/);
    const id = m ? m[1] : "";
    if (VIMEO_ID.test(id)) {
      return {
        provider: "vimeo",
        id,
        src: `https://player.vimeo.com/video/${id}`,
        title: "Vimeo video",
      };
    }
    return null;
  }

  return null;
}
