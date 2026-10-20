-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo community-counters-definer.sql (owner only).
-- The 4 counter functions run with the caller's rights again (only likes /
-- comments by the post author or a moderator reach the counters) and the
-- insert / update guards on likes / comments are removed. Bodies are untouched.
-- EXECUTE goes back to PUBLIC (the default for a new function); exact
-- grantees and grantors may differ from the original ACL. Counter values
-- written meanwhile stay as they are.
-- ═══════════════════════════════════════════════════════════════════

begin;

drop trigger if exists community_post_likes_visible_post on public.community_post_likes;
drop trigger if exists community_comments_visible_post on public.community_comments;
drop trigger if exists community_post_likes_update_guard on public.community_post_likes;
drop trigger if exists community_comments_update_guard on public.community_comments;
drop function if exists public.kv_community_reaction_post_visible();
drop function if exists public.kv_community_reaction_update_guard();

alter function public.community_post_like_inc()     security invoker reset search_path;
alter function public.community_post_like_dec()     security invoker reset search_path;
alter function public.community_comment_count_inc() security invoker reset search_path;
alter function public.community_comment_count_dec() security invoker reset search_path;

grant execute on function public.community_post_like_inc()     to public;
grant execute on function public.community_post_like_dec()     to public;
grant execute on function public.community_comment_count_inc() to public;
grant execute on function public.community_comment_count_dec() to public;

do $$
begin
  if exists (select 1 from pg_proc
              where oid in ('public.community_post_like_inc()'::regprocedure, 'public.community_post_like_dec()'::regprocedure,
                            'public.community_comment_count_inc()'::regprocedure, 'public.community_comment_count_dec()'::regprocedure)
                and (prosecdef or proconfig is not null)) then
    raise exception 'a counter function is still SECURITY DEFINER or has a search_path';
  end if;
  if exists (select 1 from pg_trigger where tgname in ('community_post_likes_visible_post', 'community_comments_visible_post',
                                                      'community_post_likes_update_guard', 'community_comments_update_guard')) then
    raise exception 'reaction guard triggers still present';
  end if;
end
$$;

commit;
