# Integration review — Phase Map, Lesson Suggestions, Section Scores
### (plus re-submitted Eval Brief and Presentation Eval)

Five patches were submitted. **Two were already applied** and two more were
partial ancestors of a third, so the real work was resolving a dependency chain
rather than merging five independent changes.

## Dependency resolution

`presentation-eval.ts` appears in four of the five patches. Comparing exported
symbols showed a strict chain:

```
pres2 (664L)  →  scores (810L)  →  sugg (957L)  →  phase (1023L)
 already        +phase scores     +suggestions    +CatalogLessonRef
 applied        +listMyEvalScores +PHASE_LESSON_MAP
```

Resolved per file, taking the superset in each case:

| File | Taken from | Why |
|---|---|---|
| `lib/presentation-eval.ts` | **phase** (1023L) | strict superset of scores and sugg |
| `routes/locker.tsx` | **sugg** (448L) | superset of scores (408L) and pres2 (364L) |
| `components/eval-summary.tsx` | **scores** (264L) | superset of eval2 (223L) |
| `lib/cms.ts`, `lib/content.ts`, `routes/admin.tsx` | **phase** | only source |
| `migrations/0015_lesson_eval_phases.sql` | **phase** | only source |
| `styles.css`, `team.evaluate.$userId.tsx` | *unchanged* | byte-identical to what is already integrated |

**`presentation-eval` and `eval-brief` were skipped entirely** — verified
byte-identical to the versions integrated in the previous round (14/14 and 3/3
files respectively).

## Bugs found and fixed

| Where | Problem | Fix |
|---|---|---|
| `routes/locker.tsx` | `user?.name` — `AppUser` exposes `displayName`. **Third consecutive upgrade to reintroduce this**; the greeting fell back to "Hello, there." | `user?.displayName`. Verified: reads "Hello, Chancellor." |
| `routes/locker.tsx` | Completed reminders rendered identically to open ones, and completion was one-way again — the done-state UI added previously was reverted. | Restored strikethrough + "Done · was due …" and the reversible toggle (`handleMarkDone(id, !n.doneAt)`). The server fn already accepted `done`. |
| `lib/presentation-eval.ts` | Unused `readAccessProfile` import (also reverted from last round). | Removed. |

Everything else in these patches was sound. Notably `locker.tsx`'s route paths
(`/training/$track/$lesson`) and Button variants were correct this time — those
two regressions did **not** recur.

## Migration

`0015_lesson_eval_phases.sql` — adds `cms_lessons.eval_phases text[]` with a GIN
index and seeds eight existing specialist lessons. Additive; verified to apply
cleanly on PGLite (GIN on `text[]` included). `0013` and `0014` untouched.

## Data path verified end to end

`0015` adds the column → `readCatalog` selects and maps it → `saveLesson`
validates against the six allowed phases and persists → the suggestion engine
reads `evalPhases` with a catalog fallback → the admin lesson editor exposes the
chips. All six links present.

## Authorization — audited, no changes needed

| Endpoint | Gate |
|---|---|
| `submitPresentationEval` | `authMiddleware` + leader/admin + `assertCanViewPerson()` |
| `listEvalsForPerson` | `authMiddleware` + `assertCanViewPerson()` |
| `listNeedsEvalThisWeek` | `authMiddleware` + leader/admin + `visiblePeople()` |
| `listMyEvalScores` | `authMiddleware` + self-scoped `where presenter_id = context.userId` |

## Verified

`tsc` 0 · `eslint` 0 errors (back to the 7 pre-existing warnings) · 51/51 tests ·
build exit 0. In-browser, all 11 routes render with the correct `h1`
(`/team/health` → "Training Health", `/locker` → "My Locker", `/admin` → "Admin"),
migration 0015 applies with no DB error, **0 idle requests**, **0 console errors**.

The Lesson-links tab, CSP and security headers, catalog redaction, provisioning
and the forced password change all survive intact.
