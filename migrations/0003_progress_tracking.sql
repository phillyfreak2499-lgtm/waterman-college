alter table lesson_progress add column if not exists started_at timestamptz;
alter table lesson_progress add column if not exists last_viewed_at timestamptz;

alter table lesson_progress alter column completed_at drop not null;
alter table lesson_progress alter column completed_at drop default;

update lesson_progress
set
  started_at = coalesce(started_at, completed_at, now()),
  last_viewed_at = coalesce(last_viewed_at, completed_at, now());
