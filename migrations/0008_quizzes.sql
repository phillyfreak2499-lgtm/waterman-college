create table if not exists quizzes (
  id          text primary key,
  title       text not null,
  lesson_slug text,
  intro       text,
  questions   text not null,
  sort_order  int not null default 0,
  archived    boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists quiz_responses (
  id           text primary key,
  quiz_id      text not null,
  user_id      text not null,
  answers      text not null,
  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz
);

create index if not exists quiz_responses_quiz_idx on quiz_responses (quiz_id);
create index if not exists quiz_responses_user_idx on quiz_responses (user_id);
