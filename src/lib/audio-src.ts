/**
 * Validate the link on an `AUDIO ·` lesson line before it becomes an <audio>
 * source.
 *
 * Phase 1 plays from a URL, never from Postgres: either a file committed under
 * public/audio/ (linked as `/audio/<name>.mp3`) or any https:// address. Plain
 * http is refused because the campus is served over https and browsers block
 * mixed-content audio. Where audio files live long-term is still open.
 *
 * Pure module: safe on client and server.
 */
const LOCAL_AUDIO = /^\/audio\/[a-z0-9][a-z0-9_.\-/]*\.(mp3|m4a|aac|ogg|oga|wav)$/i;

export function parseAudioSrc(raw: string | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value || value.length > 2048) return null;
  if (value.startsWith("/")) {
    return LOCAL_AUDIO.test(value) && !value.includes("..") ? value : null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
