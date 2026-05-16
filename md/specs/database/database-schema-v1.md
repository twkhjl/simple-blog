Database Schema v1

1. 文件目的

本文件定義 Blog 系統 v1 的資料庫實作細節，包含：

- table schema
- constraint
- index
- RLS policy
- trigger
- seed / bootstrap 規則
- migration 建立順序

本文件對應主規格：

`md/specs/overview/Blog 系統開發規格 v1.md`

2. v1 實際建立表

- `profiles`
- `posts`
- `files`

3. Schema

3.1 profiles

用途：

- 保存登入使用者的業務資料
- 補足 `auth.users` 之外的角色與狀態資訊

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_key text,
  role text not null default 'user' check (role in ('user', 'editor', 'admin', 'super_admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

3.2 posts

用途：

- 保存文章主資料

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_key text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  author_id uuid not null references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_published_rule check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
    or (status = 'archived' and published_at is not null)
  )
);

create index idx_posts_status on public.posts(status);
create index idx_posts_published_at on public.posts(published_at desc);
create index idx_posts_author_id on public.posts(author_id);
create index idx_posts_updated_at on public.posts(updated_at desc);
```

3.3 files

用途：

- 保存 R2 上傳檔案 metadata

```sql
create table public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  r2_key text not null unique,
  original_name text,
  mime_type text not null,
  size_bytes integer not null,
  visibility text not null default 'public' check (visibility in ('public')),
  created_at timestamptz not null default now()
);

create index idx_files_owner_id on public.files(owner_id);
create index idx_files_created_at on public.files(created_at desc);
```

4. RLS 規格

4.1 原則

- 所有 v1 表皆開啟 RLS
- 前端不直接使用 anon key 對業務表做 CRUD
- Worker 使用 `service_role_key` 執行業務資料操作
- RLS 主要作為防呆與未來擴充保護

4.2 profiles policies

最低需求：

- authenticated user 可讀取自己的 profile
- authenticated user 可更新自己的 `display_name` 與 `avatar_key`
- 不允許一般使用者直接修改自己的 `role` 與 `status`

示意：

```sql
alter table public.profiles enable row level security;

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
```

備註：

- 欄位級限制仍建議在 Worker 實作

4.3 posts policies

最低需求：

- public / anon 不直接查表
- authenticated user 不直接寫表
- 實務上由 Worker 使用 service role 存取

示意：

```sql
alter table public.posts enable row level security;
```

4.4 files policies

最低需求：

- authenticated user 不直接寫表
- 實務上由 Worker 使用 service role 存取

示意：

```sql
alter table public.files enable row level security;
```

5. Trigger 規格

5.1 profiles 自動建立 trigger

目的：

- `auth.users` 新增帳號後，自動建立對應 `public.profiles`

規則：

- `id = auth.users.id`
- `email = auth.users.email`
- `display_name = null`
- `role = 'user'`
- `status = 'active'`
- trigger 失敗時，中止該次註冊流程

示意：

```sql
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    role,
    status
  )
  values (
    new.id,
    new.email,
    null,
    'user',
    'active'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();
```

5.2 updated_at 維護 trigger

目的：

- `profiles`、`posts` 更新時自動刷新 `updated_at`

示意：

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row execute procedure public.set_updated_at();
```

6. Seed / Bootstrap 規格

6.1 第一個 super_admin

做法：

1. 先由前台正常註冊帳號
2. 由管理者在 Supabase SQL Editor 執行：

```sql
update public.profiles
set role = 'super_admin'
where email = 'your-admin@example.com';
```

6.2 seed 原則

- v1 不預設大量假資料
- `seed.sql` 至少可放一筆測試文章與一筆測試檔案 metadata
- 正式環境不自動執行 seed

7. Migration 建立順序

建議順序：

1. 建立 extensions
2. 建立 `profiles`
3. 建立 `posts`
4. 建立 `files`
5. 建立 indexes
6. 啟用 RLS
7. 建立 policies
8. 建立 triggers
9. 手動提升第一個 `super_admin`

8. v2 預留表

以下表不在 v1 建立：

- `categories`
- `post_categories`
- `tags`
- `post_tags`
- `comments`
