# Upgrade: Presentation Evaluations (native) + prior Locker/Health package

Non-breaking additive upgrade.

## Presentation Evaluation (new)

Replaces the Google Form workflow for managers / regional managers / trainers.

### Manager workflow
1. Open **Team**
2. On a salesperson’s card, click **Evaluate presentation**
3. Form opens with **presenter + store pre-filled** (observer = you)
4. Walk section-by-section through the Waterman presentation phases
5. Save → stored in the college DB (not Google)

### Form sections (ported from Presentation Evaluation 2026)
- Context (client, party size, floor leader, start time)
- WELCOME Phase
- INTERVIEW Phase
- ANALYSIS Phase
- FITTING Phase
- SOLUTION Phase
- CLOSE / ANSWER / EXPERIENCE
- Proper Coaching
- Specialist reflection (1–10 + signature)

Answers are stored as structured JSON so we can add **trends** and **training tips** next without another migration.

### Files (eval)
- `migrations/0014_presentation_evals.sql`
- `src/lib/presentation-eval.ts`
- `src/routes/team.evaluate.$userId.tsx`
- `src/routes/team.tsx` (Evaluate presentation button)

## Also included (prior upgrades)
- My Locker + Favorites + Apply on the floor
- Manager / Store Training Health Dashboard

## How to apply
```bash
# merge files, then:
MIGRATIONS_REQUIRED=true npm run release
# or
npm run db:migrate
```

New routes: `/locker`, `/team/health`, `/team/evaluate/$userId`

## Next (not in this package)
- “Needs eval this week” badge on Team + Health
- Per-person eval history + trend charts
- Auto training tips from weak checklist areas → Locker / assignments
