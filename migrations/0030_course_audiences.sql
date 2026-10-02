-- Course audiences, formats, and categories (COGS build spec, Changes 1–3).
-- Roles and permissions are untouched: who sees a course, what kind of course
-- it is, and what it covers all live on the course itself.

-- ── Change 1: multi-path audiences ─────────────────────────────────────────
-- audience_roles was added as text in 0028 and never read or written (empty
-- on all 17 live courses). Any stray value never affected visibility, so it is
-- discarded rather than honoured. Then backfill each course to its current
-- home path so every course keeps exactly today's visibility.
alter table cms_tracks
  alter column audience_roles type text[]
  using '{}'::text[];

update cms_tracks set audience_roles = '{}' where audience_roles is null;
alter table cms_tracks alter column audience_roles set default '{}';
alter table cms_tracks alter column audience_roles set not null;

update cms_tracks
set audience_roles = array[role]
where visible_to_all = false and cardinality(audience_roles) = 0;

-- ── Change 2: format ───────────────────────────────────────────────────────
-- Every course gets exactly one. Read & Respond is the honest default: no live
-- course outside onboarding and the builder guide carries a VIDEO line.
alter table cms_tracks
  add column if not exists format text not null default 'read-respond';

alter table cms_tracks drop constraint if exists cms_tracks_format_check;
alter table cms_tracks
  add constraint cms_tracks_format_check
  check (format in ('mastery', 'read-respond', 'audio'));

-- ── Change 3: categories ───────────────────────────────────────────────────
create table if not exists cms_categories (
  id         text primary key,
  label      text not null unique,
  sort_order int not null default 0
);

create table if not exists cms_track_categories (
  track_id    text not null references cms_tracks(id) on delete cascade,
  category_id text not null references cms_categories(id) on delete restrict,
  primary key (track_id, category_id)
);

create index if not exists cms_track_categories_category_idx
  on cms_track_categories (category_id);

-- Starter list, editable in the Chancellor's Office → Training → Categories.
-- Existing courses stay Uncategorized until someone assigns categories.
insert into cms_categories (id, label, sort_order) values
  ('product-knowledge', 'Product Knowledge', 0),
  ('client-experience', 'Client Experience', 1),
  ('sales-process', 'Sales Process', 2),
  ('leadership', 'Leadership', 3),
  ('culture', 'Culture', 4),
  ('operations', 'Operations', 5),
  ('onboarding', 'Onboarding', 6)
on conflict (id) do nothing;
