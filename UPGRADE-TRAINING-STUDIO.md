# Upgrade: Professor Training Office

A Chancellor-style office for the Professor role. Walk in at `/studio`.
Everything built there publishes onto the live campus.

## Open it

Nav shows **Training Office** when the signed-in position has `viewStudio`
or `manageTraining`. Professor and Chancellor start with the office on.

Toggle it per position:

- Chancellor → Roles → **Training Office** checkbox
- Training Office → Doors → **Who can open this office**

## Inside the office

| Tab | What it does |
| --- | --- |
| Desk | Live/draft counts, open questions, shortcuts |
| Courses | Create and edit courses + lessons, set the door, archive |
| Library | Upload photos used on courses and posts |
| Publish | Be Remarkable posts — live the moment you save |
| Quizzes | Build quizzes and review answers |
| Links | Attach http(s) destinations to tagged lesson lines |
| Inbox | Ask-the-professor questions |
| Assign | Put a course on someone’s path |
| Doors | Show/hide a course by position; publish or unpublish |
| Tools | Floor, huddle, health, Quad games |

## Apply

```bash
MIGRATIONS_REQUIRED=true npm run release
# migration 0023_training_studio.sql
```

The office also works before the migration: any role that already has
`manageTraining` can enter. The migration adds the explicit `viewStudio`
flag so the office can be flipped without giving away every other training
permission.
