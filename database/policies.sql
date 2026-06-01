alter table public.profiles enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.posts enable row level security;
alter table public.files enable row level security;
alter table public.front_login_records enable row level security;
alter table public.admin_login_records enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own_safe_fields"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admin_accounts_select_own"
on public.admin_accounts
for select
to authenticated
using (auth.uid() = user_id);

create policy "front_login_records_select_own"
on public.front_login_records
for select
to authenticated
using (auth.uid() = user_id);

create policy "admin_login_records_select_own"
on public.admin_login_records
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.admin_accounts from anon, authenticated;
revoke all on public.posts from anon, authenticated;
revoke all on public.files from anon, authenticated;
revoke all on public.front_login_records from anon, authenticated;
revoke all on public.admin_login_records from anon, authenticated;

grant select, update(display_name, avatar_key) on public.profiles to authenticated;
grant select(username, display_name, is_active) on public.admin_accounts to authenticated;
grant select on public.front_login_records to authenticated;
grant select on public.admin_login_records to authenticated;

