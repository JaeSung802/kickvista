-- ═══════════════════════════════════════════════════════════════════
-- KickVista Notice System — Admin RLS Migration
-- Run in the Supabase SQL editor AFTER community.sql.
--
-- Assumes profiles.role column exists (added by roles migration).
-- If the column doesn't exist yet, run this first:
--   alter table public.profiles add column if not exists role text not null default 'user';
-- ═══════════════════════════════════════════════════════════════════

-- ─── Step 1: Extend category CHECK constraint ─────────────────────
-- Only needed if you applied the OLD community.sql without 'notice'.
-- Skip if community.sql already includes 'notice' in the check.

-- alter table public.community_posts
--   drop constraint community_posts_category_check;
-- alter table public.community_posts
--   add constraint community_posts_category_check
--   check (category in (
--     'match-discussion','transfer-news','tactics',
--     'highlights','predictions','general','notice'
--   ));

-- ─── Step 2: Ensure profiles has a role column ────────────────────

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user','moderator','admin'));

-- ─── Step 3: Admin-only write for notice category ─────────────────
-- Helper: returns true when the caller is an admin
-- (avoids repeating the subquery in every policy)

create or replace function public.is_admin()
returns boolean
security definer
set search_path = public
language sql stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ─── Step 4: Replace community_posts write policies ───────────────
-- The new policies allow any authenticated author to write regular
-- posts, but restrict 'notice' posts to admins only.

drop policy if exists "community_posts: author insert" on public.community_posts;
create policy "community_posts: author insert"
  on public.community_posts for insert
  with check (
    auth.uid() = author_id
    AND (category <> 'notice' OR public.is_admin())
  );

drop policy if exists "community_posts: author update" on public.community_posts;
create policy "community_posts: author update"
  on public.community_posts for update
  using (
    auth.uid() = author_id
    AND (category <> 'notice' OR public.is_admin())
  );

drop policy if exists "community_posts: author delete" on public.community_posts;
create policy "community_posts: author delete"
  on public.community_posts for delete
  using (
    auth.uid() = author_id
    AND (category <> 'notice' OR public.is_admin())
  );

-- ─── Summary ──────────────────────────────────────────────────────
-- SELECT  → all users (existing "community_posts: public read" policy)
-- INSERT  → authenticated users for non-notice; admin-only for notice
-- UPDATE  → same
-- DELETE  → same
--
-- To grant admin role to a user:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';
