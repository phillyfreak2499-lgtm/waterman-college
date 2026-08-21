-- Directory regions: a configurable list of areas (East, West, …). Stores are
-- assigned to a region, and DMs/Professors can be scoped to one region so they
-- see only their area. Additive only.

create table if not exists regions (
  id         text primary key,
  name       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table stores add column if not exists region_id text;
alter table user_profiles add column if not exists region_id text;

create index if not exists stores_region_idx on stores (region_id);
create index if not exists user_profiles_region_idx on user_profiles (region_id);

-- Seed the two starter regions. They are fully editable (rename/add/delete) from
-- the Directory, so this is just a convenient default, not a fixed set.
insert into regions (id, name, sort_order) values
  ('east', 'East', 0),
  ('west', 'West', 1)
on conflict (id) do nothing;
