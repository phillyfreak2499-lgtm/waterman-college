alter table user_profiles add column if not exists reports_to text;

create index if not exists user_profiles_reports_to_idx on user_profiles (reports_to);

create table if not exists training_assignments (
  id          text primary key,
  user_id     text not null,
  track_id    text not null,
  assigned_by text not null,
  note        text,
  due_on      text,
  created_at  timestamptz not null default now(),
  unique (user_id, track_id)
);

create index if not exists training_assignments_user_idx on training_assignments (user_id);
