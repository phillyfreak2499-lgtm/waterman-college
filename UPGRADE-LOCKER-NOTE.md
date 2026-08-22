# Locker Daily Note

Additive upgrade: when a Specialist opens **My Locker**, the first thing they
see is a short, warm message meant to start their day well — "A note for you."

## What it does

- **Personal shout-outs first.** When the person's real recent activity offers
  something worth celebrating, the note says so by name:
  - an active learning streak (3+ days, with a special line for a personal best)
  - a finished assigned track, or one that is 75%+ done ("one more push")
  - presentation-eval averages climbing month over month
  - metrics green across the board this period
  - regular practice in The Quad
- **Warm general messages otherwise.** A curated pool of ~24 work-appropriate
  lines — encouragement, perspective, pride in the work. No guilt, no pressure;
  negative signals (lapsed streaks, low scores) never appear here.
- **One note per person per day.** Selection is deterministic on
  (user id, local date): the note is stable across reloads within a day,
  rotates the next day, and differs between people. Even someone with active
  shout-outs gets a general message mixed in across the week for variety.

## Files

- `src/lib/bright-note.ts` — pure module: message pools, shout-out builders,
  and the deterministic daily picker (no server calls of its own).
- `src/routes/locker.tsx` — renders the note card at the top of the locker.

## Since v1

The note has grown server-side inputs beyond what the locker page already
loaded: `getLockerDaily` (`src/lib/locker-daily.ts`) now feeds it birthdays,
work anniversaries, peer shout-outs, new-hire welcomes, teammate events, and
fresh win stories, backed by migrations 0022–0026. See those modules for the
current data flow; only the message-picking itself remains pure client logic.
