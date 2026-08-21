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

- `src/lib/bright-note.ts` — new pure module: message pools, shout-out
  builders, and the deterministic daily picker. No server calls.
- `src/routes/locker.tsx` — renders the note card at the top of the locker,
  built entirely from data the page already loads. No new requests, no schema
  changes, no migration.
