create table if not exists cms_settings (
  key   text primary key,
  value text not null
);

create table if not exists cms_roles (
  id         text primary key,
  label      text not null,
  kicker     text not null,
  title      text not null,
  summary    text not null,
  sort_order int not null default 0
);

create table if not exists cms_tracks (
  id         text primary key,
  role       text not null,
  title      text not null,
  nav        text not null,
  image      text not null,
  audience   text not null,
  summary    text not null,
  sort_order int not null default 0,
  archived   boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists cms_lessons (
  id         text primary key,
  track_id   text not null references cms_tracks(id) on delete cascade,
  slug       text not null,
  title      text not null,
  minutes    int not null default 8,
  kicker     text,
  body       text not null,
  takeaway   text,
  sort_order int not null default 0,
  unique (track_id, slug)
);

create table if not exists cms_news (
  id         text primary key,
  slug       text not null unique,
  title      text not null,
  date       text not null,
  body       text not null,
  image      text,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists cms_media (
  id         text primary key,
  filename   text not null,
  mime       text not null,
  data       text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_unlocks (
  user_id     text primary key,
  unlocked_at timestamptz not null default now()
);
