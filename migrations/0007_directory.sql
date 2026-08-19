create table if not exists stores (
  id         text primary key,
  name       text not null,
  city       text,
  phone      text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table user_profiles add column if not exists store_id text;
alter table user_profiles add column if not exists title text;
alter table user_profiles add column if not exists phone text;

create index if not exists user_profiles_store_id_idx on user_profiles (store_id);
