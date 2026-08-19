-- Locker feature: personal favorites and notes/reminders for each user
-- Additive only. Does not alter existing tables.

create table if not exists user_favorites (
  id          text primary key,
  user_id     text not null,
  target_type text not null check (target_type in ('track', 'lesson')),
  target_id   text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists user_favorites_user_idx on user_favorites (user_id);

create table if not exists user_locker_notes (
  id          text primary key,
  user_id     text not null,
  body        text not null,
  pinned      boolean not null default false,
  reminder_on date,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_locker_notes_user_idx
  on user_locker_notes (user_id, pinned desc, updated_at desc);
