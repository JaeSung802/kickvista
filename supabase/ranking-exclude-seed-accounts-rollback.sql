-- ═══════════════════════════════════════════════════════════════════
-- KickVista: undo ranking-exclude-seed-accounts.sql (owner only).
-- Removes ONLY rows of batch 'seed-accounts-2026-10-16' whose account is one of
-- the 15 seed accounts (auth e-mail seed_user_01..15@kickvista-seed.local).
-- Any other exclusion row (other batch, other reason, other account) stays.
-- Stops (nothing removed) if the batch holds anything else or more than 15 rows.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
declare
  v_batch   integer;
  v_targets integer;
begin
  if to_regclass('kv_ranking.ranking_exclusions') is null then
    raise exception 'kv_ranking.ranking_exclusions does not exist; nothing to undo';
  end if;
  select count(*) into v_batch from kv_ranking.ranking_exclusions where batch = 'seed-accounts-2026-10-16';
  select count(*) into v_targets
    from kv_ranking.ranking_exclusions x join auth.users u on u.id = x.user_id
   where x.batch = 'seed-accounts-2026-10-16' and x.reason = 'seed_account'
     and u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$';
  if v_batch > 15 or v_batch <> v_targets then
    raise exception 'batch seed-accounts-2026-10-16 holds % rows, % of them the seed accounts; stop', v_batch, v_targets;
  end if;
end
$$;

delete from kv_ranking.ranking_exclusions x
 using auth.users u
 where u.id = x.user_id
   and x.batch = 'seed-accounts-2026-10-16'
   and x.reason = 'seed_account'
   and u.email ~ '^seed_user_(0[1-9]|1[0-5])@kickvista-seed\.local$';

do $$
begin
  if exists (select 1 from kv_ranking.ranking_exclusions where batch = 'seed-accounts-2026-10-16') then
    raise exception 'rows of batch seed-accounts-2026-10-16 remain';
  end if;
end
$$;

commit;
