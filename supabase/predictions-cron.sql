-- ═══════════════════════════════════════════════════════════════════
-- KickVista — Predictions Cron Helper
-- Run in Supabase SQL editor AFTER predictions.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── get_pending_match_ids() — SECURITY DEFINER RPC ──────────────────────────
-- Returns all distinct match_ids that still have at least one PENDING prediction.
-- Used by the settlement cron job (which runs without a user session).
-- Exposes only integer match IDs — no PII.

create or replace function public.get_pending_match_ids()
returns table (match_id integer)
security definer
set search_path = public
language sql
stable
as $$
  select distinct match_id
  from predictions
  where status = 'PENDING'
  order by match_id;
$$;

-- Grant to anon so the cron job (no user session) can call it
grant execute on function public.get_pending_match_ids() to anon, authenticated;
