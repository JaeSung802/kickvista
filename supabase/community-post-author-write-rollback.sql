-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo community-post-author-write.sql (owner only).
-- Removes the guard trigger, its function and kv_soft_delete_own_post().
-- Posts already soft-deleted stay deleted (restore them from /admin/posts).
-- After this, regular authors can again change any column of their own
-- posts and hard-delete them directly, and the app's author delete only
-- works for moderators / admins.
-- ═══════════════════════════════════════════════════════════════════

begin;

drop trigger if exists community_posts_author_guard on public.community_posts;
drop function if exists public.kv_community_posts_author_guard();
drop function if exists public.kv_soft_delete_own_post(uuid);

do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.community_posts'::regclass
              and tgname = 'community_posts_author_guard') then
    raise exception 'guard trigger still present';
  end if;
  if to_regprocedure('public.kv_soft_delete_own_post(uuid)') is not null then
    raise exception 'kv_soft_delete_own_post still present';
  end if;
end
$$;

commit;
