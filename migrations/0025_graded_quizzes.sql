-- Graded quizzes (opt-in). A quiz stays a human-reviewed check-in unless
-- `graded` is turned on, at which point it carries a pass mark and (optionally)
-- gates lesson completion. Correct answers ride in the existing questions JSON.
alter table quizzes add column if not exists graded boolean not null default false;
alter table quizzes add column if not exists pass_mark int not null default 0;
alter table quizzes add column if not exists require_pass boolean not null default false;

-- Per-submission score (percent) and pass flag; null for ungraded check-ins.
alter table quiz_responses add column if not exists score int;
alter table quiz_responses add column if not exists passed boolean;
