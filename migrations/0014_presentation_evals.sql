-- Presentation evaluations: manager/trainer observes a Specialist presentation
-- Additive only. Supports weekly evals, trends, and future training tips.

create table if not exists presentation_evaluations (
  id              text primary key,
  presenter_id    text not null,
  observer_id     text not null,
  store           text,
  client_name     text,
  floor_leader    text,
  eval_date       date not null,
  start_time      text,
  party_size      text,
  -- Full structured answers (phases, checklists, free-text coaching)
  answers         jsonb not null default '{}'::jsonb,
  -- Specialist self-reflection (captured at end of coaching conversation)
  specialist_score integer check (specialist_score is null or (specialist_score >= 1 and specialist_score <= 10)),
  specialist_signed text,
  -- Coaching follow-through
  same_coaching_as_last boolean,
  practiced_after       boolean,
  created_at      timestamptz not null default now()
);

create index if not exists presentation_evaluations_presenter_idx
  on presentation_evaluations (presenter_id, eval_date desc);
create index if not exists presentation_evaluations_observer_idx
  on presentation_evaluations (observer_id, eval_date desc);
create index if not exists presentation_evaluations_store_idx
  on presentation_evaluations (store, eval_date desc);
create index if not exists presentation_evaluations_date_idx
  on presentation_evaluations (eval_date desc);
