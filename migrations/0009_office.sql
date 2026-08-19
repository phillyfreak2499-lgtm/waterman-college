create table if not exists trainer_notes (
  id text primary key,
  user_id text not null,
  lesson_key text not null,
  body text not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
