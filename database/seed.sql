update public.profiles
set role = 'super_admin'
where email = 'admin@demo.invalid';

insert into public.admin_accounts (user_id, username, display_name, is_active)
select id, 'admin', 'Admin Account', true
from public.profiles
where email = 'admin@demo.invalid'
on conflict (user_id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    is_active = excluded.is_active;

insert into public.tags (name, slug, status)
values
  ('Launch', 'launch', 'active'),
  ('Vue', 'vue', 'active'),
  ('Release', 'release', 'active'),
  ('Legacy', 'legacy', 'disabled')
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status;

