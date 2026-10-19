-- ═══════════════════════════════════════════════════════════════════
-- KickVista: keep the 15 seed accounts off the points ranking (data change;
-- owner only). Apply AFTER points-leaderboard-rpc.sql v2.
--
-- Target = the accounts confirmed by Q_ranking_seed_origin (2026-10-16):
-- auth e-mail seed_user_01..15@kickvista-seed.local, each linked to a profile.
-- The nicknames are only a cross-check, never the selector; the expected set is
-- the production Q result (it has 월드컵광팬, not the script's 축구광팬). The transaction
-- stops (nothing is written) unless the target is exactly those 15 accounts,
-- none of them is an admin, and their nicknames are the 15 expected ones.
-- Only adds rows (batch 'seed-accounts-2026-10-16') to kv_ranking.ranking_exclusions:
-- no account, profile, point, check-in, post or comment is deleted or changed.
-- Prints no e-mail or id. Undo with ranking-exclude-seed-accounts-rollback.sql.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  v_expected_nicks text[] := array['손흥민12번','리버풀광팬','레알사랑해','바르셀로나12','맨시티팬','아스날건너','뮌헨충성단','PSG파리지앵',
                                   '인터밀라노','유벤투스팬','첼시블루스','BVB도르트','월드컵광팬','전술분석가','축구천재K'];
  v_domain   integer;
  v_pattern  integer;
  v_linked   integer;
  v_nicks    text[];
  v_admins   integer;
begin
  if to_regclass('kv_ranking.ranking_exclusions') is null then
    raise exception 'apply points-leaderboard-rpc.sql v2 first';
  end if;

  select count(*) into v_domain from auth.users u where u.email like '%@kickvista-seed.local';
  select count(*) into v_pattern from auth.users u where u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$';
  select count(*), array_agg(p.nickname order by p.nickname), count(*) filter (where p.role = 'admin')
    into v_linked, v_nicks, v_admins
    from auth.users u join public.profiles p on p.id = u.id
   where u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$';

  if v_domain <> 15 or v_pattern <> 15 or v_linked <> 15 then
    raise exception 'target changed: seed-domain % / pattern % / linked profiles % (expected 15 / 15 / 15)', v_domain, v_pattern, v_linked;
  end if;
  if v_admins <> 0 then
    raise exception 'target includes % admin profile(s); stop', v_admins;
  end if;
  if v_nicks is distinct from (select array_agg(n order by n) from unnest(v_expected_nicks) n) then
    raise exception 'target nicknames differ from the 15 confirmed seed nicknames; stop';
  end if;
end
$$;

insert into kv_ranking.ranking_exclusions (user_id, reason, batch, note)
select p.id, 'seed_account', 'seed-accounts-2026-10-16', 'auth e-mail seed_user_NN@kickvista-seed.local (confirmed by Q 2026-10-16)'
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$'
on conflict (user_id) do nothing;

do $$
begin
  if (select count(*) from kv_ranking.ranking_exclusions x join auth.users u on u.id = x.user_id
       where x.batch = 'seed-accounts-2026-10-16' and u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$') <> 15 then
    raise exception 'expected the 15 seed accounts in batch seed-accounts-2026-10-16 after insert';
  end if;
  if exists (select 1 from kv_ranking.ranking_exclusions x join public.profiles p on p.id = x.user_id where p.role = 'admin') then
    raise exception 'an admin profile is on the exclusion list';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- ranking-exclude-seed-accounts-rollback.sql (removes only this batch's rows).
