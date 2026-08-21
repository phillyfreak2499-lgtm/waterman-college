-- Training visibility: a course can be marked visible to everyone ("All"),
-- shown in every path regardless of its home tab. Additive.

alter table cms_tracks add column if not exists visible_to_all boolean not null default false;
