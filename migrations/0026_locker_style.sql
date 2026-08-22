-- Locker personalization: an accent color key and up to three stickers,
-- chosen by the owner from curated sets. Additive only.

alter table user_profiles add column if not exists locker_accent text;
alter table user_profiles add column if not exists locker_stickers text;
