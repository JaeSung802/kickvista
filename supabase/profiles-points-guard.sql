-- ═══════════════════════════════════════════════════════════════════
-- KickVista: block self-service changes to profiles points / badges
--   total_points, current_streak, title_badge, avatar_border_color
--
-- Apply ONLY when no app path on the production domain still writes these
-- columns with the user's session:
--   - check-in uses kv_daily_checkin() (or is paused),
--   - the shop uses kv_shop_purchase() / kv_shop_equip(),
--   - prediction placement stays paused (placePrediction in lib/predictions.ts
--     still deducts with the session; it must move to an RPC before resuming).
-- Separate from profiles-role-guard.sql (role / is_banned), which is untouched.
--
-- Rules for callers using the API roles (anon / authenticated):
--   INSERT  the four columns must be their defaults (0, 0, 'Rookie' or NULL
--           for the badge, NULL border); ensureProfile() sends 0 / 0.
--   UPDATE  none of the four columns may change — for admins too (no admin
--           points feature exists).
-- Any other current_user passes: the owner inside the SECURITY DEFINER RPCs
-- (check-in, shop, settlement), service_role, postgres / dashboard.
-- Safe to re-run; refuses same-name objects it did not create.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  v_fn oid := to_regprocedure('public.profiles_guard_points()');
begin
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles'
        and column_name in ('total_points', 'current_streak', 'title_badge', 'avatar_border_color')) <> 4 then
    raise exception 'public.profiles is missing one of total_points / current_streak / title_badge / avatar_border_color';
  end if;
  if v_fn is not null and obj_description(v_fn, 'pg_proc') is distinct from 'kickvista:profiles-points-guard' then
    raise exception 'public.profiles_guard_points() exists but was not created by this migration';
  end if;
  if exists (select 1 from pg_trigger t where t.tgrelid = 'public.profiles'::regclass
               and t.tgname = 'profiles_guard_points' and not t.tgisinternal and t.tgfoid is distinct from v_fn) then
    raise exception 'trigger profiles_guard_points exists on public.profiles with another function';
  end if;
  if to_regprocedure('public.kv_daily_checkin()') is null or to_regprocedure('public.kv_shop_purchase(text)') is null
     or to_regprocedure('public.kv_shop_equip(text)') is null then
    raise exception 'apply attendance-checkin-rpc.sql and shop-rpc.sql (and deploy the app using them) first';
  end if;
end
$$;

-- SECURITY INVOKER on purpose: current_user is the caller's role, or the
-- owner inside the SECURITY DEFINER RPCs.
create or replace function public.profiles_guard_points()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if coalesce(new.total_points, 0) <> 0 or coalesce(new.current_streak, 0) <> 0
       or coalesce(new.title_badge, 'Rookie') <> 'Rookie' or new.avatar_border_color is not null then
      raise exception 'profiles: points and badges cannot be set by the user'
        using errcode = '42501';
    end if;
    return new;
  end if;
  if new.total_points is distinct from old.total_points
     or new.current_streak is distinct from old.current_streak
     or new.title_badge is distinct from old.title_badge
     or new.avatar_border_color is distinct from old.avatar_border_color then
    raise exception 'profiles: points and badges change only through KickVista RPCs'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

comment on function public.profiles_guard_points() is 'kickvista:profiles-points-guard';
revoke all on function public.profiles_guard_points() from public, anon, authenticated;

drop trigger if exists profiles_guard_points on public.profiles;
create trigger profiles_guard_points
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_points();

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Re-opens direct points / badge edits:
--
--   begin;
--   drop trigger if exists profiles_guard_points on public.profiles;
--   drop function if exists public.profiles_guard_points();
--   commit;
