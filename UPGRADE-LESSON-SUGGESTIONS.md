# Upgrade: Automated lesson suggestions from presentation scores

Closes the coaching loop:

**Observe → Grade by phase → Specialist sees averages → Auto-suggest the right lesson → Train the gap**

## Behavior
When a Specialist’s average for a phase is **under 7**, My Locker shows **Suggested for you** with concrete lessons:

| Weak phase | Suggested lessons |
|------------|-------------------|
| Welcome | How you change the room · Door to door flow |
| Interview | Listen first · The two quiet fears |
| Analysis | Digital Scanner · Why the arch comes first |
| Fitting | Door to door flow · Trusted advisor |
| Solution | Trusted advisor · Why the arch comes first |
| Close | A close that feels like care · The two quiet fears |

- Sorted weakest-first  
- Deduped if the same lesson maps to multiple phases  
- One-tap open to the lesson  
- Shows phase label + average so the “why” is clear  

Threshold (`SUGGESTION_THRESHOLD = 7`) and `PHASE_LESSON_MAP` live in `presentation-eval.ts` and can be tuned without a migration.

## Files
- `src/lib/presentation-eval.ts` — map, `suggestLessonsFromScores`, `listMyEvalScores` returns suggestions  
- `src/routes/locker.tsx` — Suggested for you section  

Requires section-scores + presentation-eval packages already applied. No new migration.
