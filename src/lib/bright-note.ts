/**
 * The daily locker note: a short, work-appropriate message that greets a
 * Specialist when they open their locker. It prefers a genuine shout-out
 * built from their real recent activity (streaks, finished tracks, climbing
 * presentation scores, green metrics) and falls back to a warm general
 * message about the day ahead.
 *
 * Selection is deterministic per person per day — the note stays the same
 * across reloads within a day, rotates the next day, and differs between
 * people. Pure module: no server calls, safe to unit-drive from anywhere.
 */

export type BrightNote = {
  kind:
    | "shoutout"
    | "general"
    | "peer"
    | "birthday"
    | "anniversary"
    | "welcome"
    | "team";
  text: string;
};

export type TeamEventInput = {
  kind: "birthday" | "anniversary" | "new";
  name: string;
  years?: number;
};

export type BrightNoteInput = {
  /** First name for messages that address the reader directly. */
  firstName: string;
  /** Stable per-user seed (user id); falls back to the name upstream. */
  seedKey: string;
  /** Local date in YYYY-MM-DD form — the rotation key. */
  today: string;
  streak: { current: number; best: number; todayDone: boolean } | null;
  assignments: {
    trackTitle: string;
    progress: { done: number; total: number; pct: number };
  }[];
  /** Presentation-eval averages, when the user has graded evals. */
  thisMonthAvg: number | null;
  priorMonthAvg: number | null;
  /** True when metrics were entered this period and none are orange/red. */
  allGreenMetrics: boolean;
  gameScores: { title: string; bestScore: number | null; plays: number }[];
  /** Today is the reader's birthday. */
  birthdayToday?: boolean;
  /** Whole years with the company, on their start-date anniversary. */
  anniversaryYears?: number | null;
  /** Recently approved — their first notes are a welcome. */
  isNewHire?: boolean;
  /** Today's featured shout-out from a coworker, if any. */
  peerShoutout?: { fromName: string; body: string } | null;
  /** Same-store teammates with a birthday, anniversary, or first days today. */
  teamEvents?: TeamEventInput[];
};

/** Local date as YYYY-MM-DD (the caller's timezone, matching what they see). */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** FNV-1a 32-bit hash — tiny, stable, good enough to spread picks around. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * General messages. Kept sincere and floor-appropriate: encouragement, a
 * little perspective, and pride in the work — never guilt, never pressure.
 */
const GENERALS: ((name: string) => string)[] = [
  (n) => `Good to have you here, ${n}. Somewhere today a Client will walk out easier than they walked in — because you showed up.`,
  (n) => `${n}, you don't have to be perfect today. Just be present with one person at a time. That's the whole job, and you're good at it.`,
  () => `The small things you do on an ordinary day — remembering a name, taking the extra minute — are the things people talk about at dinner.`,
  (n) => `However yesterday went, today gets a fresh start. Glad you're on it, ${n}.`,
  () => `Kindness is a skill, and you practice it more than most people ever will. That counts for something.`,
  (n) => `${n}, take the small wins today. On a busy day they count double.`,
  () => `You never know which Client needed exactly the patience you gave them. Most of them will never say it. It still mattered.`,
  (n) => `A deep breath before the first Client is a professional move, ${n}. So is a genuine smile. You have both.`,
  () => `Nobody remembers a perfect pitch. Everybody remembers feeling heard. Lead with that today.`,
  (n) => `Someone on your team is glad you're in today, ${n}. Probably more than one someone.`,
  () => `Do the next right thing, then the one after that. A great day is just that, repeated.`,
  (n) => `${n}, the care you put into this work is not invisible. People feel it, even when they don't name it.`,
  () => `Every expert was once a beginner who kept going. Whatever you're learning right now — keep going.`,
  (n) => `Walk in like you belong, ${n} — because you do.`,
  () => `The best part of this job hides in the middle of it: the moment a Client stands up and something has actually changed for them.`,
  (n) => `Today doesn't need you to be superhuman, ${n}. It just needs you — and that's plenty.`,
  () => `Patience with others is grace. Patience with yourself is wisdom. Pack both today.`,
  (n) => `You've handled harder days than this one, ${n}. Today doesn't stand a chance.`,
  () => `A good day on the floor is built one honest conversation at a time. You know how to have those.`,
  (n) => `${n}, whatever today brings, bring your curiosity. Days go better when you're interested in the people in them.`,
  () => `Helping someone walk without pain is quietly one of the better things a person can do with a Tuesday. Or any day.`,
  (n) => `Smile first, ${n}. It's contagious, it's free, and it works on Clients and coworkers alike.`,
  () => `Progress over perfection, always. You moved forward yesterday. Do it again today.`,
  (n) => `The energy you bring sets the tone for someone else's whole visit, ${n}. That's a kind of quiet power. Use it well.`,
];

/**
 * Shout-out builders — one candidate per real, recent, brag-worthy thing.
 * Only positive signals become notes; a lapsed streak or a low score never
 * shows up here (the locker has other sections for coaching).
 */
function buildShoutouts(input: BrightNoteInput): string[] {
  const { firstName: n, streak, assignments, thisMonthAvg, priorMonthAvg } = input;
  const out: string[] = [];

  if (streak && streak.current >= 3) {
    out.push(
      streak.current >= streak.best && streak.best > 3
        ? `${streak.current} days in a row — your best streak yet, ${n}. Showing up daily is the hardest part, and you're doing it.`
        : `${streak.current} days in a row, ${n}. That kind of consistency is how people quietly become great at this.`,
    );
  }

  for (const a of assignments) {
    if (a.progress.total > 0 && a.progress.pct === 100) {
      out.push(`You finished “${a.trackTitle}.” That's real work, done — be proud of it, ${n}.`);
    } else if (a.progress.pct >= 75 && a.progress.done > 0) {
      out.push(
        `“${a.trackTitle}” is ${a.progress.pct}% done. You're closer than it feels, ${n} — one more push and it's yours.`,
      );
    }
  }

  if (
    thisMonthAvg != null &&
    priorMonthAvg != null &&
    thisMonthAvg > priorMonthAvg + 0.2
  ) {
    out.push(
      `Your presentation scores are climbing — ${priorMonthAvg}/10 last month, ${thisMonthAvg}/10 this month. The practice is paying off, and people notice.`,
    );
  }

  if (input.allGreenMetrics) {
    out.push(`Green across the board this period, ${n}. That's not luck — that's you doing the work well.`);
  }

  const champ = input.gameScores.find((g) => g.plays >= 5 && g.bestScore != null);
  if (champ) {
    out.push(
      `${champ.plays} rounds of ${champ.title} in The Quad with a best of ${champ.bestScore!.toLocaleString()} — sharpening skills and having fun doing it. That's the way, ${n}.`,
    );
  }

  return out;
}

const BIRTHDAY_NOTES: ((name: string) => string)[] = [
  (n) => `Happy birthday, ${n}! Of all the days to be glad you're on this team, today is the easiest.`,
  (n) => `Happy birthday, ${n}. Hope today hands you at least one genuinely good surprise.`,
  (n) => `It's your day, ${n} — happy birthday. May every Client be easy and every coworker bring snacks.`,
];

function anniversaryNote(name: string, years: number): string {
  if (years === 1) {
    return `One year with us today, ${name}. Look how far you've come — happy anniversary.`;
  }
  return `${years} years with us today, ${name}. Grateful for every one of them — happy anniversary.`;
}

function welcomeNote(name: string): string {
  return `Welcome to the team, ${name}. Everyone here remembers their first days — ask anything, twice if you need to. We're glad you're here.`;
}

function teamEventNote(event: TeamEventInput): string {
  if (event.kind === "birthday") {
    return `It's ${event.name}'s birthday today. A little fuss goes a long way — make them feel it.`;
  }
  if (event.kind === "anniversary") {
    const y = event.years ?? 1;
    return `${event.name} hits ${y} ${y === 1 ? "year" : "years"} with us today. Worth a high-five when you see them.`;
  }
  return `${event.name} is new on your team. Remember your first day? Go make theirs easier.`;
}

/**
 * Build today's note, most-human first: a coworker's shout-out beats
 * everything, then the reader's own birthday or anniversary, then the
 * new-hire welcome, then a teammate's big day, then progress shout-outs,
 * then the general pool. Within the last two tiers one general message
 * rides along so even a streak-holder gets variety across the week.
 */
export function buildBrightNote(input: BrightNoteInput): BrightNote {
  const daySeed = hash(`${input.seedKey}|${input.today}`);
  const pickSeed = hash(`${input.seedKey}|${input.today}|pick`);

  if (input.peerShoutout) {
    return {
      kind: "peer",
      text: `From ${input.peerShoutout.fromName}: “${input.peerShoutout.body}”`,
    };
  }
  if (input.birthdayToday) {
    return { kind: "birthday", text: BIRTHDAY_NOTES[daySeed % BIRTHDAY_NOTES.length](input.firstName) };
  }
  if (input.anniversaryYears != null) {
    return { kind: "anniversary", text: anniversaryNote(input.firstName, input.anniversaryYears) };
  }
  if (input.isNewHire) {
    return { kind: "welcome", text: welcomeNote(input.firstName) };
  }
  const events = input.teamEvents ?? [];
  if (events.length > 0) {
    return { kind: "team", text: teamEventNote(events[daySeed % events.length]) };
  }

  const general: BrightNote = {
    kind: "general",
    text: GENERALS[daySeed % GENERALS.length](input.firstName),
  };

  const shoutouts = buildShoutouts(input);
  if (shoutouts.length === 0) return general;

  const pool: BrightNote[] = [
    ...shoutouts.map((text): BrightNote => ({ kind: "shoutout", text })),
    general,
  ];
  return pool[pickSeed % pool.length];
}
