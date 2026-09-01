-- Training Office / Professor studio.
-- viewStudio is the position toggle for who can walk into /studio.
-- Professor and Chancellor start with the office open.

update rbac_roles
set perms = replace(perms, '"manageTraining":true', '"manageTraining":true,"viewStudio":true')
where perms like '%"manageTraining":true%'
  and perms not like '%viewStudio%';

update rbac_roles
set perms = replace(perms, '"manageTraining":false', '"manageTraining":false,"viewStudio":false')
where perms like '%"manageTraining":false%'
  and perms not like '%viewStudio%';

update rbac_roles
set perms = replace(perms, '"editSite":true}', '"viewStudio":true,"editSite":true}')
where id in ('trainer', 'super-admin')
  and perms not like '%viewStudio%';
