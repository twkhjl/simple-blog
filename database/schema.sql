create extension if not exists pgcrypto;
create extension if not exists citext;

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

create table public.admin_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tags_status on public.tags(status);
create index idx_tags_name on public.tags(name);

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id),
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create index idx_post_tags_tag_id on public.post_tags(tag_id);

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

create table public.front_login_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  login_identifier text not null,
  result text not null check (result in ('success', 'failure')),
  failure_reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_front_login_records_user_created_at on public.front_login_records(user_id, created_at desc);
create index idx_front_login_records_created_at on public.front_login_records(created_at desc);

create table public.admin_login_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  login_identifier text not null,
  result text not null check (result in ('success', 'failure')),
  failure_reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_admin_login_records_user_created_at on public.admin_login_records(user_id, created_at desc);
create index idx_admin_login_records_created_at on public.admin_login_records(created_at desc);

