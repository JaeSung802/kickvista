-- ═══════════════════════════════════════════════════════════════════
-- KickVista: ENABLE attendance check-in payouts (kv_private.flags)
--
-- Run ONLY in the final resume step: after attendance-checkin-rpc.sql and
-- attendance-write-lockdown.sql, with the resume conditions met, right before
-- (or together with) the app deploy that sets ATTENDANCE_CHECKIN_PAUSED = false.
--
-- Changes only the row 'attendance_checkin_payout' of kv_private.flags.
-- LOCK TABLE ... IN EXCLUSIVE MODE conflicts with the ROW SHARE lock every
-- kv_daily_checkin() call takes when it reads the switch (FOR SHARE): it
-- waits until calls that already passed the payout check have committed or
-- rolled back, and calls arriving meanwhile queue behind it and then see the
-- new value. Plain reads (J_attendance_payout_state.sql) are not blocked.
-- If such a call does not finish within lock_timeout this file fails and
-- changes nothing — the switch is then NOT done; check what is running and
-- run it again. Success (COMMIT) is the point from which the new value holds.
-- ═══════════════════════════════════════════════════════════════════

begin;
set local lock_timeout = '30s';

do $$
begin
  if to_regclass('kv_private.flags') is null
     or coalesce(obj_description('kv_private.flags'::regclass, 'pg_class'), '') not like 'kickvista:flags%' then
    raise exception 'kv_private.flags is missing; apply attendance-checkin-rpc.sql first';
  end if;
  if not exists (select 1 from kv_private.flags where name = 'attendance_checkin_payout') then
    raise exception 'payout flag row is missing';
  end if;
end
$$;

lock table kv_private.flags in exclusive mode;

update kv_private.flags
   set enabled = true, updated_at = now(), updated_by = current_user
 where name = 'attendance_checkin_payout';

do $$
begin
  if (select enabled from kv_private.flags where name = 'attendance_checkin_payout') is distinct from true then
    raise exception 'payout flag was not set';
  end if;
end
$$;

commit;

select name, enabled, updated_at, updated_by from kv_private.flags where name = 'attendance_checkin_payout';
