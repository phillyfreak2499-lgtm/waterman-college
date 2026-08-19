# Integration review — Locker Health, Presentation Eval, Eval Brief

Three patches were integrated together. They are **cumulative, not independent**:

- `locker-health` — favourites, "apply on floor", store-health dashboard
- `presentation-eval` — a **superset** of locker-health, plus the observation form
- `eval-brief` — refines `team.evaluate.$userId` and adds `eval-summary.tsx`

Applied in that order: `presentation-eval` (superseding `locker-health`), then
`eval-brief` on top. ~2,300 lines of new code across three features.

## Bugs found and fixed

| Where | Problem | Fix |
|---|---|---|
| `routes/team.health.tsx`, `routes/team.evaluate.$userId.tsx` | Flat-routed as **children of `team.tsx`**, which renders no `<Outlet/>`. `/team/health` and `/team/evaluate/:id` would have rendered the Team page and **never shown the new screens**. | Renamed to `team_.health.tsx` / `team_.evaluate.$userId.tsx`. The `_` suffix opts out of nesting and keeps the URL — the same convention already used by `training/$track_.$lesson.tsx`. Verified: `/team` → "Everyone", `/team/health` → "Training Health". |
| `routes/locker.tsx` | `user?.name` — `AppUser` exposes `displayName`. **Reverted a fix from the previous upgrade**; the greeting fell back to "Hello, there." | `user?.displayName`. Verified: now reads "Hello, Chancellor." |
| `lib/locker.ts` | `daysUntil()` resolved `new Date()` in the **server's** zone (UTC on Vercel), so for the first hours of each Central day an assignment due **today** was reported **overdue**. Reverted the same fix made previously. | Re-applied `America/Chicago` comparison, matching `digest.ts`. |
| `lib/locker.ts` | `toggleFavorite` select-then-insert with no transaction — a double-tap raced the unique index and returned a **500**. | `on conflict … do nothing`. |
| `lib/locker.ts` | `markReminderDone` was one-way; `done_at` could be set but never cleared, so a mis-tap was permanent. | Restored the toggle (`done` defaults to true, so existing callers are unaffected). |
| `lib/locker.ts` | `deleteLockerNote` reported success when it matched **zero** rows. | `returning id` + a real error. |
| `lib/presentation-eval.ts` | Unused `readAccessProfile` import. | Removed. |
| `migrations/0013_locker.sql` | Patches shipped a modified `0013` — but it is **already applied downstream**, and a changed migration never re-runs. | Kept the existing `0013`. Their delta was **comments and blank lines only**, no schema change — verified by diff. |

## Migrations

`0014_presentation_evals.sql` added (additive; CHECK constraint on
`specialist_score`, four indexes). `0013` intentionally left untouched.

## Authorization — audited, no changes needed

| Endpoint | Gate |
|---|---|
| `listStoreHealth` | `authMiddleware` + leader/admin + scoped through `visiblePeople()` |
| `listEvalsForPerson` | `authMiddleware` + `assertCanViewPerson()` |
| `submitPresentationEval` | `authMiddleware` + leader/admin + `assertCanViewPerson()` |
| `listNeedsEvalThisWeek` | `authMiddleware` + leader/admin (returns `[]` otherwise) |

## Verified

`tsc` 0 · `eslint` 0 errors (back to the 7 pre-existing warnings) · 51/51 tests ·
build exit 0. In-browser: all new and existing routes render, favouriting from a
track page reaches the Locker, greeting resolves to the real name, `/team/health`
renders its own page, `/team/evaluate/<unknown>` degrades to "Unavailable" rather
than crashing, **0 idle requests**, **0 console errors**.

Nothing prior was lost: lesson links, CSP and security headers, catalog
redaction, provisioning and the forced password change are all intact.
