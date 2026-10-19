-- ═══════════════════════════════════════════════════════════════════
-- KickVista: author edit / delete of community posts (owner only).
-- Run AFTER community.sql, notice-rls.sql / notices.sql and admin.sql.
--
-- 1. kv_soft_delete_own_post(post_id): the author soft-deletes their own
--    post (deleted_at / deleted_by, like the admin delete). A direct update
--    cannot do this: the read policy hides deleted rows, so the new row
--    fails RLS (42501). Notices also need the admin role. Returns
--    'deleted' / 'already_deleted' / 'not_found' / 'forbidden'.
-- 2. Guard trigger for API callers (anon / authenticated) whose role is
--    not admin / moderator (a NULL role counts as a regular user):
--    - a direct UPDATE may change only title, content, category and tags,
--      or add exactly 1 to view_count (what getPost() and
--      increment_post_view() do); author_id, like/comment counts, pin/hot,
--      hidden/deleted fields, team/league, image, created_at stay as they
--      are;
--    - an UPDATE from inside another trigger (the like / comment counter
--      triggers, which run with the caller's rights) may change only
--      like_count / comment_count by at most 1;
--    - DELETE (hard delete) is refused; deleting goes through (1).
--    Moderators / admins keep their current rights (moderation tools);
--    service_role and SECURITY DEFINER functions owned by the owner
--    (current_user is not anon / authenticated) are not affected.
--    The install stops if a trigger function other than the 4 known
--    counters writes community_posts (review it first).
--
-- Changes no rows and no policy. Re-runnable. Undo with
-- community-post-author-write-rollback.sql.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.community_posts') is null then
    raise exception 'public.community_posts is missing';
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'community_posts'
         and column_name in ('author_id', 'category', 'deleted_at', 'deleted_by', 'is_hidden')) <> 5 then
    raise exception 'community_posts lacks author_id / category / deleted_at / deleted_by / is_hidden (admin.sql)';
  end if;
  if to_regprocedure('public.get_my_role()') is null then
    raise exception 'public.get_my_role() is missing (admin.sql)';
  end if;
  -- Trigger functions that mention community_posts (other than this guard)
  -- must be the 4 known counters; anything else needs a review first.
  if exists (
    select 1
      from pg_trigger t join pg_proc p on p.oid = t.tgfoid
     where not t.tgisinternal
       and p.prosrc ilike '%community_posts%'
       and p.oid is distinct from to_regprocedure('public.kv_community_posts_author_guard()')
       and p.proname not in ('community_comment_count_inc', 'community_comment_count_dec',
                             'community_post_like_inc', 'community_post_like_dec')
  ) then
    raise exception 'an unknown trigger function writes community_posts; review it before installing the guard';
  end if;
end
$$;

-- ─── 1. Author soft delete ───────────────────────────────────────

create or replace function public.kv_soft_delete_own_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select p.author_id, p.category, p.deleted_at, p.is_hidden
    into v_row
    from public.community_posts p
   where p.id = p_post_id
   for update;

  -- Other people's posts and posts hidden by moderators look like missing ones.
  if not found or v_row.author_id is distinct from v_uid or v_row.is_hidden then
    return 'not_found';
  end if;
  if v_row.deleted_at is not null then
    return 'already_deleted';
  end if;
  if v_row.category = 'notice' and public.get_my_role() is distinct from 'admin' then
    return 'forbidden';
  end if;

  update public.community_posts
     set deleted_at = now(), deleted_by = v_uid
   where id = p_post_id;
  return 'deleted';
end;
$$;

revoke all on function public.kv_soft_delete_own_post(uuid) from public, anon;
grant execute on function public.kv_soft_delete_own_post(uuid) to authenticated;

comment on function public.kv_soft_delete_own_post(uuid) is
  'kickvista:community-post-author-write — author soft delete of their own post';

-- ─── 2. Column / hard-delete guard for non-moderator API callers ─

create or replace function public.kv_community_posts_author_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_changed text[];
begin
  -- service_role, the owner and SECURITY DEFINER functions owned by it pass.
  if current_user not in ('anon', 'authenticated') then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  -- Moderators / admins keep their tools; a NULL role is not one of them.
  if coalesce(public.get_my_role() in ('admin', 'moderator'), false) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'posts are deleted with kv_soft_delete_own_post()' using errcode = '42501';
  end if;

  select coalesce(array_agg(n.key), '{}')
    into v_changed
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
   where n.value is distinct from o.value;

  if pg_trigger_depth() > 1 then
    -- Counter triggers: like_count / comment_count, one step at a time.
    if v_changed <@ array['like_count', 'comment_count', 'updated_at']
       and abs(coalesce(new.like_count, 0) - coalesce(old.like_count, 0)) <= 1
       and abs(coalesce(new.comment_count, 0) - coalesce(old.comment_count, 0)) <= 1 then
      return new;
    end if;
    raise exception 'a nested update may only move like_count / comment_count by 1' using errcode = '42501';
  end if;

  if v_changed <@ array['title', 'content', 'category', 'tags', 'updated_at'] then
    return new;
  end if;
  if v_changed <@ array['view_count', 'updated_at']
     and new.view_count = coalesce(old.view_count, 0) + 1 then
    return new;
  end if;
  raise exception 'only title, content, category and tags can be changed' using errcode = '42501';
end;
$$;

revoke all on function public.kv_community_posts_author_guard() from public, anon, authenticated;

drop trigger if exists community_posts_author_guard on public.community_posts;
create trigger community_posts_author_guard
  before update or delete on public.community_posts
  for each row execute function public.kv_community_posts_author_guard();

-- ─── Assertions ──────────────────────────────────────────────────

do $$
begin
  if not has_function_privilege('authenticated', 'public.kv_soft_delete_own_post(uuid)', 'execute') then
    raise exception 'authenticated cannot execute kv_soft_delete_own_post';
  end if;
  if has_function_privilege('anon', 'public.kv_soft_delete_own_post(uuid)', 'execute') then
    raise exception 'anon can execute kv_soft_delete_own_post';
  end if;
  if not (select prosecdef from pg_proc where oid = 'public.kv_soft_delete_own_post(uuid)'::regprocedure) then
    raise exception 'kv_soft_delete_own_post is not SECURITY DEFINER';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.kv_community_posts_author_guard()'::regprocedure) then
    raise exception 'the guard must run with the caller''s rights';
  end if;
  if not exists (select 1 from pg_trigger
                  where tgrelid = 'public.community_posts'::regclass
                    and tgname = 'community_posts_author_guard' and tgenabled = 'O') then
    raise exception 'guard trigger missing or disabled';
  end if;
end
$$;

commit;
