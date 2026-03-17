-- ═══════════════════════════════════════════════════════════════════
-- KickVista Community Layer
-- Run this in the Supabase SQL editor AFTER the base schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── community_posts ──────────────────────────────────────────────

create table if not exists public.community_posts (
  id            uuid        primary key default gen_random_uuid(),
  author_id     uuid        not null references public.profiles (id) on delete cascade,
  category      text        not null check (category in (
    'match-discussion','transfer-news','tactics','highlights','predictions','general'
  )),
  title         text        not null check (char_length(title) between 5 and 120),
  content       text        not null check (char_length(content) >= 20),
  tags          text[]      not null default '{}',
  view_count    integer     not null default 0,
  like_count    integer     not null default 0,
  comment_count integer     not null default 0,
  is_pinned     boolean     not null default false,
  is_hot        boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists community_posts_author_idx
  on public.community_posts (author_id);
create index if not exists community_posts_category_idx
  on public.community_posts (category);
create index if not exists community_posts_created_idx
  on public.community_posts (created_at desc);
create index if not exists community_posts_hot_idx
  on public.community_posts (like_count desc, view_count desc);

-- ─── community_comments ───────────────────────────────────────────
-- parent_id IS NULL  → top-level comment
-- parent_id NOT NULL → reply to a comment (1-level deep)

create table if not exists public.community_comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts (id) on delete cascade,
  author_id  uuid        not null references public.profiles (id) on delete cascade,
  parent_id  uuid        references public.community_comments (id) on delete cascade,
  content    text        not null check (char_length(content) >= 1),
  like_count integer     not null default 0,
  is_deleted boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at asc);
create index if not exists community_comments_parent_idx
  on public.community_comments (parent_id);

-- ─── community_post_likes ─────────────────────────────────────────

create table if not exists public.community_post_likes (
  post_id    uuid        not null references public.community_posts (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ─── updated_at triggers ──────────────────────────────────────────
-- Reuses the set_updated_at() function from schema.sql

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

-- ─── comment_count maintenance ────────────────────────────────────
-- Only top-level comments (parent_id IS NULL) count toward the total.

create or replace function public.community_comment_count_inc()
returns trigger language plpgsql as $$
begin
  if new.parent_id is null then
    update public.community_posts
    set comment_count = comment_count + 1
    where id = new.post_id;
  end if;
  return new;
end;
$$;

create or replace function public.community_comment_count_dec()
returns trigger language plpgsql as $$
begin
  if old.parent_id is null then
    update public.community_posts
    set comment_count = greatest(0, comment_count - 1)
    where id = old.post_id;
  end if;
  return old;
end;
$$;

drop trigger if exists community_comments_count_inc on public.community_comments;
create trigger community_comments_count_inc
  after insert on public.community_comments
  for each row execute function public.community_comment_count_inc();

drop trigger if exists community_comments_count_dec on public.community_comments;
create trigger community_comments_count_dec
  after delete on public.community_comments
  for each row execute function public.community_comment_count_dec();

-- ─── like_count maintenance ───────────────────────────────────────

create or replace function public.community_post_like_inc()
returns trigger language plpgsql as $$
begin
  update public.community_posts
  set like_count = like_count + 1
  where id = new.post_id;
  return new;
end;
$$;

create or replace function public.community_post_like_dec()
returns trigger language plpgsql as $$
begin
  update public.community_posts
  set like_count = greatest(0, like_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists community_post_likes_inc on public.community_post_likes;
create trigger community_post_likes_inc
  after insert on public.community_post_likes
  for each row execute function public.community_post_like_inc();

drop trigger if exists community_post_likes_dec on public.community_post_likes;
create trigger community_post_likes_dec
  after delete on public.community_post_likes
  for each row execute function public.community_post_like_dec();

-- ─── Row Level Security ───────────────────────────────────────────

alter table public.community_posts      enable row level security;
alter table public.community_comments   enable row level security;
alter table public.community_post_likes enable row level security;

-- community_posts: anyone can read; only the author can write

create policy "community_posts: public read"
  on public.community_posts for select
  using (true);

create policy "community_posts: author insert"
  on public.community_posts for insert
  with check (auth.uid() = author_id);

create policy "community_posts: author update"
  on public.community_posts for update
  using (auth.uid() = author_id);

create policy "community_posts: author delete"
  on public.community_posts for delete
  using (auth.uid() = author_id);

-- community_comments: same rules

create policy "community_comments: public read"
  on public.community_comments for select
  using (true);

create policy "community_comments: author insert"
  on public.community_comments for insert
  with check (auth.uid() = author_id);

create policy "community_comments: author update"
  on public.community_comments for update
  using (auth.uid() = author_id);

create policy "community_comments: author delete"
  on public.community_comments for delete
  using (auth.uid() = author_id);

-- community_post_likes: anyone can read; user can only touch their own row

create policy "community_post_likes: public read"
  on public.community_post_likes for select
  using (true);

create policy "community_post_likes: owner insert"
  on public.community_post_likes for insert
  with check (auth.uid() = user_id);

create policy "community_post_likes: owner delete"
  on public.community_post_likes for delete
  using (auth.uid() = user_id);

-- ─── profiles: allow public read for community display ────────────
-- The existing RLS on profiles only allows users to read their own row.
-- We need anon/authenticated users to read nickname + avatar_url for post authors.

create policy "profiles: public read for community"
  on public.profiles for select
  using (true);
