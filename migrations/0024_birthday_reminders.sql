-- Day-before birthday reminders: one ledger row per (day, birthday person)
-- claims the send, so the sweep can run from any request without duplicate
-- notifications. Additive only.

create table if not exists birthday_reminder_ledger (
  day           text not null,
  birthday_user text not null,
  created_at    timestamptz not null default now(),
  primary key (day, birthday_user)
);
