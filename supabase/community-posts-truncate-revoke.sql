-- ═══════════════════════════════════════════════════════════════════
-- KickVista: revoke TRUNCATE on public.community_posts from the API roles
-- (owner only). Same reasoning as truncate-revoke.sql (2026-10-15, the 4
-- point tables): TRUNCATE ignores RLS and has no row filter, and the app
-- never truncates. Independent of the app and of
-- community-post-author-write.sql; safe to re-run.
--
-- Only TRUNCATE from PUBLIC / anon / authenticated changes. SELECT /
-- INSERT / UPDATE / DELETE of the API roles, every right of service_role,
-- the RLS policies and the 4 tables' existing TRUNCATE revoke stay as they
-- are; the checks at the end compare them with the state before the revoke
-- and raise (rolling everything back) if anything else moved or if anon /
-- authenticated still have TRUNCATE (e.g. a grant by another grantor or
-- through a role membership). Record V_community_truncate_check first.
-- Undo: community-posts-truncate-revoke-rollback.sql.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.community_posts') is null then
    raise exception 'public.community_posts is missing';
  end if;
  if (select relkind from pg_class where oid = 'public.community_posts'::regclass) <> 'r' then
    raise exception 'public.community_posts is not a table';
  end if;
end
$$;

-- Rights that must not change, recorded inside this transaction.
create temp table kv_trunc_before on commit drop as
select r.role, p.priv, has_table_privilege(r.role, 'public.community_posts', p.priv) as ok
  from (values ('anon'), ('authenticated'), ('service_role')) r(role)
 cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')) p(priv)
 where not (r.role in ('anon', 'authenticated') and p.priv = 'TRUNCATE');

revoke truncate on table public.community_posts from public, anon, authenticated;

do $$
declare
  t text;
  r text;
  v_changed text;
begin
  foreach t in array array['community_posts', 'profiles', 'predictions', 'point_logs', 'attendance_logs'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if has_table_privilege(r, 'public.' || t, 'TRUNCATE') then
        raise exception '% still has TRUNCATE on % (other grantor or role membership?)', r, t;
      end if;
    end loop;
  end loop;

  select string_agg(b.role || ' ' || b.priv, ', ') into v_changed
    from kv_trunc_before b
   where has_table_privilege(b.role, 'public.community_posts', b.priv) is distinct from b.ok;
  if v_changed is not null then
    raise exception 'other rights on community_posts changed: %', v_changed;
  end if;
end
$$;

commit;
