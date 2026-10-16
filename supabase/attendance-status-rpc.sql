-- ═══════════════════════════════════════════════════════════════════
-- KickVista: read-only check-in status — public.kv_my_checkin_status()
--
-- Additive; apply AFTER attendance-checkin-rpc.sql and verify it BEFORE the
-- app deploy that reads it. The app has no fallback: while this function is
-- missing or fails, the attendance page / mypage / widget show the streak and
-- "checked in today" as unavailable (never legacy attendance_logs or
-- profiles.current_streak values). Reads only; writes nothing; not affected
-- by the payout switch.
--
-- Returns, for auth.uid() only:
--   date              today's check-in day (UTC date, 09:00 KST boundary)
--   checked_in_today  same rule as kv_daily_checkin(): a trusted check-in
--                     today, or a display row for today (blocker)
--   streak            current streak from kv_private.checkins only: the
--                     streak of the latest trusted check-in if it was today
--                     or yesterday, else 0. Legacy attendance_logs and
--                     profiles.current_streak are never used.
--   payout_enabled    the attendance payout switch
-- SECURITY DEFINER, search_path = '', EXECUTE for authenticated only.
-- Safe to re-run; refuses a same-name function it did not create.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('kv_private.checkins') is null or to_regclass('kv_private.flags') is null then
    raise exception 'apply attendance-checkin-rpc.sql first';
  end if;
  if to_regprocedure('public.kv_my_checkin_status()') is not null
     and coalesce(obj_description(to_regprocedure('public.kv_my_checkin_status()'), 'pg_proc'), '')
         not like 'kickvista:attendance-status%' then
    raise exception 'public.kv_my_checkin_status() exists and is not managed by this migration';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'kv_my_checkin_status' and p.pronargs > 0) then
    raise exception 'another public.kv_my_checkin_status(...) signature exists; resolve it first';
  end if;
end
$$;

create or replace function public.kv_my_checkin_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := (pg_catalog.now() at time zone 'UTC')::date;
  v_last   kv_private.checkins%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_last from kv_private.checkins
   where user_id = v_uid order by checkin_date desc limit 1;
  return jsonb_build_object(
    'date', v_today,
    'checked_in_today',
      (found and v_last.checkin_date = v_today)
      or exists (select 1 from public.attendance_logs where user_id = v_uid and attendance_date = v_today),
    'streak', case when found and v_last.checkin_date >= v_today - 1 then v_last.streak_day else 0 end,
    'payout_enabled', coalesce((select f.enabled from kv_private.flags f where f.name = 'attendance_checkin_payout'), false));
end;
$$;

comment on function public.kv_my_checkin_status() is
  'kickvista:attendance-status — read-only check-in status for auth.uid() from trusted records';
revoke execute on function public.kv_my_checkin_status() from public, anon, service_role;
grant execute on function public.kv_my_checkin_status() to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.kv_my_checkin_status()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.kv_my_checkin_status()', 'EXECUTE')
     or exists (select 1 from aclexplode((select coalesce(proacl, acldefault('f', proowner)) from pg_proc
                 where oid = 'public.kv_my_checkin_status()'::regprocedure)) a where a.grantee = 0) then
    raise exception 'kv_my_checkin_status() is still executable by PUBLIC, anon or service_role';
  end if;
  if not has_function_privilege('authenticated', 'public.kv_my_checkin_status()', 'EXECUTE') then
    raise exception 'authenticated cannot execute kv_my_checkin_status()';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Dropping the function does NOT bring back the legacy values: an app version
-- that reads it then shows the streak and "checked in today" as unavailable
-- (with a retry) for every signed-in user until it is re-applied. Check-in
-- itself (kv_daily_checkin) is unaffected. Roll the app back first if that
-- display is not acceptable.
--
--   drop function if exists public.kv_my_checkin_status();
