-- Resource links for tagged lesson lines.
--
-- Lesson bodies contain tagged lines such as
--   "GFA · MedMassager Products. VIDEO · Dr. Mehta on the tablet."
--   "ROLEPLAY · Balance Demonstration."
--   "SOLUTION · Restate why all three supports are needed."
-- Those tags rendered as inert brass labels, so a Specialist had no way to
-- reach the thing the line names. This table attaches a destination URL to an
-- individual tagged line.
--
-- Keyed by `line_key` rather than the line's position, so re-ordering or
-- editing surrounding paragraphs does not silently move a link onto the wrong
-- line. See `lessonLineKey()` in src/lib/lesson-links.ts for how it is derived
-- (tag + normalised first words of the line).

create table if not exists lesson_links (
  track_id    text not null,
  lesson_slug text not null,
  line_key    text not null,
  tag         text not null,
  label       text not null default '',
  url         text not null,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  primary key (track_id, lesson_slug, line_key)
);

-- The learner view loads every link for one lesson at a time.
create index if not exists lesson_links_lesson_idx
  on lesson_links (track_id, lesson_slug);
