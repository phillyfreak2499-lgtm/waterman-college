create table if not exists user_profiles (
  user_id     text primary key,
  access_role text not null default 'pending',
  store       text,
  assigned_by text,
  assigned_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists user_profiles_role_idx on user_profiles (access_role);
