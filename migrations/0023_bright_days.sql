-- Bright days: birthdays, work anniversaries, and peer shout-outs that feed
-- the daily locker note. Additive only.

-- Birthday as MM-DD (no year — nobody has to share their age) and start date
-- as YYYY-MM-DD, both editable from the directory's Place panel.
alter table user_profiles add column if not exists birthday text;
alter table user_profiles add column if not exists start_date text;

-- One-sentence shout-outs from a coworker, delivered as the recipient's daily
-- locker note. seen_on is the business date a shout-out was featured; unseen
-- ones queue up one per day.
create table if not exists locker_shoutouts (
  id         text primary key,
  to_user    text not null,
  from_user  text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  seen_on    text
);

create index if not exists locker_shoutouts_to_idx
  on locker_shoutouts (to_user, seen_on, created_at);
