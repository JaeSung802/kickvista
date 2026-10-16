-- ═══════════════════════════════════════════════════════════════════
-- KickVista: public points leaderboard — public.kv_points_leaderboard()
--
-- Additive and read-only; apply AFTER attendance-checkin-rpc.sql and verify it
-- BEFORE the app deploy that reads it. The app has no fallback: while this
-- function is missing or fails, the ranking shows an error state (never the
-- old leaderboard view, legacy profiles.current_streak or sample users).
--
-- What it ranks: the CURRENT balance (profiles.total_points) of eligible
-- profiles. No period filter (not monthly), no cumulative activity score.
--   eligible      nickname not blank, total_points > 0 and not banned
--                 (is_banned true = banned; false or NULL = not banned — NULL
--                 is what self-service sign-ups may insert). One rule, used
--                 for the list, the ranks, the ties, tied_hidden and me.
--   rank          competition ranking (1, 1, 3): rank() over total_points desc
--   order in tie  nickname (C collation), then id — stable; id is not returned
--   list          every profile with rank <= 10 (ties at the 10th place are
--                 all included), at most 30 rows; tied_hidden counts the rest
--   streak        from kv_private.checkins only, same rule as
--                 kv_my_checkin_status(): streak_day of the latest trusted
--                 check-in if it was today or yesterday (UTC date), else 0
--   me            the caller's own rank / balance / streak (auth.uid()),
--                 also when outside the list; null without a session. When
--                 not eligible: ranked false, rank null and reason
--                 no_nickname | no_points | not_eligible (banned) — returned
--                 only to that caller.
-- Returned per row: rank, nickname, total_points, streak, is_me. No user id,
-- e-mail, role, ban flag or other profile column; banned profiles are left
-- out without any marker. Writes nothing.
-- SECURITY DEFINER, search_path = '', EXECUTE for authenticated only.
-- kv_private stays without USAGE for the API roles.
-- Safe to re-run; refuses a same-name function it did not create.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if to_regclass('kv_private.checkins') is null then
    raise exception 'apply attendance-checkin-rpc.sql first';
  end if;
  if to_regprocedure('public.kv_points_leaderboard()') is not null
     and coalesce(obj_description(to_regprocedure('public.kv_points_leaderboard()'), 'pg_proc'), '')
         not like 'kickvista:points-leaderboard%' then
    raise exception 'public.kv_points_leaderboard() exists and is not managed by this migration';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'kv_points_leaderboard' and p.pronargs > 0) then
    raise exception 'another public.kv_points_leaderboard(...) signature exists; resolve it first';
  end if;
end
$$;

create or replace function public.kv_points_leaderboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := (pg_catalog.now() at time zone 'UTC')::date;
  v_rows   jsonb;
  v_hidden integer;
  v_me     jsonb;
begin
  with eligible as (
    select p.id, p.nickname, p.total_points,
           rank() over (order by p.total_points desc) as rnk
      from public.profiles p
     where p.nickname is not null and pg_catalog.btrim(p.nickname) <> '' and p.total_points > 0
       and p.is_banned is not true
  ), top as (
    select e.*, row_number() over (order by e.rnk, e.nickname collate "C", e.id) as pos
      from eligible e
     where e.rnk <= 10
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'rank', t.rnk,
           'nickname', t.nickname,
           'total_points', t.total_points,
           'streak', coalesce((select case when c.checkin_date >= v_today - 1 then c.streak_day else 0 end
                                 from kv_private.checkins c
                                where c.user_id = t.id
                                order by c.checkin_date desc limit 1), 0),
           'is_me', coalesce(t.id = v_uid, false))
           order by t.pos) filter (where t.pos <= 30), '[]'::jsonb),
         count(*) filter (where t.pos > 30)
    into v_rows, v_hidden
    from top t;

  if v_uid is not null then
    select jsonb_build_object(
             'ranked', x.reason is null,
             'reason', x.reason,
             'rank', case when x.reason is null
                          then 1 + (select count(*) from public.profiles o
                                     where o.nickname is not null and pg_catalog.btrim(o.nickname) <> ''
                                       and o.total_points > 0 and o.is_banned is not true
                                       and o.total_points > x.total_points)
                     end,
             'nickname', x.nickname,
             'total_points', x.total_points,
             'streak', coalesce((select case when c.checkin_date >= v_today - 1 then c.streak_day else 0 end
                                   from kv_private.checkins c
                                  where c.user_id = x.id
                                  order by c.checkin_date desc limit 1), 0))
      into v_me
      from (select p.id, p.nickname, p.total_points,
                   case when p.is_banned is true then 'not_eligible'
                        when p.nickname is null or pg_catalog.btrim(p.nickname) = '' then 'no_nickname'
                        when p.total_points <= 0 then 'no_points'
                   end as reason
              from public.profiles p
             where p.id = v_uid) x;
    if v_me is not null then
      v_me := v_me || jsonb_build_object('in_list',
                exists (select 1 from jsonb_array_elements(v_rows) r where (r ->> 'is_me')::boolean));
    end if;
  end if;

  return jsonb_build_object('date', v_today, 'rows', v_rows, 'tied_hidden', v_hidden, 'me', v_me);
end;
$$;

comment on function public.kv_points_leaderboard() is
  'kickvista:points-leaderboard — public top 10 by current balance with trusted streaks; minimal fields';
revoke execute on function public.kv_points_leaderboard() from public, anon, service_role;
grant execute on function public.kv_points_leaderboard() to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.kv_points_leaderboard()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.kv_points_leaderboard()', 'EXECUTE')
     or exists (select 1 from aclexplode((select coalesce(proacl, acldefault('f', proowner)) from pg_proc
                 where oid = 'public.kv_points_leaderboard()'::regprocedure)) a where a.grantee = 0) then
    raise exception 'kv_points_leaderboard() is still executable by PUBLIC, anon or service_role';
  end if;
  if not has_function_privilege('authenticated', 'public.kv_points_leaderboard()', 'EXECUTE') then
    raise exception 'authenticated cannot execute kv_points_leaderboard()';
  end if;
  if has_schema_privilege('anon', 'kv_private', 'USAGE') or has_schema_privilege('authenticated', 'kv_private', 'USAGE') then
    raise exception 'kv_private must stay without USAGE for anon / authenticated';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Dropping the function does NOT bring back the old leaderboard view path: an
-- app version that reads it then shows the ranking error state (with a retry)
-- until it is re-applied. Roll the app back first if that is not acceptable.
-- Nothing else (profiles, check-ins, the leaderboard view) is touched.
--
--   drop function if exists public.kv_points_leaderboard();
