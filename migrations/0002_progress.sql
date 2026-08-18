create table if not exists lesson_progress (
  user_id     text not null,
  lesson_key  text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_key)
);
create index if not exists lesson_progress_user_id_idx on lesson_progress (user_id);
