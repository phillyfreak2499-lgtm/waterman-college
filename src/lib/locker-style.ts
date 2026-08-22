/**
 * The curated choices for decorating a locker door: accent colors that sit
 * well with the college palette, and a sticker set. Pure module — the
 * locker UI renders from it and the server validates against it.
 */

export const LOCKER_ACCENTS: Record<string, { label: string; color: string }> = {
  brass: { label: "Brass", color: "#c8a458" },
  navy: { label: "Navy", color: "#26415e" },
  forest: { label: "Forest", color: "#3f6d4e" },
  burgundy: { label: "Burgundy", color: "#8e3b46" },
  violet: { label: "Violet", color: "#7c5cbf" },
  teal: { label: "Teal", color: "#33827c" },
  sunset: { label: "Sunset", color: "#c96f2f" },
};

export const DEFAULT_ACCENT = "brass";

export const LOCKER_STICKERS = [
  "⭐", "🔥", "🎯", "🌵", "🐢", "🦴", "👟", "🌈",
  "🍩", "☕", "🎸", "🏈", "💪", "🍀", "🌞", "🐝",
] as const;

export const MAX_STICKERS = 3;

export type LockerStyle = {
  /** Key into LOCKER_ACCENTS. */
  accent: string;
  /** Up to MAX_STICKERS entries from LOCKER_STICKERS. */
  stickers: string[];
};

export function accentColor(accent: string | null | undefined): string {
  return (LOCKER_ACCENTS[accent ?? ""] ?? LOCKER_ACCENTS[DEFAULT_ACCENT]).color;
}

/** Parse the stored space-separated sticker string, dropping unknowns. */
export function parseStickers(value: string | null | undefined): string[] {
  const allowed = new Set<string>(LOCKER_STICKERS);
  return (value ?? "")
    .split(" ")
    .filter((s) => allowed.has(s))
    .slice(0, MAX_STICKERS);
}
