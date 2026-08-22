-- Win stories (short Client wins anyone can post) and the ledger that keeps
-- the Monday team pulse to one notification per leader per week.
-- Additive only.

create table if not exists win_stories (
  id         text primary key,
  user_id    text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists win_stories_created_idx on win_stories (created_at desc);

create table if not exists weekly_pulse_ledger (
  week       text not null,
  user_id    text not null,
  created_at timestamptz not null default now(),
  primary key (week, user_id)
);
