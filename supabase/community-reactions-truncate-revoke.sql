-- ═══════════════════════════════════════════════════════════════════
-- KickVista: revoke TRUNCATE on public.community_comments and
-- public.community_post_likes from the API roles (owner only). Same
-- reasoning as truncate-revoke.sql / community-posts-truncate-revoke.sql:
-- TRUNCATE ignores RLS and triggers' row logic, and the app never
-- truncates. Independent of the app and of community-counters-definer.sql;
-- safe to re-run.
--
-- Only TRUNCATE from PUBLIC / anon / authenticated changes. SELECT /
-- INSERT / UPDATE / DELETE of the API roles, every right of service_role,
-- RLS policies and triggers stay as they are; the checks at the end compare
-- them with the state before the revoke and raise (rolling everything back)
-- if anything else moved, or if anon / authenticated still have TRUNCATE on
-- these two tables or on the 5 tables closed earlier (e.g. a grant by
-- another grantor or through a role membership).
-- Record V2_community_reactions_truncate_check first.
-- Undo: community-reactions-truncate-revoke-rollback.sql.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  t text;
begin
  foreach t in array array['community_comments', 'community_post_likes'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'public.% is missing', t;
    end if;
    if (select relkind from pg_class where oid = ('public.' || t)::regclass) <> 'r' then
      raise exception 'public.% is not a table', t;
    end if;
  end loop;
end
$$;

-- Rights that must not change, recorded inside this transaction.
create temp table kv_reaction_trunc_before on commit drop as
select t.name, r.role, p.priv, has_table_privilege(r.role, 'public.' || t.name, p.priv) as ok
  from (values ('community_comments'), ('community_post_likes')) t(name)
 cross join (values ('anon'), ('authenticated'), ('service_role')) r(role)
 cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')) p(priv)
 where not (r.role in ('anon', 'authenticated') and p.priv = 'TRUNCATE');

revoke truncate on table public.community_comments, public.community_post_likes from public, anon, authenticated;

do $$
declare
  t text;
  r text;
  v_changed text;
begin
  foreach t in array array['community_comments', 'community_post_likes', 'community_posts',
                           'profiles', 'predictions', 'point_logs', 'attendance_logs'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if has_table_privilege(r, 'public.' || t, 'TRUNCATE') then
        raise exception '% still has TRUNCATE on % (other grantor or role membership?)', r, t;
      end if;
    end loop;
  end loop;

  select string_agg(b.name || ' ' || b.role || ' ' || b.priv, ', ') into v_changed
    from kv_reaction_trunc_before b
   where has_table_privilege(b.role, 'public.' || b.name, b.priv) is distinct from b.ok;
  if v_changed is not null then
    raise exception 'other rights changed: %', v_changed;
  end if;
end
$$;

commit;
