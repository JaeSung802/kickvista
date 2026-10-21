-- ═══════════════════════════════════════════════════════════════════
-- KickVista: authors delete their own comments / replies (owner only).
-- Run AFTER community.sql, admin.sql and community-counters-definer.sql.
--
-- 1. kv_soft_delete_own_comment(comment_id): the signed-in author marks
--    their own comment or reply as deleted (is_deleted, deleted_at,
--    deleted_by = auth.uid()). Nothing else is written; the text stays in
--    the table for moderators (admin restore keeps working). A direct
--    update cannot do this (the comment update guard allows only the text,
--    and the read policy hides deleted rows). Returns 'deleted' /
--    'already_deleted' / 'not_found' (missing, someone else's, or hidden by
--    a moderator). The row is locked first, so repeated or parallel calls
--    give one 'deleted' and then 'already_deleted'.
-- 2. kv_list_post_comments(post_id): the comment thread of a post the
--    caller may see (deleted / hidden posts only for moderators). Deleted or
--    hidden comments stay in place with removed = 'deleted' / 'hidden' and
--    no text, author or likes, so replies keep their parent and the list
--    matches comment_count (all top-level rows, any state; replies never
--    count). Visible comments come back as before.
-- 3. BEFORE DELETE guard on community_comments: API callers who are not
--    admin / moderator cannot hard-delete a comment (parent_id is ON DELETE
--    CASCADE, so a hard delete would also remove the replies and move
--    comment_count). Cascades from deleting a post or profile, service_role
--    and the owner are not affected.
--
-- Rights (checked at the end as effective EXECUTE, PUBLIC entry included):
--   kv_soft_delete_own_comment  authenticated only (not anon / service_role)
--   kv_list_post_comments       anon and authenticated (not service_role)
--   guard function              no API role
-- Supabase's default privileges also grant EXECUTE on new functions to
-- service_role, so every grant is revoked first and then given back.
-- Existing objects: each function carries a kickvista marker comment. The
-- file stops (changing nothing) if a function with one of these names has
-- another signature or no / another marker, or if a trigger with the guard's
-- name on community_comments uses another function.
--
-- comment_count does not change on a soft delete (current counting rule).
-- Changes no rows and no policy. Re-runnable.
-- Undo: community-comment-author-delete-rollback.sql.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'community_comments'
         and column_name in ('id', 'post_id', 'author_id', 'parent_id', 'content', 'like_count',
                             'is_deleted', 'deleted_at', 'deleted_by', 'is_hidden', 'created_at')) <> 11 then
    raise exception 'community_comments lacks a column used here (community.sql / admin.sql)';
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'community_posts'
         and column_name in ('deleted_at', 'is_hidden')) <> 2 then
    raise exception 'community_posts lacks deleted_at / is_hidden (admin.sql)';
  end if;
  if to_regprocedure('public.get_my_role()') is null then
    raise exception 'public.get_my_role() is missing (admin.sql)';
  end if;
end
$$;

-- Never replace someone else's object with the same name.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('kv_soft_delete_own_comment',         'p_comment_id uuid', 'kickvista:community-comment-author-delete:delete-rpc'),
      ('kv_list_post_comments',              'p_post_id uuid',    'kickvista:community-comment-author-delete:list-rpc'),
      ('kv_community_comments_delete_guard', '',                  'kickvista:community-comment-author-delete:delete-guard')
    ) v(name, args, marker)
  loop
    if exists (select 1 from pg_proc p
                where p.pronamespace = 'public'::regnamespace and p.proname = r.name
                  and (pg_get_function_identity_arguments(p.oid) <> r.args
                       or obj_description(p.oid, 'pg_proc') is distinct from r.marker)) then
      raise exception 'public.% already exists with another signature or without this file''s marker; nothing changed', r.name;
    end if;
  end loop;
  if exists (select 1 from pg_trigger t
              where t.tgrelid = 'public.community_comments'::regclass and t.tgname = 'community_comments_delete_guard'
                and t.tgfoid is distinct from to_regprocedure('public.kv_community_comments_delete_guard()')) then
    raise exception 'trigger community_comments_delete_guard exists with another function; nothing changed';
  end if;
end
$$;

-- ─── 1. Author soft delete ───────────────────────────────────────

create or replace function public.kv_soft_delete_own_comment(p_comment_id uuid)
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

  select c.author_id, c.is_deleted, c.deleted_at, c.is_hidden
    into v_row
    from public.community_comments c
   where c.id = p_comment_id
   for update;

  -- Other people's comments and comments hidden by moderators look like missing ones.
  if not found or v_row.author_id is distinct from v_uid or v_row.is_hidden then
    return 'not_found';
  end if;
  if v_row.is_deleted or v_row.deleted_at is not null then
    return 'already_deleted';
  end if;

  update public.community_comments
     set is_deleted = true, deleted_at = now(), deleted_by = v_uid
   where id = p_comment_id;
  return 'deleted';
end;
$$;

revoke all on function public.kv_soft_delete_own_comment(uuid) from public, anon, authenticated, service_role;
grant execute on function public.kv_soft_delete_own_comment(uuid) to authenticated;

comment on function public.kv_soft_delete_own_comment(uuid) is
  'kickvista:community-comment-author-delete:delete-rpc';

-- ─── 2. Thread with placeholders for removed comments ────────────

create or replace function public.kv_list_post_comments(p_post_id uuid)
returns table (
  id uuid,
  parent_id uuid,
  removed text,
  content text,
  like_count integer,
  created_at timestamptz,
  author_id uuid,
  author_nickname text,
  author_points integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with viewer as (
    select coalesce(public.get_my_role() in ('admin', 'moderator'), false) as is_mod
  ),
  visible_post as (
    select p.id
      from public.community_posts p, viewer v
     where p.id = p_post_id
       and ((p.deleted_at is null and p.is_hidden = false) or v.is_mod)
  ),
  thread as (
    select c.id, c.parent_id, c.content, c.like_count, c.created_at, c.author_id,
           case when c.is_deleted or c.deleted_at is not null then 'deleted'
                when c.is_hidden then 'hidden' end as removed
      from public.community_comments c
      join visible_post vp on vp.id = c.post_id
  )
  select t.id, t.parent_id, t.removed,
         case when t.removed is null then t.content end,
         case when t.removed is null then t.like_count else 0 end,
         t.created_at,
         case when t.removed is null then t.author_id end,
         case when t.removed is null then pr.nickname end,
         case when t.removed is null then pr.total_points end
    from thread t
    left join public.profiles pr on pr.id = t.author_id
   order by t.created_at, t.id;
$$;

revoke all on function public.kv_list_post_comments(uuid) from public, anon, authenticated, service_role;
grant execute on function public.kv_list_post_comments(uuid) to anon, authenticated;

comment on function public.kv_list_post_comments(uuid) is
  'kickvista:community-comment-author-delete:list-rpc';

-- ─── 3. No hard delete of comments by API callers ────────────────

create or replace function public.kv_community_comments_delete_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return old;
  end if;
  if coalesce(public.get_my_role() in ('admin', 'moderator'), false) then
    return old;
  end if;
  raise exception 'comments are deleted with kv_soft_delete_own_comment()' using errcode = '42501';
end;
$$;

revoke all on function public.kv_community_comments_delete_guard() from public, anon, authenticated, service_role;

comment on function public.kv_community_comments_delete_guard() is
  'kickvista:community-comment-author-delete:delete-guard';

drop trigger if exists community_comments_delete_guard on public.community_comments;
create trigger community_comments_delete_guard
  before delete on public.community_comments
  for each row execute function public.kv_community_comments_delete_guard();

-- ─── Assertions ──────────────────────────────────────────────────

do $$
declare
  r record;
  v_role text;
  v_has boolean;
begin
  -- Effective EXECUTE (grants, PUBLIC and inherited memberships) must be exactly as intended.
  for r in
    select * from (values
      ('public.kv_soft_delete_own_comment(uuid)',     array['authenticated']),
      ('public.kv_list_post_comments(uuid)',          array['anon', 'authenticated']),
      ('public.kv_community_comments_delete_guard()', array[]::text[])
    ) v(sig, allowed)
  loop
    foreach v_role in array array['anon', 'authenticated', 'service_role', 'authenticator'] loop
      continue when to_regrole(v_role) is null;
      v_has := has_function_privilege(v_role, r.sig, 'execute');
      if v_has is distinct from (v_role = any (r.allowed)) then
        raise exception '% has EXECUTE = % on % (expected %)', v_role, v_has, r.sig, v_role = any (r.allowed);
      end if;
    end loop;
    if exists (select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                where p.oid = r.sig::regprocedure and a.grantee = 0) then
      raise exception 'PUBLIC still has a grant on %', r.sig;
    end if;
  end loop;
  if exists (select 1 from pg_proc
              where oid in ('public.kv_soft_delete_own_comment(uuid)'::regprocedure, 'public.kv_list_post_comments(uuid)'::regprocedure)
                and not (prosecdef and proconfig = array['search_path=""'])) then
    raise exception 'the two RPCs must be SECURITY DEFINER with an empty search_path';
  end if;
  if (select prosecdef or proconfig is distinct from array['search_path=""'] from pg_proc
       where oid = 'public.kv_community_comments_delete_guard()'::regprocedure) then
    raise exception 'the delete guard must run with the caller''s rights and an empty search_path';
  end if;
  if not exists (select 1 from pg_trigger
                  where tgrelid = 'public.community_comments'::regclass and tgname = 'community_comments_delete_guard'
                    and tgfoid = 'public.kv_community_comments_delete_guard()'::regprocedure and tgenabled = 'O') then
    raise exception 'delete guard trigger missing, disabled or linked to another function';
  end if;
end
$$;

commit;
