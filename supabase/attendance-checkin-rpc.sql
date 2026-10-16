-- ═══════════════════════════════════════════════════════════════════
-- KickVista: trusted daily check-in — public.kv_daily_checkin()
--
-- Additive migration. Apply while check-in is paused on the production
-- domain (lib/attendance-pause.ts = true), before the app deploy that calls
-- the RPC from POST /api/attendance/check-in. The previous check-in code and
-- this RPC must never serve requests at the same time: interleaved they can
-- pay twice or overwrite each other's balance update.
--
-- Adds:
--   - schema kv_private (no API access) with
--       kv_private.checkins      one row per user per UTC day (unique)
--       kv_private.point_ledger  trusted ledger; only kind 'daily_checkin' so far
--       kv_private.flags         payout switches; 'attendance_checkin_payout'
--                                is created DISABLED and never changed by a
--                                re-run (attendance-payout-enable/disable.sql)
--   - public.kv_daily_checkin(): SECURITY DEFINER, search_path = '',
--     caller = auth.uid(), no arguments. EXECUTE for authenticated only
--     (PUBLIC, anon and service_role revoked). While the payout flag is off
--     it returns {paused: true} and writes nothing — for app and direct calls.
--
-- Rules kept from the app (lib/attendance.ts): the day is the UTC date;
-- streak = yesterday's streak + 1, else 1; points = 10 + 5 (3+ days)
-- / 15 (7+) / 30 (14+) / 100 (30+).
--
-- Trust boundary: the streak comes only from kv_private.checkins.
-- public.attendance_logs, profiles.current_streak and public.point_logs
-- are user-writable today and are never read as evidence. The only use of
-- attendance_logs is as a blocker: a row for today means "already checked
-- in" (it can only prevent a payout, never cause one).
--
-- Existing attendance_logs / point_logs / profiles data is not copied,
-- changed or back-filled. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('public.profiles') is null or to_regclass('public.attendance_logs') is null then
    raise exception 'public.profiles or public.attendance_logs is missing';
  end if;
  if to_regprocedure('auth.uid()') is null then
    raise exception 'auth.uid() is missing';
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.attendance_logs'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) = 'UNIQUE (user_id, attendance_date)') then
    raise exception 'public.attendance_logs is missing UNIQUE (user_id, attendance_date)';
  end if;
  -- never take over same-name objects this migration did not create
  if exists (select 1 from pg_namespace where nspname = 'kv_private')
     and coalesce(obj_description((select oid from pg_namespace where nspname = 'kv_private'), 'pg_namespace'), '')
         not like 'kickvista:kv_private%' then
    raise exception 'schema kv_private exists and is not managed by KickVista migrations';
  end if;
  if to_regprocedure('public.kv_daily_checkin()') is not null
     and coalesce(obj_description(to_regprocedure('public.kv_daily_checkin()'), 'pg_proc'), '')
         not like 'kickvista:attendance-checkin%' then
    raise exception 'public.kv_daily_checkin() exists and is not managed by this migration';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'kv_daily_checkin' and p.pronargs > 0) then
    raise exception 'another public.kv_daily_checkin(...) signature exists; resolve it first';
  end if;
  -- kv_private holds only the objects of these migrations (this file and
  -- shop-rpc.sql): refuse anything else, and same-name tables not created here
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'kv_private' and c.relkind in ('r', 'p', 'v', 'm', 'f')
               and c.relname not in ('checkins', 'point_ledger', 'flags', 'shop_items', 'shop_purchases')) then
    raise exception 'kv_private contains objects not managed by KickVista migrations';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'kv_private') then
    raise exception 'kv_private contains functions not managed by this migration';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'kv_private' and c.relname in ('checkins', 'point_ledger', 'flags')
               and coalesce(obj_description(c.oid, 'pg_class'), '') not like 'kickvista:' || c.relname || '%') then
    raise exception 'kv_private.checkins / point_ledger / flags exists and is not managed by this migration';
  end if;
end
$$;

create schema if not exists kv_private;
comment on schema kv_private is 'kickvista:kv_private — server-only trusted records, no API access';
revoke all on schema kv_private from public, anon, authenticated, service_role;

create table if not exists kv_private.checkins (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  checkin_date date        not null,
  streak_day   integer     not null check (streak_day >= 1),
  points       integer     not null check (points > 0),
  created_at   timestamptz not null default now(),
  constraint checkins_user_date_unique unique (user_id, checkin_date)
);

create table if not exists kv_private.point_ledger (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  kind       text        not null check (kind in ('daily_checkin')),
  amount     integer     not null check (amount <> 0),
  checkin_id uuid        references kv_private.checkins (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint point_ledger_checkin_ref check (kind <> 'daily_checkin' or checkin_id is not null)
);

create table if not exists kv_private.flags (
  name       text        primary key,
  enabled    boolean     not null,
  updated_at timestamptz not null default now(),
  updated_by text        not null default current_user
);

-- Created disabled; an existing row (set by an operator) is never changed here.
insert into kv_private.flags (name, enabled) values ('attendance_checkin_payout', false)
on conflict (name) do nothing;

comment on table kv_private.flags is 'kickvista:flags — server-side payout switches (operator SQL only)';
comment on table kv_private.checkins is 'kickvista:checkins — one trusted check-in per user per UTC day';
comment on table kv_private.point_ledger is 'kickvista:point_ledger — trusted point ledger written only by KickVista RPCs';

create unique index if not exists point_ledger_daily_checkin_once
  on kv_private.point_ledger (checkin_id) where kind = 'daily_checkin';

alter table kv_private.checkins     enable row level security;
alter table kv_private.point_ledger enable row level security;
alter table kv_private.flags        enable row level security;
revoke all on table kv_private.checkins, kv_private.point_ledger, kv_private.flags
  from public, anon, authenticated, service_role;

create or replace function public.kv_daily_checkin()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := auth.uid();
  v_today      date := (pg_catalog.now() at time zone 'UTC')::date;
  v_existing   kv_private.checkins%rowtype;
  v_prev       integer;
  v_streak     integer;
  v_points     integer;
  v_checkin_id uuid;
  v_total      integer;
  v_enabled    boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Payout switch, checked before anything else. FOR SHARE takes a ROW SHARE
  -- table lock: attendance-payout-disable.sql (EXCLUSIVE table lock) waits for
  -- every call that already passed this check, and calls arriving behind a
  -- pending disable wait for it and then see the new value.
  select enabled into v_enabled from kv_private.flags
   where name = 'attendance_checkin_payout' for share;
  if v_enabled is not true then
    return jsonb_build_object('checked_in', false, 'already', false, 'paused', true);
  end if;

  -- Serialises every check-in of this user and proves the profile exists.
  -- No profile is created here.
  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  -- Retry of today's check-in: no second payout, same result.
  select * into v_existing from kv_private.checkins
   where user_id = v_uid and checkin_date = v_today;
  if found then
    return jsonb_build_object('checked_in', false, 'already', true, 'date', v_today,
                              'points_earned', v_existing.points, 'streak', v_existing.streak_day);
  end if;

  -- Blocker only: a row for today (e.g. a check-in by the previous app earlier
  -- on the switch day) means already checked in. Never used to grant anything.
  if exists (select 1 from public.attendance_logs
              where user_id = v_uid and attendance_date = v_today) then
    return jsonb_build_object('checked_in', false, 'already', true, 'date', v_today,
                              'points_earned', null, 'streak', null);
  end if;

  select streak_day into v_prev from kv_private.checkins
   where user_id = v_uid and checkin_date = v_today - 1;
  v_streak := coalesce(v_prev, 0) + 1;
  v_points := 10 + case when v_streak >= 30 then 100
                        when v_streak >= 14 then 30
                        when v_streak >= 7  then 15
                        when v_streak >= 3  then 5
                        else 0 end;

  insert into kv_private.checkins (user_id, checkin_date, streak_day, points)
  values (v_uid, v_today, v_streak, v_points)
  returning id into v_checkin_id;

  insert into kv_private.point_ledger (user_id, kind, amount, checkin_id)
  values (v_uid, 'daily_checkin', v_points, v_checkin_id);

  update public.profiles
     set total_points = total_points + v_points,
         current_streak = v_streak
   where id = v_uid
  returning total_points into v_total;

  -- Display copy for the existing history views.
  insert into public.attendance_logs (user_id, attendance_date, points_earned, streak_day)
  values (v_uid, v_today, v_points, v_streak);

  return jsonb_build_object('checked_in', true, 'already', false, 'date', v_today,
                            'points_earned', v_points, 'streak', v_streak, 'total_points', v_total);
end;
$$;

comment on function public.kv_daily_checkin() is
  'kickvista:attendance-checkin — daily check-in for auth.uid(); trusted record in kv_private';
revoke execute on function public.kv_daily_checkin() from public, anon, service_role;
grant execute on function public.kv_daily_checkin() to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.kv_daily_checkin()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.kv_daily_checkin()', 'EXECUTE')
     or exists (select 1 from aclexplode((select coalesce(proacl, acldefault('f', proowner)) from pg_proc
                 where oid = 'public.kv_daily_checkin()'::regprocedure)) a where a.grantee = 0) then
    raise exception 'kv_daily_checkin() is still executable by PUBLIC, anon or service_role';
  end if;
  if not has_function_privilege('authenticated', 'public.kv_daily_checkin()', 'EXECUTE') then
    raise exception 'authenticated cannot execute kv_daily_checkin()';
  end if;
  if not exists (select 1 from kv_private.flags where name = 'attendance_checkin_payout') then
    raise exception 'payout flag row is missing';
  end if;
  if has_schema_privilege('anon', 'kv_private', 'USAGE') or has_schema_privilege('authenticated', 'kv_private', 'USAGE') then
    raise exception 'API roles still have USAGE on kv_private (grantor differs from %?)', current_user;
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Stop payouts first with attendance-payout-disable.sql (and keep the app
-- pause on), and prefer fixing forward. To also stop the RPC while keeping
-- the trusted records already written:
--
--   revoke execute on function public.kv_daily_checkin() from authenticated;
--
-- Dropping the objects deletes the trusted check-in history and ledger; do it
-- only if nothing has been recorded yet:
--
--   begin;
--   drop function if exists public.kv_daily_checkin();
--   drop table if exists kv_private.point_ledger;
--   drop table if exists kv_private.checkins;
--   drop table if exists kv_private.flags;
--   drop schema if exists kv_private;
--   commit;
