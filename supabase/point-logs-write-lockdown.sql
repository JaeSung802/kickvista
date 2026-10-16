-- ═══════════════════════════════════════════════════════════════════
-- KickVista: stop direct client writes to public.point_logs
--
-- Apply ONLY when no app path on the production domain still inserts
-- point_logs with the user's session: the shop uses kv_shop_purchase()
-- (which writes the trusted kv_private.point_ledger instead) and prediction
-- placement stays paused (placePrediction still inserts point_logs; it must
-- move to an RPC before resuming). The settlement RPC (SECURITY DEFINER)
-- keeps writing point_logs as the owner.
--
-- Changes only privileges: INSERT / UPDATE / DELETE revoked from PUBLIC,
-- anon, authenticated. SELECT and the owner read policy stay. Existing rows
-- are untouched (they were user-writable and are not evidence of anything).
-- REVOKE only removes grants made by the executing role; the checks at the
-- end raise and roll back if anon/authenticated can still write.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.point_logs') is null then
    raise exception 'public.point_logs is missing';
  end if;
  if to_regprocedure('public.kv_shop_purchase(text)') is null then
    raise exception 'apply shop-rpc.sql (and deploy the app using it) first';
  end if;
end
$$;

revoke insert, update, delete on table public.point_logs from public, anon, authenticated;

do $$
declare
  r text;
  c record;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.point_logs', 'INSERT')
       or has_table_privilege(r, 'public.point_logs', 'UPDATE')
       or has_table_privilege(r, 'public.point_logs', 'DELETE') then
      raise exception '% can still write point_logs (grantor differs from %?)', r, current_user;
    end if;
    for c in select attnum, attname from pg_attribute
             where attrelid = 'public.point_logs'::regclass and attnum > 0 and not attisdropped loop
      if has_column_privilege(r, 'public.point_logs', c.attnum, 'INSERT')
         or has_column_privilege(r, 'public.point_logs', c.attnum, 'UPDATE') then
        raise exception '% still has a column write grant on point_logs.%', r, c.attname;
      end if;
    end loop;
  end loop;
  if not has_table_privilege('authenticated', 'public.point_logs', 'SELECT') then
    raise exception 'authenticated lost SELECT on point_logs';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Restore exactly the entries of the pre-apply record (restore_sql), typically:
--
--   begin;
--   grant insert, update, delete on table public.point_logs to anon, authenticated;
--   commit;
