-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo community-reactions-truncate-revoke.sql (owner only).
-- Gives anon / authenticated TRUNCATE on public.community_comments and
-- public.community_post_likes again. Prefer the exact restore_sql from the
-- pre-apply V2_community_reactions_truncate_check record; this file restores
-- the usual Supabase state (anon + authenticated, no PUBLIC entry). Grantor
-- and ACL entry order may differ from the original. Other tables untouched.
-- ═══════════════════════════════════════════════════════════════════

begin;

grant truncate on table public.community_comments, public.community_post_likes to anon, authenticated;

do $$
declare
  t text;
  r text;
begin
  foreach t in array array['community_comments', 'community_post_likes'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if not has_table_privilege(r, 'public.' || t, 'TRUNCATE') then
        raise exception 'TRUNCATE was not restored for % on %', r, t;
      end if;
    end loop;
  end loop;
end
$$;

commit;
