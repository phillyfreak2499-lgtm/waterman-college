# Full-platform upgrade — integration notes

Integration of `watermancollegefullplatformupgrade.zip` into the merged app.
Same method as the previous two rounds: diff the patch against the current base,
classify every file, fix what the patch broke, keep prior hardening, prove it at
runtime.

Result: **integrated.** `tsc` clean, `eslint` 0 errors, 51/51 tests, production
build exit 0, and every new screen verified in a real browser against a real
PostgreSQL 16 database with seeded data.

---

## 1. What the upgrade adds

| Area | File | Size |
| --- | --- | --- |
| Floor Mode — a between-Clients screen with large touch targets | `src/routes/floor.tsx` | new, 162 lines |
| Coaching brief — printable per-evaluation debrief | `src/routes/team_.evaluate.brief.$evalId.tsx` | new, 138 lines |
| Huddle pack, observer calibration, team eval status, month-over-month trends | `src/lib/presentation-eval.ts` | +371 lines |
| Locker: phase averages, suggestions, month comparison | `src/routes/locker.tsx` | 160 lines changed |
| Team desk: per-phase grades inline, "Open brief" | `src/routes/team.tsx` | 70 lines changed |
| Training Health: huddle pack + calibration panels | `src/routes/team_.health.tsx` | 139 lines changed |
| Nav entry for Floor Mode | `src/components/site-header.tsx` | +1 line |

No new migrations. It reads the `presentation_evaluations` table added in
`0014` and the phase list added in `0015`.

---

## 2. Bugs found in the patch, and what I did

### 2.1 Three routes would have rendered as blank pages — fixed

The patch shipped `team.evaluate.$userId.tsx`, `team.health.tsx` and
`team.evaluate.brief.$evalId.tsx` **without** the `_` segment suffix. Under
TanStack Router's file-based routing, `team.health.tsx` flat-routes as a *child*
of `team.tsx` — and `team.tsx` renders no `<Outlet/>`. All three pages would
have resolved, matched, and drawn nothing.

Renamed to `team_.health.tsx`, `team_.evaluate.$userId.tsx`,
`team_.evaluate.brief.$evalId.tsx`. The URLs are unchanged (`/team/health`,
`/team/evaluate/…`) — the suffix only opts the route out of nesting.

Verified in the regenerated `routeTree.gen.ts`: all four new routes carry
`getParentRoute: () => rootRouteImport` and keep their `/team/...` paths. This is
the third round in a row this same defect has arrived in a patch; whatever
generates them does not model the `_` convention.

### 2.2 The patch reverted four locker hardening fixes — re-applied

`src/lib/locker.ts` came back as a pre-hardening copy. Restored:

- `BUSINESS_TIME_ZONE = "America/Chicago"` + `businessToday()` — due dates are
  store-local, so a UTC-based comparison marks work overdue several hours early
  every evening.
- `on conflict (user_id, target_type, target_id) do nothing` on the favourite
  insert — double-clicking Star otherwise throws a primary-key violation at the
  user.
- `returning id` + an empty-result check on note delete and on
  `markReminderDone` — without it the UI reports success for a note that was
  already gone or belongs to someone else.
- `markReminderDone` validator accepting `done` so the reminder toggle is
  reversible.

### 2.3 The done-state UI was stripped — re-applied

`src/routes/locker.tsx` came back with `handleMarkDone(id)` (one-way) and no
done rendering at all. A completed note looked identical to an open one and the
check button simply vanished, so the state change was invisible and
irreversible.

Restored: strikethrough + muted body when done, `Reminder: <date>` while open,
`Done · was due <date>` once closed, and a reversible toggle carrying
`aria-pressed`. The server function already supported both directions.

### 2.4 `user?.name` again — fixed

`AppUser` exposes `displayName`, not `name`. Fourth consecutive patch to
regress this; it renders the greeting as "Hello, there." for every user.

### 2.5 `specialist_score` could abort a whole evaluation — fixed

`submitPresentationEval` wrote the Specialist's self-reflection score straight
through:

```ts
Number.isFinite(specialistScore) ? specialistScore : null
```

`specialist_score` is an `integer` column with `check (… between 1 and 10)`
(`migrations/0014`). A fractional value (`7.5`) or an out-of-range one (`0`,
`99`) does not fail that finite check — it reaches Postgres and aborts the
insert, throwing away the manager's entire written write-up with an opaque
database error.

Added `clampScore()`: rounds to a whole number and drops anything outside 1–10
rather than squeezing it to an endpoint, so a stray value never reads as a
genuine 1 or 10. The phase scores inside `answers` were already range-guarded by
`numScore()`, so averages could not be poisoned — only this one column was
exposed.

### 2.6 `trends` was fetched and never rendered — completed

The server computed month-over-month direction per phase and shipped it to the
client, where it was stored in state and displayed nowhere.

Rather than delete the dead state, I finished the wiring, since the phase grid
right beside it already renders each average: each phase row now shows a small
direction marker next to its score. Details:

- The arrow is `aria-hidden`; the meaning lives in `sr-only` text
  ("Up from last month (was 6/10)"), so it is not colour- or glyph-dependent.
- Colours come from the existing palette (`text-navy` / `text-brass` /
  `text-muted`). No new theme token — `text-success` does not exist in
  `@theme` and would have silently rendered unstyled.
- A first month with nothing to compare against renders no marker at all, so a
  new Specialist's locker stays clean.

### 2.7 Dead symbols removed

`useCatalog`/`catalog` in `locker.tsx`, `assignTraining` in `team_.health.tsx`,
`readAccessProfile` in `presentation-eval.ts` — all imported, none used.
Removing the `useCatalog()` call is behaviour-neutral: `CatalogProvider` fetches
in its own effect, independent of consumers. Lint warnings went 11 → 7 (the
remaining 7 are pre-existing react-refresh advisories, untouched).

---

## 3. Authorization audit

Every server function the upgrade adds, and its guard:

| Function | Guard |
| --- | --- |
| `listEvalsForPerson` | `assertCanViewPerson(actor, target)` |
| `submitPresentationEval` | leader-or-admin **and** `assertCanViewPerson` |
| `listNeedsEvalThisWeek` | leader-or-admin, then `visiblePeople` |
| `listMyEvalScores` | scoped to `presenter_id = context.userId` |
| `getPresentationEval` | `assertCanViewPerson(actor, row.presenter_id)` |
| `listTeamEvalStatus` | leader-or-admin, then `visiblePeople` |
| `listObserverCalibration` | leader-or-admin |
| `getStoreHuddlePack` | leader-or-admin, then store-scoped `visiblePeople` |

`assertCanViewPerson` permits self-view, permits org-wide roles, and otherwise
requires the target to be inside the actor's reporting tree — so a Specialist
can read their own coaching brief but not a peer's. `/floor` calls only
self-scoped functions, which is correct for a personal screen.

I confirmed this negatively as well: signed in as a non-leader, `/team`,
`/team/health` and `/team/evaluate/brief/<id>` each returned their own refusal
("This desk is for leaders.", "Leaders only", "Forbidden") rather than leaking
data or blank-rendering.

---

## 4. Runtime verification

PGLite is in-memory, so to seed data I stood up a real PostgreSQL 16 instance
and pointed `DATABASE_URL` at it. Useful side effect: **all 15 migrations apply
cleanly on real Postgres**, not just on the embedded engine.

Seeded one Specialist with four evaluations spanning two months — deliberately
mixed so each trend branch had to fire: Welcome 6 → 9 (up), Interview 5.5 → 8
(up), Analysis 6 → 6 (flat), Fitting 7 → 7 (flat), Solution 5.5 → 4 (down),
Close 8 → 8 (flat).

Registered and signed in through the real UI. Results:

- **Locker** — overall 6.7/10, "This month 7/10 · last month 6.3/10 · trending
  up", and the six phase rows each carrying the correct marker. The `sr-only`
  text read exactly: `Up from last month (was 6/10)`,
  `Up from last month (was 5.5/10)`, `Level with last month`,
  `Level with last month`, `Down from last month (was 5.5/10)`,
  `Level with last month`. Zero console errors.
- **First-month case** — deleted the prior month's evals: zero markers, zero
  `sr-only` nodes, no layout shift.
- **Reminder toggle** — clicked done → not-done → done. `aria-pressed` flipped,
  the strikethrough and `Done · was due 2026-08-18` cleared and returned, and
  `Reminder: 2026-08-18` reappeared while open. No page errors.
- **Floor Mode** — "Practice from scores" listed the weak-phase lessons in
  ascending order (Solution 4.8/10 first).
- **Team** — per-phase grades inline on each person, "Open brief" present.
- **Training Health** — by-store table, huddle pack picker, and observer
  calibration all populated.
- **Coaching brief** — printable brief with the 6.5/10 average and all six phase
  grades.

Screenshots: `/workspace/screenshots/{locker,floor,team,health,brief}.png`.

---

## 5. Deliberately not changed

- **The Presentation-skills copy and layout.** The existing textual month
  comparison already said "trending up / focus needed / steady"; I added the
  per-phase markers beside it rather than replacing it.
- **`migrations/0013_locker.sql`.** The patch shipped a modified copy, but the
  delta was a reworded comment and two blank lines. A modified
  already-applied migration never re-runs, so swapping it in would make the file
  on disk disagree with every deployed database for no benefit.
- **The two pre-existing lint warnings in `install-app.tsx`** (`Button`,
  `platform` unused). Out of this upgrade's scope.
- **`/team` has no `pageHead` override**, so its tab title is bare "Waterman
  College". Pre-existing, cosmetic, left alone.
- **No dependency changes.** The upgrade needed none.

---

## 6. Remaining risks and carried-forward TODOs

- **Patch drift is the standing risk.** Three of the six defects above were
  *reversions* of fixes already made, not new mistakes. Any future patch touching
  `locker.ts`, `locker.tsx`, or the `team.*` routes should be diffed against the
  current tree before it is applied — assume it is working from a stale copy.
- Observer calibration shows anyone who has ever observed, including people whose
  role has since changed. Accurate, but worth a note in the UI if it confuses
  managers.
- Carried forward from earlier rounds: self-host the brand fonts (README
  §Typography has the steps — it also lets the CSP drop Google Fonts); video
  delivery for the 66 VIDEO/GFA markers; consolidate `/admin` and `/chancellor`;
  replace `vault-hall.jpg`; rename `classroom.jpg` → `storefront.jpg` once no CMS
  rows reference it; prune remaining unused dependencies.
