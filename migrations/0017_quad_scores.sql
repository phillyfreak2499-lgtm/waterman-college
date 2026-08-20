-- The Quad: per-user practice-game activity — plays plus best/last score.
-- Additive only. Does not alter existing tables.

create table if not exists user_game_scores (
  id             text primary key,
  user_id        text not null,
  game_slug      text not null,
  plays          integer not null default 0,
  best_score     integer,
  last_score     integer,
  last_played_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, game_slug)
);

create index if not exists user_game_scores_user_idx
  on user_game_scores (user_id, last_played_at desc);
