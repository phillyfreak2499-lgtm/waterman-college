-- Directory: regular days off per person, shown small on their card so a
-- caller can check before ringing. Free text (e.g. "Sun & Wed").
-- Additive only.

alter table user_profiles add column if not exists days_off text;
