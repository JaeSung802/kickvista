-- ═══════════════════════════════════════════════════════════════════
-- KickVista: stop direct client writes to public.attendance_logs
--
-- Apply ONLY after attendance-checkin-rpc.sql, and only while the production
-- domain serves either the check-in pause (lib/attendance-pause.ts = true)
-- or the app that calls public.kv_daily_checkin(). Never while the previous
-- app (direct writes) serves check-in: it ignores the failed INSERT and
-- still adds points, so with this lockdown it would pay on every call.
--
-- After this, attendance_logs is written only by kv_daily_checkin()
-- (SECURITY DEFINER). SELECT, the owner read policy, service_role,
-- profiles / point_logs privileges, the role guard, the settlement RPC
-- restriction, the predictions lockdown and the TRUNCATE revoke are
-- untouched. Safe to re-run.
--
-- REVOKE only removes grants made by the executing role; the checks at the
-- end raise and roll back if anon/authenticated can still write.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.attendance_logs') is null then
    raise exception 'public.attendance_logs is missing';
  end if;
  if to_regprocedure('public.kv_daily_checkin()') is null
     or not has_function_privilege('authenticated', 'public.kv_daily_checkin()', 'EXECUTE') then
    raise exception 'apply attendance-checkin-rpc.sql first';
  end if;
end
$$;

revoke insert, update, delete on table public.attendance_logs from public, anon, authenticated;

do $$
declare
  r text;
  c record;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.attendance_logs', 'INSERT')
       or has_table_privilege(r, 'public.attendance_logs', 'UPDATE')
       or has_table_privilege(r, 'public.attendance_logs', 'DELETE') then
      raise exception '% can still write attendance_logs (grantor differs from %?)', r, current_user;
    end if;
    for c in select attnum, attname from pg_attribute
             where attrelid = 'public.attendance_logs'::regclass and attnum > 0 and not attisdropped loop
      if has_column_privilege(r, 'public.attendance_logs', c.attnum, 'INSERT')
         or has_column_privilege(r, 'public.attendance_logs', c.attnum, 'UPDATE') then
        raise exception '% still has a column write grant on attendance_logs.%', r, c.attname;
      end if;
    end loop;
  end loop;
  if not has_table_privilege('authenticated', 'public.attendance_logs', 'SELECT') then
    raise exception 'authenticated lost SELECT on attendance_logs';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Restore exactly the entries recorded before applying (restore_sql of the
-- read-only pre-record), typically:
--
--   begin;
--   grant insert, update, delete on table public.attendance_logs to anon, authenticated;
--   commit;
--
-- Grantor and ACL entry order may differ from the original after a rollback.
-- Restore this BEFORE serving the previous app again (see the warning above),
-- and pause check-in while switching.
