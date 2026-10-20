-- ═══════════════════════════════════════════════════════════════════
-- KickVista: like / comment counters for every user (owner only).
-- Run AFTER community.sql, admin.sql, community-post-author-write.sql.
--
-- Why: the 4 counter trigger functions run with the caller's rights, so
-- their UPDATE of community_posts is filtered by RLS — a like or comment
-- by anyone but the post author (or a moderator) never reaches
-- like_count / comment_count.
--
-- 1. The 4 counter trigger functions keep their bodies (checked by md5)
--    and become SECURITY DEFINER with an empty search_path (the bodies
--    already use public.community_posts). They stay trigger functions:
--    nobody can call them directly, they only move a counter by 1 for the
--    row that fired them, and EXECUTE is revoked from the API roles.
--    Counting rules do not change: like_count = +1 per like row inserted,
--    -1 per like row deleted (never below 0); comment_count = +1 per
--    top-level comment inserted, -1 per top-level comment row deleted;
--    replies and soft delete / hide / restore of comments do not count.
--    The body md5 values below are the production ones (SQL Editor stores
--    bodies with LF line endings; the repo's community.sql is CRLF).
-- 2. New BEFORE INSERT guards on community_post_likes and
--    community_comments: an API caller who is not admin / moderator can
--    only like or comment on a post that is neither deleted nor hidden,
--    and a reply's parent must be a comment of the same post.
-- 3. New BEFORE UPDATE guards for the same callers: likes cannot be
--    updated at all (the app never does; RLS has no update policy), and a
--    comment author may change only the content — not post_id, parent_id,
--    author_id, like_count or the hidden / deleted fields (otherwise a
--    comment can be moved to another or a hidden post, turned into a reply
--    or back, or un-deleted, and the counters drift).
--
-- Changes no rows, no policy and no other function. Re-runnable.
-- Undo: community-counters-definer-rollback.sql.
-- Compatibility: after this file, re-running community-post-author-write.sql
-- stops at its precondition (its trigger-function check also matches the
-- guard below, which reads community_posts). To reinstall the author guard:
-- run this file's rollback, then community-post-author-write.sql, then this
-- file again.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  r record;
begin
  -- The 4 counter functions with the reviewed bodies, each used by its trigger.
  for r in
    select * from (values
      ('public.community_post_like_inc()',     'e7f0e49fa6c1e52874f4c8ae52bd7ea2', 'public.community_post_likes', 'community_post_likes_inc'),
      ('public.community_post_like_dec()',     '5263a1769e9c90363be240bb3e49bccf', 'public.community_post_likes', 'community_post_likes_dec'),
      ('public.community_comment_count_inc()', '0ee34174ef01eee5eefc9b731f038c8c', 'public.community_comments',   'community_comments_count_inc'),
      ('public.community_comment_count_dec()', '9dbf576275926021db6eecf2436287a1', 'public.community_comments',   'community_comments_count_dec')
    ) v(sig, body_md5, tbl, trg)
  loop
    if to_regprocedure(r.sig) is null then
      raise exception '% is missing', r.sig;
    end if;
    if (select md5(prosrc) from pg_proc where oid = to_regprocedure(r.sig)) <> r.body_md5 then
      raise exception '% body differs from the reviewed one; stop and review', r.sig;
    end if;
    if not exists (select 1 from pg_trigger t
                    where t.tgrelid = r.tbl::regclass and t.tgname = r.trg
                      and t.tgfoid = to_regprocedure(r.sig) and t.tgenabled = 'O') then
      raise exception 'trigger % on % does not use % (or is disabled)', r.trg, r.tbl, r.sig;
    end if;
    -- The definer must be able to update community_posts past RLS.
    if (select proowner from pg_proc where oid = to_regprocedure(r.sig))
       is distinct from (select relowner from pg_class where oid = 'public.community_posts'::regclass)
       and not (select rolbypassrls from pg_roles
                 where oid = (select proowner from pg_proc where oid = to_regprocedure(r.sig))) then
      raise exception '% is not owned by the community_posts owner', r.sig;
    end if;
  end loop;
  if (select relforcerowsecurity from pg_class where oid = 'public.community_posts'::regclass) then
    raise exception 'community_posts has FORCE ROW LEVEL SECURITY; review before using definer counters';
  end if;
  -- The app's view counter: the reviewed increment_post_view, callable by the API roles.
  if to_regprocedure('public.increment_post_view(uuid)') is null
     or (select md5(prosrc) from pg_proc where oid = 'public.increment_post_view(uuid)'::regprocedure) <> '6e7358bcdbe8d9ca61fc7e703e5f6692'
     or not (select prosecdef from pg_proc where oid = 'public.increment_post_view(uuid)'::regprocedure)
     or not has_function_privilege('anon', 'public.increment_post_view(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.increment_post_view(uuid)', 'execute') then
    raise exception 'increment_post_view(uuid) is not the reviewed SECURITY DEFINER version executable by anon / authenticated';
  end if;
  if to_regprocedure('public.get_my_role()') is null then
    raise exception 'public.get_my_role() is missing (admin.sql)';
  end if;
end
$$;

-- ─── 1. Counters with the owner's rights ─────────────────────────

alter function public.community_post_like_inc()     security definer set search_path = '';
alter function public.community_post_like_dec()     security definer set search_path = '';
alter function public.community_comment_count_inc() security definer set search_path = '';
alter function public.community_comment_count_dec() security definer set search_path = '';

revoke all on function public.community_post_like_inc()     from public, anon, authenticated;
revoke all on function public.community_post_like_dec()     from public, anon, authenticated;
revoke all on function public.community_comment_count_inc() from public, anon, authenticated;
revoke all on function public.community_comment_count_dec() from public, anon, authenticated;

-- ─── 2. Likes / comments only on visible posts (INSERT) ──────────

create or replace function public.kv_community_reaction_post_visible()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if coalesce(public.get_my_role() in ('admin', 'moderator'), false) then
    return new;
  end if;
  if not exists (select 1 from public.community_posts p
                  where p.id = new.post_id and p.deleted_at is null and p.is_hidden = false) then
    raise exception 'post not available' using errcode = '42501';
  end if;
  -- Separate IF: NEW of a like has no parent_id (plpgsql does not short-circuit AND).
  if tg_table_name = 'community_comments' then
    if new.parent_id is not null
       and not exists (select 1 from public.community_comments c
                        where c.id = new.parent_id and c.post_id = new.post_id) then
      raise exception 'the parent comment is not on this post' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.kv_community_reaction_post_visible() from public, anon, authenticated;

drop trigger if exists community_post_likes_visible_post on public.community_post_likes;
create trigger community_post_likes_visible_post
  before insert on public.community_post_likes
  for each row execute function public.kv_community_reaction_post_visible();

drop trigger if exists community_comments_visible_post on public.community_comments;
create trigger community_comments_visible_post
  before insert on public.community_comments
  for each row execute function public.kv_community_reaction_post_visible();

-- ─── 3. No moving / un-hiding of likes and comments (UPDATE) ─────

create or replace function public.kv_community_reaction_update_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_changed text[];
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if coalesce(public.get_my_role() in ('admin', 'moderator'), false) then
    return new;
  end if;
  if tg_table_name = 'community_post_likes' then
    raise exception 'likes cannot be changed; remove and add instead' using errcode = '42501';
  end if;
  select coalesce(array_agg(n.key), '{}')
    into v_changed
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
   where n.value is distinct from o.value;
  if v_changed <@ array['content', 'updated_at'] then
    return new;
  end if;
  raise exception 'only the comment text can be changed' using errcode = '42501';
end;
$$;

revoke all on function public.kv_community_reaction_update_guard() from public, anon, authenticated;

drop trigger if exists community_post_likes_update_guard on public.community_post_likes;
create trigger community_post_likes_update_guard
  before update on public.community_post_likes
  for each row execute function public.kv_community_reaction_update_guard();

drop trigger if exists community_comments_update_guard on public.community_comments;
create trigger community_comments_update_guard
  before update on public.community_comments
  for each row execute function public.kv_community_reaction_update_guard();

-- ─── Assertions ──────────────────────────────────────────────────

do $$
declare
  f text;
begin
  foreach f in array array['public.community_post_like_inc()', 'public.community_post_like_dec()',
                           'public.community_comment_count_inc()', 'public.community_comment_count_dec()'] loop
    if not (select prosecdef and proconfig = array['search_path=""'] from pg_proc where oid = f::regprocedure) then
      raise exception '% is not SECURITY DEFINER with an empty search_path', f;
    end if;
    if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
      raise exception 'an API role can still execute %', f;
    end if;
  end loop;
  if (select prosecdef from pg_proc where oid = 'public.kv_community_reaction_post_visible()'::regprocedure)
     or (select prosecdef from pg_proc where oid = 'public.kv_community_reaction_update_guard()'::regprocedure) then
    raise exception 'the reaction guards must run with the caller''s rights';
  end if;
  if (select count(*) from pg_trigger
       where tgname in ('community_post_likes_visible_post', 'community_comments_visible_post',
                        'community_post_likes_update_guard', 'community_comments_update_guard') and tgenabled = 'O') <> 4 then
    raise exception 'reaction guard triggers missing or disabled';
  end if;
end
$$;

commit;
