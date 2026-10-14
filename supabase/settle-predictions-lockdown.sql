-- ═══════════════════════════════════════════════════════════════════
-- KickVista: restrict settle_predictions(integer, text) to the server
--
-- Forward migration, separate from profiles-role-guard.sql. Apply ONLY
-- after the app deploy in which lib/predictions.ts settlePredictions()
-- calls this RPC with the service role key — before that deploy the
-- settlement cron runs as anon and would start failing.
--
-- Why: settle_predictions is SECURITY DEFINER, trusts the caller's
-- p_final_result and checks no caller role. The production catalog
-- summary reports EXECUTE for PUBLIC / anon / authenticated (raw ACL not
-- reviewed yet). If the public schema is exposed through the API
-- (assumed, not verified), anyone with the public anon key could settle
-- any match with any result and pay out points.
--
-- Changes only this exact signature's EXECUTE grants. The function body
-- and every other RPC (read RPCs, increment_post_view, ...) are untouched.
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regprocedure('public.settle_predictions(integer, text)') is null then
    raise exception 'public.settle_predictions(integer, text) is missing — nothing to restrict';
  end if;
end
$$;

revoke execute on function public.settle_predictions(integer, text) from public, anon, authenticated;
grant execute on function public.settle_predictions(integer, text) to service_role;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Re-opens the hole above. Record the pre-apply ACL first (owner, raw
-- proacl and whether it was NULL, each grantee / grantor / grant option,
-- service_role explicit vs effective EXECUTE) and restore from that record.
--
-- The statements below restore the EXECUTE rights the production summary
-- reported. They do not guarantee an identical ACL: a NULL (default) proacl
-- becomes an explicit list, grantors may differ, and the service_role grant
-- added above stays unless it was absent before:
--
--   begin;
--   grant execute on function public.settle_predictions(integer, text) to public, anon, authenticated;
--   -- only if service_role had no explicit EXECUTE entry before:
--   -- revoke execute on function public.settle_predictions(integer, text) from service_role;
--   commit;
