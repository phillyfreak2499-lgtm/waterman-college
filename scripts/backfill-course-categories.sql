-- PROPOSED category backfill for the 17 live courses — NOT a migration.
--
-- This is the "Categories (proposed)" column from the COGS build spec, not a
-- decision. Edit it, then run it once by hand against cogs-db. It never runs on
-- deploy. Courses are matched by title because most live course ids exist only
-- in the database. Safe to re-run: it only adds links, never removes them.
--
-- GFA Introduction to Good Feet is left out on purpose (empty course).
-- Formats are not touched here: every course defaults to Read & Respond, and
-- the seven open rows (five slide-deck courses, 30-Day Onboarding, GFA) are set
-- in the course editors once decided.

insert into cms_track_categories (track_id, category_id)
select t.id, c.id
from (values
  ('30-Day Onboarding', 'Onboarding'),
  ('Client Experience', 'Client Experience'),
  ('Flow Training', 'Sales Process'),
  ('Product Training', 'Product Knowledge'),
  ('Culture', 'Culture'),
  ('Interview for Reality', 'Sales Process'),
  ('Working with Your Floor Leader', 'Sales Process'),
  ('Working with Your Floor Leader', 'Culture'),
  ('Building a Complete Solution', 'Sales Process'),
  ('Building a Complete Solution', 'Product Knowledge'),
  ('Building Non-Tangible Value', 'Sales Process'),
  ('Concept → Practice → Roleplay', 'Sales Process'),
  ('Architek Comfort Slip-On', 'Product Knowledge'),
  ('Peace of Mind 3', 'Product Knowledge'),
  ('Peace of Mind 3', 'Sales Process'),
  ('MIT Program', 'Leadership'),
  ('Management Development', 'Leadership'),
  ('CARE Field Guide', 'Client Experience'),
  ('CARE Field Guide', 'Leadership'),
  ('Using the Training Building Center', 'Operations')
) as proposal(course_title, category_label)
join cms_tracks t on lower(t.title) = lower(proposal.course_title)
join cms_categories c on lower(c.label) = lower(proposal.category_label)
on conflict do nothing;

-- Check: any live course still uncategorized?
select t.id, t.title
from cms_tracks t
where t.archived = false
  and not exists (select 1 from cms_track_categories tc where tc.track_id = t.id)
order by t.sort_order;
