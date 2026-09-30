-- New Hire is a training path. Add it as an office role so People can assign
-- it directly. Sales Associate stays the Specialist path and still keeps the
-- New Hire door through access.ts resolveTabs().
insert into rbac_roles (id, name, description, locked, access_role, perms)
values (
  'new-hire',
  'New Hire',
  'First 30 days. New Hire door and 30-Day Onboarding.',
  false,
  'new-hires',
  '{"chancellor":false,"viewWhy":true,"viewHow":true,"viewTraining":true,"viewDirectory":true,"viewQuad":true,"viewRemarkable":true,"viewTeam":false,"trainNewHires":true,"trainSpecialist":false,"trainMit":false,"trainManagers":false,"manageUsers":false,"manageTraining":false,"editSite":false}'
)
on conflict (id) do nothing;
