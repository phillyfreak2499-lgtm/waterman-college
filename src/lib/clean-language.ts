/**
 * Keep the college work-appropriate: one shared profanity check enforced in
 * every server function that accepts free text (notes, shout-outs, win
 * stories, directory fields, evals, questions to the trainer). Pure module,
 * safe on client and server; the server-side validators are the authority.
 *
 * Matching is deliberately evasion-tolerant — lowercase, common leetspeak
 * (@→a, 3→e, 0→o…), stretched letters ("fuuuck"), and separators between
 * letters ("f.u.c.k") — while word boundaries keep everyday words like
 * "class", "assistant", or "cocktail" from being flagged.
 */

type Entry = {
  word: string;
  /** Allow trailing letters (plurals, -ing, -ed). Off for words where a
   * suffix makes an innocent word (ass→assistant, cock→cocktail). */
  suffix?: boolean;
};

const BLOCKLIST: Entry[] = [
  { word: "fuck", suffix: true },
  { word: "motherfucker", suffix: true },
  { word: "shit", suffix: true },
  { word: "bullshit", suffix: true },
  { word: "bitch", suffix: true },
  { word: "asshole", suffix: true },
  { word: "ass" },
  { word: "jackass", suffix: true },
  { word: "dumbass", suffix: true },
  { word: "bastard", suffix: true },
  { word: "cunt", suffix: true },
  { word: "dick" },
  { word: "dickhead", suffix: true },
  { word: "cock" },
  { word: "pussy" },
  { word: "piss", suffix: true },
  { word: "whore", suffix: true },
  { word: "slut", suffix: true },
  { word: "twat", suffix: true },
  { word: "wank", suffix: true },
  { word: "prick" },
  { word: "damn", suffix: true },
  { word: "goddamn", suffix: true },
  { word: "dammit", suffix: true },
  // Slurs — always blocked, no exceptions.
  { word: "nigger", suffix: true },
  { word: "nigga", suffix: true },
  { word: "faggot", suffix: true },
  { word: "fag" },
  { word: "retard", suffix: true },
  { word: "kike", suffix: true },
  { word: "spic" },
  { word: "beaner", suffix: true },
  { word: "wetback", suffix: true },
  { word: "tranny", suffix: true },
  { word: "dyke" },
  { word: "chink" },
];

/** Map common character substitutions back to letters before matching. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[$5]/g, "s")
    .replace(/[!1|]/g, "i")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/7/g, "t");
}

const PATTERNS: RegExp[] = BLOCKLIST.map((entry) => {
  // Each letter may repeat ("fuuuck") with separators between ("f.u.c.k");
  // lookarounds forbid touching letters so words containing a bad word
  // ("class", "Scunthorpe") stay clean.
  const body = entry.word
    .split("")
    .map((c) => `${c}+`)
    .join("[\\W_]*");
  const tail = entry.suffix ? "" : "(?![a-z])";
  return new RegExp(`(?<![a-z])${body}${tail}`);
});

/** True when the text contains blocked language. */
export function hasProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = normalize(text);
  return PATTERNS.some((p) => p.test(normalized));
}

/**
 * Throw a friendly error when any of the given values contains blocked
 * language. `where` names the field for the message ("a shout-out").
 */
export function assertClean(where: string, ...values: (string | null | undefined)[]): void {
  for (const value of values) {
    if (hasProfanity(value)) {
      throw new Error(`Let's keep it work-appropriate — that language can't go in ${where}.`);
    }
  }
}
