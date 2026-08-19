# Upgrade: Manager section grades (1–10) + Specialist averages

## What changed

### Managers / DMs (during the eval)
Each major phase now ends with a required **Manager grade (1–10)**:
- Welcome
- Interview
- Analysis
- Fitting
- Solution
- Close

These appear on the printable coaching brief with a phase average.

### Specialists (My Locker)
New **Presentation skills** card when they have at least one graded eval:
- Overall average
- Per-phase averages (Welcome → Close)
- Phases under 7 are highlighted so they know where to focus training

### No new migration
Scores live in the existing `answers` JSONB on `presentation_evaluations`.

## Files
- `src/lib/presentation-eval.ts` — score fields + `averagePhaseScores` + `listMyEvalScores`
- `src/components/eval-summary.tsx` — phase grades on coaching brief
- `src/routes/locker.tsx` — Specialist averages card

Requires Presentation Evaluation package (migration 0014) already applied.
