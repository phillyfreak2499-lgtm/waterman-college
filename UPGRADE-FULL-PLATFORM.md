# Waterman College — Full platform upgrade

One additive package covering Locker through presentation coaching loop and leadership tools.

## Apply

```bash
MIGRATIONS_REQUIRED=true npm run release
# migrations 0013 locker, 0014 presentation evals, 0015 lesson eval phases
```

## Included

### Learner
- **My Locker** — due work, notes, favorites, presentation skill averages, trends (this month vs last), suggested lessons (capped at 5), empty states
- **Star favorites** on lesson + track pages
- **Apply on the floor** → Locker notes
- **Floor Mode** (`/floor`) — large targets for between Clients
- Door-aware lesson suggestions from weak phase scores

### Manager / DM / Trainer
- **Team** — Evaluate presentation, needs-eval-this-week badge, phase score chips, open last coaching brief
- **Presentation Evaluation** — full phase form, manager 1–10 grades, printable coaching brief, practice-now CTA
- **Brief route** — `/team/evaluate/brief/$evalId` + save note to Locker
- **Training Health** — store health, needs-eval count, CSV export, **huddle pack**, **observer calibration**
- **Admin** — lesson form tags for presentation phases (stays on course door)

### Data
- `user_favorites`, `user_locker_notes`
- `presentation_evaluations`
- `cms_lessons.eval_phases`

## Deferred (needs external services)
- Push/SMS digests (VAPID/push already partially in repo — wire templates later)
- True “new this week” requires exposing track `updated_at` on public catalog (easy follow-up)

## Routes added
`/locker` `/floor` `/team/health` `/team/evaluate/$userId` `/team/evaluate/brief/$evalId`
