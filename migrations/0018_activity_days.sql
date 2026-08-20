-- Practice streaks: one row per user per active calendar day (business zone).
-- Additive only. Written once a day per user by touchActivity().

create table if not exists user_activity_days (
  user_id text not null,
  day     date not null,
  primary key (user_id, day)
);

create index if not exists user_activity_days_user_idx
  on user_activity_days (user_id, day desc);
