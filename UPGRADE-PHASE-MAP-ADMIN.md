# Upgrade: Admin presentation-phase tags on lessons (door-aware suggestions)

## What this does

When you create or edit a lesson in **Admin → Training**, you can tag which **presentation phases** it strengthens:

- Welcome · Interview · Analysis · Fitting · Solution · Close

Those tags power **My Locker → Suggested for you** when a Specialist’s phase average is under 7.

### Four doors stay intact

- Lessons still live on a **course** with a role: New Hires / Specialist / MIT / Managers  
- Suggestions only include lessons on **doors the learner can access**  
  - Specialist → specialist (+ new-hires) tracks  
  - Manager → all doors they can open  
- Tagging a Specialist lesson with “Close” never pushes it into a New Hire–only path, and vice versa  

### Workflow

1. Admin → Training → select (or add) a course on the right door  
2. Add / edit a lesson  
3. Under **Presentation phases this lesson strengthens**, tap the phases that match  
4. Save  

New training uploaded to the Specialist area can be linked to Welcome / Interview / Close (etc.) immediately — no code change.

### Migration

`0015_lesson_eval_phases.sql` adds `cms_lessons.eval_phases text[]` and seeds tags for the existing default specialist lessons.

```bash
MIGRATIONS_REQUIRED=true npm run release
```

## Files

- `migrations/0015_lesson_eval_phases.sql`
- `src/lib/content.ts` — `Lesson.evalPhases`
- `src/lib/cms.ts` — read/save `eval_phases`
- `src/lib/presentation-eval.ts` — catalog + door-filtered suggestions
- `src/routes/admin.tsx` — phase tag UI on lesson form
