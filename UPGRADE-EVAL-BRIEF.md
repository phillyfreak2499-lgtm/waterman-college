# Upgrade: Printable coaching brief after Presentation Evaluation

After a manager saves an evaluation, the screen shows a **coaching brief** instead of a bare success message.

## What it shows
- Specialist, date, store, client, observer context
- Self-score (1–10) when present
- **Excelled at** / **Focus next** callouts (from Part 1 & Part 2 coaching notes)
- Every **answered** field only — empty questions are omitted
- Grouped by phase (Welcome → Interview → … → Reflection)
- Yes/No, checklist bullets, and free-text coaching notes

## Print
- **Print brief** button calls the browser print dialog
- Header/nav/footer hidden; brief stays clean on paper

## Files
- `src/components/eval-summary.tsx` (new)
- `src/routes/team.evaluate.$userId.tsx` (post-save screen)
- `src/styles.css` (print rules)

Requires the Presentation Evaluation package (migration 0014 + presentation-eval.ts) already applied.
