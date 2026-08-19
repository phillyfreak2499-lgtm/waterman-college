# Upgrade: Locker + Favorites + Apply on Floor + Training Health Dashboard

One complete, non-breaking additive upgrade for Waterman College.

## What this includes

### 1. My Locker (`/locker`)
Personal desk for every signed-in Specialist:
- Due courses with due dates + leadership notes
- Continue / Next Up
- Personal notes & reminders
- Favorites
- Quick actions

### 2. Star / Favorite buttons
- On every **lesson** page (next to Mark complete)
- On every **track** page (hero, works on dark navy)
- One tap → appears in My Locker → Favorites

### 3. “Apply on the floor” prompt
- At the end of every lesson (after takeaway)
- Guided: “How will you use this with your next Client?”
- Saves a note into the learner’s Locker

### 4. Manager / Store Training Health Dashboard (`/team/health`)
Leadership view of the closed loop:
- **Summary cards:** people in view, avg path %, overdue, new hires, stores at risk
- **Store table:** path completion %, overdue count, new-hire count, 7-day velocity, risk badge
- **Drill-down:** expand a store to see individuals (pct, overdue, risk reasons)
- **CSV export** for leadership reporting
- Linked from the Team page (“Training Health” button)

**Risk rules (v1, transparent):**
- Person: overdue assignments, new-hire ramp under 40%, path under 25%
- Store: elevated overdue, multiple at-risk people, low average completion

Managers still set due dates + notes on `/team`. Learners see them in Locker. Leadership sees results on Training Health.

## Files

**New**
- `migrations/0013_locker.sql`
- `src/lib/locker.ts`
- `src/lib/store-health.ts`
- `src/routes/locker.tsx`
- `src/routes/team.health.tsx`
- `src/components/favorite-button.tsx`
- `src/components/apply-on-floor.tsx`

**Modified**
- `src/routes/training/$track_.$lesson.tsx` — Favorite + Apply on Floor
- `src/routes/training/$track.tsx` — Favorite in hero
- `src/components/site-header.tsx` — My Locker nav item
- `src/routes/team.tsx` — link to Training Health

## How to apply
1. Copy/merge these files into your repo.
2. Run the migration:
   ```bash
   MIGRATIONS_REQUIRED=true npm run release
   # or
   npm run db:migrate
   ```
3. Deploy. New routes `/locker` and `/team/health` are picked up on next build/dev.

Existing Team assignment flow, progress, quizzes, RBAC, and all prior features remain unchanged.

## After shipping
Iterate with real Specialist + manager feedback. Next candidates: spaced reinforcement, finish remaining lesson links, Floor Mode / self-host fonts.
