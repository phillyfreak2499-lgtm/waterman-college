-- Training Building Center
--
-- 1. Authored slide decks live on the lesson row. Stored as JSON text (not
--    jsonb) to match the quizzes.questions precedent and stay parse-identical
--    across the Neon (pg) and PGLite drivers. NULL = fall back to the static
--    deck registered in slide-tracks.ts via getDeckSlides().
alter table cms_lessons add column if not exists slides text;

-- 2. Grant course-building to the default Manager role ("bosses"). Professors
--    (the `trainer` role) and the Chancellor already have manageTraining in the
--    0010 seed; the Manager role shipped with it false. Scoped replace on the
--    exact seeded value so a Chancellor who deliberately changed a role's perms
--    is untouched. Runs once (tracked in _migrations by filename).
update rbac_roles
set perms = replace(perms, '"manageTraining":false', '"manageTraining":true')
where id = 'manager';
