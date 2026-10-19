-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo community-posts-truncate-revoke.sql (owner only).
-- Gives anon / authenticated TRUNCATE on public.community_posts again.
-- Prefer the exact restore_sql from the pre-apply V_community_truncate_check
-- record; this file restores the usual Supabase state (anon + authenticated,
-- no PUBLIC entry). Grantor and ACL entry order may differ from the
-- original. The 4 point tables are not touched.
-- ═══════════════════════════════════════════════════════════════════

begin;

grant truncate on table public.community_posts to anon, authenticated;

do $$
begin
  if not has_table_privilege('anon', 'public.community_posts', 'TRUNCATE')
     or not has_table_privilege('authenticated', 'public.community_posts', 'TRUNCATE') then
    raise exception 'TRUNCATE was not restored';
  end if;
end
$$;

commit;
