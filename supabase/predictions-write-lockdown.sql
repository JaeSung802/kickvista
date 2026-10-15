-- ═══════════════════════════════════════════════════════════════════
-- KickVista: stop direct client writes to public.predictions
--
-- Apply ONLY after the app deploy that pauses POST /api/predictions
-- (lib/predictions-pause.ts) is confirmed on the production domain.
-- Before that deploy placePrediction() deducts points with the user's
-- session and then INSERTs the prediction; revoking INSERT first would
-- make it deduct, fail the insert and depend on a best-effort refund.
--
-- Why: anon/authenticated can INSERT and UPDATE every predictions column
-- under owner-only policies, so a user can create or rewrite PENDING
-- predictions that the settlement RPC then pays.
--
-- Changes only table privileges on public.predictions:
--   - INSERT / UPDATE / DELETE revoked from PUBLIC, anon, authenticated
--     (REVOKE on the table also removes those roles' column grants)
--   - UPDATE (is_notified) granted back to authenticated for
--     PATCH /api/predictions/[id]/notify (row access still limited by the
--     "predictions: owner update notify" policy)
-- SELECT, policies, service_role, the settlement RPC, the profiles role
-- guard and existing rows are untouched. Safe to re-run.
--
-- REVOKE only removes grants made by the executing role. If the grants
-- were made by another role the statements are no-ops; the checks at the
-- end then raise and the whole transaction rolls back.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.predictions') is null then
    raise exception 'public.predictions is missing';
  end if;
  if (select relkind from pg_class where oid = 'public.predictions'::regclass) <> 'r' then
    raise exception 'public.predictions is not a table';
  end if;
  if not exists (select 1 from pg_attribute where attrelid = 'public.predictions'::regclass
                 and attname = 'is_notified' and not attisdropped) then
    raise exception 'public.predictions.is_notified is missing';
  end if;
end
$$;

revoke insert, update, delete on table public.predictions from public, anon, authenticated;
grant update (is_notified) on table public.predictions to authenticated;

do $$
declare
  r text;
  c record;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.predictions', 'INSERT')
       or has_table_privilege(r, 'public.predictions', 'UPDATE')
       or has_table_privilege(r, 'public.predictions', 'DELETE') then
      raise exception '% still has table-level INSERT/UPDATE/DELETE on predictions (grantor differs from %?)', r, current_user;
    end if;
    for c in select attnum, attname from pg_attribute
             where attrelid = 'public.predictions'::regclass and attnum > 0 and not attisdropped loop
      if has_column_privilege(r, 'public.predictions', c.attnum, 'INSERT') then
        raise exception '% still has INSERT on predictions.%', r, c.attname;
      end if;
      if has_column_privilege(r, 'public.predictions', c.attnum, 'UPDATE')
         and not (r = 'authenticated' and c.attname = 'is_notified') then
        raise exception '% still has UPDATE on predictions.%', r, c.attname;
      end if;
    end loop;
  end loop;
  if not has_column_privilege('authenticated', 'public.predictions', 'is_notified', 'UPDATE') then
    raise exception 'authenticated lost UPDATE (is_notified)';
  end if;
  if not has_table_privilege('authenticated', 'public.predictions', 'SELECT') then
    raise exception 'authenticated lost SELECT on predictions';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Restore from the pre-apply record (restore_sql of the read-only record
-- query), not from memory. For the state reported on 2026-10-14
-- (INSERT/UPDATE on every column for authenticated) it is typically:
--
--   begin;
--   revoke update (is_notified) on table public.predictions from authenticated;  -- only if the record had no column grant for it
--   grant insert, update, delete on table public.predictions to anon, authenticated;  -- exactly the entries in the record
--   commit;
--
-- Grantor and ACL entry order may differ from the original after a rollback.
-- Rolling back re-opens direct writes; keep the app pause in place.
