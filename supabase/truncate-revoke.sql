-- ═══════════════════════════════════════════════════════════════════
-- KickVista: revoke TRUNCATE from the API roles on the point tables
--
-- Independent of the app; can be applied before or after
-- predictions-write-lockdown.sql. The app never truncates.
--
-- Why: TRUNCATE ignores RLS and has no row filter. PostgREST does not
-- issue TRUNCATE, so today it needs a path that runs arbitrary SQL as
-- anon/authenticated, but if one ever exists the whole table is gone.
--
-- Tables only: profiles, predictions, point_logs, attendance_logs.
-- public.leaderboard is a view; TRUNCATE does not apply to views, so it is
-- left out. service_role, other privileges, policies, the profiles role
-- guard and the settlement RPC are untouched. Safe to re-run.
--
-- REVOKE only removes grants made by the executing role; the checks at the
-- end raise and roll back if anon/authenticated still have TRUNCATE.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'predictions', 'point_logs', 'attendance_logs'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'public.% is missing', t;
    end if;
    if (select relkind from pg_class where oid = ('public.' || t)::regclass) <> 'r' then
      raise exception 'public.% is not a table', t;
    end if;
  end loop;
end
$$;

revoke truncate on table public.profiles, public.predictions, public.point_logs, public.attendance_logs
  from public, anon, authenticated;

do $$
declare
  t text;
  r text;
begin
  foreach t in array array['profiles', 'predictions', 'point_logs', 'attendance_logs'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if has_table_privilege(r, 'public.' || t, 'TRUNCATE') then
        raise exception '% still has TRUNCATE on % (grantor differs from %?)', r, t, current_user;
      end if;
    end loop;
  end loop;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Restore exactly the TRUNCATE entries of the pre-apply record (restore_sql),
-- typically:
--
--   begin;
--   grant truncate on table public.profiles, public.predictions, public.point_logs, public.attendance_logs
--     to anon, authenticated;
--   commit;
--
-- Grantor and ACL entry order may differ from the original after a rollback.
