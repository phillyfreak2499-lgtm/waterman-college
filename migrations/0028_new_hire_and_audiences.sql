-- New Hire office role, Specialist label, and multi-role course audiences.

insert into rbac_roles (id, name, description, locked, access_role, perms)
values (
  'new-hire',
  'New Hire',
  'First 30 days. Locker and 30-Day Onboarding only.',
  false,
  'new-hires',
  '{"chancellor":false,"viewWhy":false,"viewHow":false,"viewTraining":true,"viewDirectory":false,"viewQuad":false,"viewRemarkable":false,"viewTeam":false,"trainNewHires":true,"trainSpecialist":false,"trainMit":false,"trainManagers":false,"manageUsers":false,"manageTraining":false,"editSite":false}'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  access_role = excluded.access_role,
  perms = excluded.perms;

update rbac_roles
set name = 'Specialist',
    description = 'Specialist path and the floor.'
where id = 'sales-associate';

alter table cms_tracks add column if not exists audience_roles text;
