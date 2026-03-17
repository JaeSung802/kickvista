-- ═══════════════════════════════════════════════════════════════════
-- KickVista Admin & Moderation Layer
-- Run in Supabase SQL editor AFTER schema.sql and community.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── Helper: get the current user's role ─────────────────────────
-- SECURITY DEFINER lets this function bypass RLS to read profiles.
-- Called inside RLS policies to keep per-row checks cheap.

create or replace function public.get_my_role()
returns text stable language sql security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'
  )
$$;

-- ─── profiles: add role and ban fields ───────────────────────────

alter table public.profiles
  add column if not exists role      text    not null default 'user'
    check (role in ('user', 'moderator', 'admin')),
  add column if not exists is_banned boolean not null default false;

create index if not exists profiles_role_idx
  on public.profiles (role)
  where role != 'user';

-- ─── community_posts: add moderation fields ──────────────────────

alter table public.community_posts
  add column if not exists deleted_at     timestamptz,
  add column if not exists deleted_by     uuid
    references public.profiles (id) on delete set null,
  add column if not exists delete_reason  text,
  add column if not exists is_hidden      boolean not null default false;

create index if not exists community_posts_deleted_idx
  on public.community_posts (deleted_at)
  where deleted_at is not null;

create index if not exists community_posts_hidden_idx
  on public.community_posts (is_hidden)
  where is_hidden = true;

-- ─── community_comments: add moderation fields ───────────────────

alter table public.community_comments
  add column if not exists deleted_at     timestamptz,
  add column if not exists deleted_by     uuid
    references public.profiles (id) on delete set null,
  add column if not exists delete_reason  text,
  add column if not exists is_hidden      boolean not null default false;

create index if not exists community_comments_deleted_idx
  on public.community_comments (deleted_at)
  where deleted_at is not null;

create index if not exists community_comments_hidden_idx
  on public.community_comments (is_hidden)
  where is_hidden = true;

-- ─── RLS: community_posts ─────────────────────────────────────────
-- Replace the original permissive public-read policy with one that
-- hides soft-deleted and hidden posts from regular users.
-- Moderators and admins can read everything.

drop policy if exists "community_posts: public read" on public.community_posts;
drop policy if exists "community_posts: visible read" on public.community_posts;

create policy "community_posts: visible read"
  on public.community_posts for select
  using (
    (is_hidden = false and deleted_at is null)
    or public.get_my_role() in ('admin', 'moderator')
  );

-- Allow moderators/admins to update any post (hide, soft-delete, restore,
-- change is_pinned / is_hot). The existing author-update policy is kept
-- so authors can still edit their own content.

drop policy if exists "community_posts: moderator update" on public.community_posts;

create policy "community_posts: moderator update"
  on public.community_posts for update
  using (public.get_my_role() in ('admin', 'moderator'));

-- ─── RLS: community_comments ─────────────────────────────────────
-- Same pattern as posts.

drop policy if exists "community_comments: public read" on public.community_comments;
drop policy if exists "community_comments: visible read" on public.community_comments;

create policy "community_comments: visible read"
  on public.community_comments for select
  using (
    (is_hidden = false and deleted_at is null and is_deleted = false)
    or public.get_my_role() in ('admin', 'moderator')
  );

drop policy if exists "community_comments: moderator update" on public.community_comments;

create policy "community_comments: moderator update"
  on public.community_comments for update
  using (public.get_my_role() in ('admin', 'moderator'));

-- ─── RLS: profiles — admin role management ───────────────────────
-- Admins can update any profile's role and ban status.
-- The existing "profiles: owner update" policy keeps self-service
-- profile editing working for regular users.

drop policy if exists "profiles: admin update" on public.profiles;

create policy "profiles: admin update"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- ─── Set your first admin ─────────────────────────────────────────
-- After running this file, promote yourself to admin in the SQL editor:
--
--   update public.profiles
--   set role = 'admin'
--   where id = '<your-auth-user-uuid>';
--
-- Find your UUID under Authentication → Users in the Supabase dashboard.
-- ═══════════════════════════════════════════════════════════════════
