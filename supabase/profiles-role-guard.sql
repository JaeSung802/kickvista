-- ═══════════════════════════════════════════════════════════════════
-- KickVista: block self-service changes to profiles.role / is_banned
--
-- Forward migration. Run in the Supabase SQL editor AFTER schema.sql
-- and admin.sql. Safe to re-run: it only (re)creates one function and
-- one trigger that it owns (marked by a comment); no data, policy or
-- table grant on profiles is changed. It refuses to run if a function
-- or trigger with the same name exists that it did not create.
--
-- Why: the profiles owner INSERT/UPDATE policies in schema.sql only
-- check auth.uid() = id, so through the API a regular user could write
-- role = 'admin' on their own row, or clear is_banned.
--
-- Rules for callers using the API roles (anon / authenticated):
--   INSERT  role must be 'user' (or NULL) and is_banned false (or NULL).
--           NULL counts as the default, every other value is refused. (The
--           production catalog summary reports a nullable role without a
--           CHECK; the raw snapshot has not been reviewed yet.)
--   UPDATE  role / is_banned may change only when get_my_role() = 'admin'
--           (keeps updateUserRole / toggleUserBan in lib/admin/actions.ts).
--   INSERT ... ON CONFLICT DO UPDATE runs the INSERT check on the
--   proposed row and, on conflict, the UPDATE check as well.
-- Any other current_user (postgres, service_role, the owner inside a
-- SECURITY DEFINER function, the dashboard) passes untouched. No
-- SECURITY DEFINER function in this repo writes role or is_banned.
--
-- Scope: role and is_banned only. total_points / current_streak /
-- title_badge / avatar_border_color are still written by user-session
-- app flows (attendance, predictions, profile shop) and stay unguarded.
-- ═══════════════════════════════════════════════════════════════════

begin;

-- ─── 0. Preconditions ────────────────────────────────────────────

do $$
declare
  v_fn oid := to_regprocedure('public.profiles_guard_protected_fields()');
begin
  if to_regprocedure('public.get_my_role()') is null then
    raise exception 'public.get_my_role() is missing — apply supabase/admin.sql first';
  end if;

  if (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
        and column_name in ('role', 'is_banned')) <> 2 then
    raise exception 'profiles.role / profiles.is_banned are missing — apply supabase/admin.sql first';
  end if;

  -- Never overwrite a same-name function or trigger this file did not create.
  if v_fn is not null
     and obj_description(v_fn, 'pg_proc') is distinct from 'kickvista:profiles-role-guard' then
    raise exception 'public.profiles_guard_protected_fields() exists but was not created by this migration';
  end if;

  if exists (
    select 1 from pg_trigger t
    where t.tgrelid = 'public.profiles'::regclass
      and t.tgname = 'profiles_guard_protected_fields'
      and not t.tgisinternal
      and t.tgfoid is distinct from v_fn
  ) then
    raise exception 'trigger profiles_guard_protected_fields exists on public.profiles with another function';
  end if;
end
$$;

-- ─── 1. Guard function ───────────────────────────────────────────
-- SECURITY INVOKER on purpose: current_user is then the caller's role
-- ('authenticated' for API requests, the owner inside SECURITY DEFINER
-- functions, 'service_role' for the service key).

create or replace function public.profiles_guard_protected_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.role, 'user') <> 'user' or coalesce(new.is_banned, false) then
      raise exception 'profiles: role and is_banned cannot be set by the user'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- "is distinct from" also rejects a NULL role from get_my_role().
  if (new.role is distinct from old.role or new.is_banned is distinct from old.is_banned)
     and public.get_my_role() is distinct from 'admin' then
    raise exception 'profiles: only admins can change role or is_banned'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.profiles_guard_protected_fields() is 'kickvista:profiles-role-guard';

-- Trigger firing does not need EXECUTE; this only blocks direct calls.
revoke all on function public.profiles_guard_protected_fields() from public, anon, authenticated;

-- ─── 2. Trigger ──────────────────────────────────────────────────
-- Order relative to the existing updated_at trigger does not matter:
-- the guard only reads role / is_banned and never changes the row.

drop trigger if exists profiles_guard_protected_fields on public.profiles;

create trigger profiles_guard_protected_fields
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_protected_fields();

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Removes the guard (and re-opens the role / is_banned hole):
--
--   begin;
--   drop trigger if exists profiles_guard_protected_fields on public.profiles;
--   drop function if exists public.profiles_guard_protected_fields();
--   commit;
--
-- After a FIRST application (no guard before) this restores the previous
-- state: the preconditions refuse to touch same-name objects this file did
-- not create, and nothing else is changed.
-- After RE-applying over an earlier guard (same marker), it does NOT bring
-- that earlier version back — it removes the guard entirely. To return to
-- the earlier version, re-run that version's file instead. Note that
-- CREATE OR REPLACE keeps the existing function's owner and grants.
