-- Visible copy only. The access_role id `trainer` and trainer_notes table stay as-is.
update rbac_roles
set name = 'Professor'
where id = 'trainer' and name = 'Trainer';

update quizzes
set intro = replace(intro, 'your trainer', 'your professor')
where intro like '%your trainer%';

update cms_settings
set value = replace(value, 'a trainer in earshot', 'a professor in earshot')
where key = 'pages' and value like '%a trainer in earshot%';

update cms_lessons
set body = replace(body, 'your trainer', 'your professor')
where body like '%your trainer%';

update cms_lessons
set body = replace(body, 'Trainer and Sales Manager', 'Professor and Sales Manager')
where body like '%Trainer and Sales Manager%';

update cms_lessons
set title = replace(title, 'Trainer day', 'Professor day')
where title like '%Trainer day%';
