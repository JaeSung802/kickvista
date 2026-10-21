-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo community-comment-author-delete.sql (owner only).
-- Removes the hard-delete guard, kv_list_post_comments() and
-- kv_soft_delete_own_comment() — but only objects that carry this file's
-- markers: if a function with one of these names has another signature or
-- marker, or the trigger uses another function, it stops and changes
-- nothing. Comments already soft-deleted stay deleted (restore them from
-- /admin/comments). After this, comment authors can again hard-delete their
-- own comments through the API (taking replies with them), and the app
-- falls back to the old comment list, where a deleted parent hides its
-- replies.
-- ═══════════════════════════════════════════════════════════════════

begin;

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
      raise exception 'public.% is not the object created by community-comment-author-delete.sql; nothing changed', r.name;
    end if;
  end loop;
  if exists (select 1 from pg_trigger t
              where t.tgrelid = 'public.community_comments'::regclass and t.tgname = 'community_comments_delete_guard'
                and t.tgfoid is distinct from to_regprocedure('public.kv_community_comments_delete_guard()')) then
    raise exception 'trigger community_comments_delete_guard uses another function; nothing changed';
  end if;
end
$$;

drop trigger if exists community_comments_delete_guard on public.community_comments;
drop function if exists public.kv_community_comments_delete_guard();
drop function if exists public.kv_list_post_comments(uuid);
drop function if exists public.kv_soft_delete_own_comment(uuid);

do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.community_comments'::regclass
              and tgname = 'community_comments_delete_guard') then
    raise exception 'delete guard trigger still present';
  end if;
  if exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace
              and proname in ('kv_soft_delete_own_comment', 'kv_list_post_comments', 'kv_community_comments_delete_guard')) then
    raise exception 'comment delete functions still present';
  end if;
end
$$;

commit;
