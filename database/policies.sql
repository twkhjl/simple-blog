alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.files enable row level security;

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

revoke all on public.profiles from anon, authenticated;
revoke all on public.posts from anon, authenticated;
revoke all on public.files from anon, authenticated;

grant select, update(display_name, avatar_key) on public.profiles to authenticated;

