-- ═══════════════════════════════════════════════════════════════════
-- KickVista: ENABLE point shop sales (kv_private.flags)
--
-- Run ONLY when the app that calls kv_shop_purchase() serves the shop on the
-- production domain (the previous shop code, which overwrites the balance,
-- must no longer serve requests) and the shop resume is approved. This is the
-- moment purchases with points start again, for app and direct RPC calls.
--
-- Changes only the row 'shop_purchase' of kv_private.flags.
-- LOCK TABLE ... IN EXCLUSIVE MODE conflicts with the ROW SHARE lock every
-- kv_shop_purchase() call takes when it reads the switch (FOR SHARE): it
-- waits until calls that already passed the payout check have committed or
-- rolled back, and calls arriving meanwhile queue behind it and then see the
-- new value. Plain reads (J_points_switch_state.sql) are not blocked.
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
    raise exception 'kv_private.flags is missing; apply attendance-checkin-rpc.sql and shop-rpc.sql first';
  end if;
  if not exists (select 1 from kv_private.flags where name = 'shop_purchase') then
    raise exception 'shop_purchase flag row is missing';
  end if;
end
$$;

lock table kv_private.flags in exclusive mode;

update kv_private.flags
   set enabled = true, updated_at = now(), updated_by = current_user
 where name = 'shop_purchase';

do $$
begin
  if (select enabled from kv_private.flags where name = 'shop_purchase') is distinct from true then
    raise exception 'shop_purchase flag was not set';
  end if;
end
$$;

commit;

select name, enabled, updated_at, updated_by from kv_private.flags where name = 'shop_purchase';
