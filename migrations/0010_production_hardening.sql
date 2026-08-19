-- Consolidate every application table/column that older code created at request
-- time. After this migration, migrations/ is the only schema source of truth.

alter table user_profiles add column if not exists reports_to text;
alter table user_profiles add column if not exists username text;
alter table user_profiles add column if not exists first_name text;
alter table user_profiles add column if not exists last_name text;
alter table user_profiles add column if not exists account_status text;
alter table user_profiles add column if not exists title text;
alter table user_profiles add column if not exists rbac_role text;
alter table user_profiles add column if not exists last_login_at timestamptz;
alter table user_profiles add column if not exists store_id text;
alter table user_profiles add column if not exists phone text;
alter table user_profiles add column if not exists must_change_password boolean not null default false;

create table if not exists rbac_roles (
  id text primary key,
  name text not null,
  description text not null default '',
  locked boolean not null default false,
  access_role text not null default 'specialist',
  perms text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  actor_id text,
  actor_name text,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table admin_unlocks add column if not exists expires_at timestamptz;
update admin_unlocks
set expires_at = coalesce(expires_at, unlocked_at + interval '15 minutes');

create table if not exists password_reset_requests (
  id text primary key,
  user_id text not null,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

-- Preserve only one value where old check-then-insert races made duplicates.
with duplicate_names as (
  select user_id,
         row_number() over (partition by lower(username) order by created_at, user_id) as n
  from user_profiles
  where username is not null and trim(username) <> ''
)
update user_profiles p
set username = null
from duplicate_names d
where p.user_id = d.user_id and d.n > 1;

with duplicate_quizzes as (
  select id,
         row_number() over (
           partition by quiz_id, user_id
           order by submitted_at desc, id desc
         ) as n
  from quiz_responses
)
delete from quiz_responses r
using duplicate_quizzes d
where r.id = d.id and d.n > 1;

create unique index if not exists user_profiles_username_unique_idx
  on user_profiles (lower(username))
  where username is not null and trim(username) <> '';
create unique index if not exists quiz_responses_quiz_user_unique_idx
  on quiz_responses (quiz_id, user_id);
create unique index if not exists user_profiles_single_super_admin_idx
  on user_profiles ((1))
  where rbac_role = 'super-admin';

create index if not exists lesson_progress_lesson_key_idx on lesson_progress (lesson_key);
create index if not exists quiz_responses_submitted_at_idx on quiz_responses (submitted_at desc);
create index if not exists trainer_notes_created_at_idx on trainer_notes (created_at desc);
create index if not exists audit_log_created_at_idx on audit_log (created_at desc);
create index if not exists cms_tracks_archived_sort_idx on cms_tracks (archived, sort_order);
create index if not exists cms_media_created_at_idx on cms_media (created_at desc);
create index if not exists password_reset_requests_open_idx
  on password_reset_requests (requested_at desc)
  where resolved_at is null;
create unique index if not exists password_reset_requests_one_open_per_user_idx
  on password_reset_requests (user_id)
  where resolved_at is null;

-- One-time conversion of legacy free-text stores. New writes maintain both the
-- normalized store id and display name together.
insert into stores (id, name, city, phone, sort_order)
select
  'legacy-' || substr(md5(trim(store)), 1, 12),
  trim(store),
  null,
  null,
  row_number() over (order by trim(store))::int
from (
  select distinct store
  from user_profiles
  where store is not null and trim(store) <> ''
) legacy
on conflict (id) do nothing;

update user_profiles p
set store_id = s.id
from stores s
where (p.store_id is null or p.store_id = '')
  and p.store is not null
  and lower(trim(p.store)) = lower(trim(s.name));

-- Seed defaults once. User edits are intentionally preserved by DO NOTHING.
insert into rbac_roles (id, name, description, locked, access_role, perms) values
  (
    'super-admin', 'Super Admin', 'The Chancellor. Every door, every page, the office.', true, 'admin',
    '{"chancellor":true,"viewWhy":true,"viewHow":true,"viewTraining":true,"viewDirectory":true,"viewQuad":true,"viewRemarkable":true,"viewTeam":true,"trainNewHires":true,"trainSpecialist":true,"trainMit":true,"trainManagers":true,"manageUsers":true,"manageTraining":true,"editSite":true}'
  ),
  (
    'manager', 'Manager', 'A store team and the trainings under them.', false, 'managers',
    '{"chancellor":false,"viewWhy":true,"viewHow":true,"viewTraining":true,"viewDirectory":true,"viewQuad":true,"viewRemarkable":true,"viewTeam":true,"trainNewHires":true,"trainSpecialist":true,"trainMit":true,"trainManagers":true,"manageUsers":true,"manageTraining":false,"editSite":false}'
  ),
  (
    'trainer', 'Trainer', 'The whole catalog and the huddle.', false, 'trainer',
    '{"chancellor":false,"viewWhy":true,"viewHow":true,"viewTraining":true,"viewDirectory":true,"viewQuad":true,"viewRemarkable":true,"viewTeam":true,"trainNewHires":true,"trainSpecialist":true,"trainMit":true,"trainManagers":true,"manageUsers":false,"manageTraining":true,"editSite":true}'
  ),
  (
    'sales-associate', 'Sales Associate', 'Specialist path and the floor.', false, 'specialist',
    '{"chancellor":false,"viewWhy":true,"viewHow":true,"viewTraining":true,"viewDirectory":true,"viewQuad":true,"viewRemarkable":true,"viewTeam":false,"trainNewHires":true,"trainSpecialist":true,"trainMit":false,"trainManagers":false,"manageUsers":false,"manageTraining":false,"editSite":false}'
  ),
  (
    'viewer', 'Viewer', 'Read the college. No hall until placed.', false, 'pending',
    '{"chancellor":false,"viewWhy":true,"viewHow":true,"viewTraining":false,"viewDirectory":true,"viewQuad":false,"viewRemarkable":true,"viewTeam":false,"trainNewHires":false,"trainSpecialist":false,"trainMit":false,"trainManagers":false,"manageUsers":false,"manageTraining":false,"editSite":false}'
  )
on conflict (id) do nothing;
