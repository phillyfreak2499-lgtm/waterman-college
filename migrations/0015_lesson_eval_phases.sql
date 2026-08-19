-- Tag lessons with presentation-eval phases for automatic training suggestions.
-- Lessons stay on their track (door); tags only control which weak phase can recommend them.

alter table cms_lessons
  add column if not exists eval_phases text[] not null default '{}';

create index if not exists cms_lessons_eval_phases_idx
  on cms_lessons using gin (eval_phases);

-- Seed default phase tags for existing specialist lessons (only if still empty).
-- Lessons remain on their track/door; tags only drive Locker suggestions.

update cms_lessons set eval_phases = array['welcome']
  where id in ('client-experience:the-room') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['welcome','fitting']
  where id in ('flow:door-to-door') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['interview','close']
  where id in ('client-experience:two-quiet-fears') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['interview']
  where id in ('client-experience:listen-first') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['analysis']
  where id in ('flow:digital-scanner') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['analysis','solution']
  where id in ('product:arch-supports') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['fitting','solution']
  where id in ('product:trusted-advisor') and (eval_phases is null or eval_phases = '{}');

update cms_lessons set eval_phases = array['close']
  where id in ('flow:consistent-close') and (eval_phases is null or eval_phases = '{}');
