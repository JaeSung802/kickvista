-- ═══════════════════════════════════════════════════════════════════
-- KickVista — Predictions & Point Logs
-- Run in Supabase SQL editor after schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── predictions ─────────────────────────────────────────────────────────────
-- One prediction per (user, match). Users can only predict before the match starts.

create table if not exists public.predictions (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references public.profiles (id) on delete cascade,
  match_id         integer     not null,
  predicted_result text        not null check (predicted_result in ('HOME_WIN', 'DRAW', 'AWAY_WIN')),
  bet_amount       integer     not null default 10 check (bet_amount >= 10),
  status           text        not null default 'PENDING'
                               check (status in ('PENDING', 'WON', 'LOST', 'CANCELLED')),
  created_at       timestamptz not null default now(),

  constraint predictions_user_match_unique unique (user_id, match_id)
);

create index if not exists predictions_match_id_idx  on public.predictions (match_id);
create index if not exists predictions_user_id_idx   on public.predictions (user_id);

-- ─── point_logs ──────────────────────────────────────────────────────────────
-- Immutable ledger of all point changes (check-ins, bets, rewards).

create table if not exists public.point_logs (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  amount         integer     not null, -- positive = earned, negative = spent
  reason         text        not null
                             check (reason in ('daily_checkin', 'match_bet', 'bet_reward')),
  reference_id   text,                 -- prediction id or attendance_log id
  created_at     timestamptz not null default now()
);

create index if not exists point_logs_user_id_idx
  on public.point_logs (user_id, created_at desc);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.predictions enable row level security;
alter table public.point_logs  enable row level security;

-- predictions: users read/insert their own rows only
create policy "predictions: owner read"
  on public.predictions for select
  using (auth.uid() = user_id);

create policy "predictions: owner insert"
  on public.predictions for insert
  with check (auth.uid() = user_id);

-- point_logs: users read/insert their own rows only
create policy "point_logs: owner read"
  on public.point_logs for select
  using (auth.uid() = user_id);

create policy "point_logs: owner insert"
  on public.point_logs for insert
  with check (auth.uid() = user_id);

-- ─── get_prediction_stats(match_id) — SECURITY DEFINER RPC ───────────────────
-- Returns aggregated vote counts per result (no PII). Open to all callers.

create or replace function public.get_prediction_stats(p_match_id integer)
returns table (
  predicted_result text,
  vote_count       bigint
)
security definer
set search_path = public
language sql
stable
as $$
  select predicted_result, count(*) as vote_count
  from predictions
  where match_id = p_match_id
    and status <> 'CANCELLED'
  group by predicted_result;
$$;

grant execute on function public.get_prediction_stats(integer) to anon, authenticated;

-- ─── settle_predictions(match_id, final_result) — SECURITY DEFINER RPC ───────
-- Called by cron/admin after a match ends.
-- Marks PENDING predictions WON/LOST and awards bet * 2 to winners.

create or replace function public.settle_predictions(
  p_match_id     integer,
  p_final_result text
)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_pred     record;
  v_reward   integer;
  v_settled  integer := 0;
  v_rewarded integer := 0;
begin
  for v_pred in
    select * from predictions
    where match_id = p_match_id and status = 'PENDING'
  loop
    v_settled := v_settled + 1;

    if v_pred.predicted_result = p_final_result then
      v_reward := v_pred.bet_amount * 2;

      update profiles
         set total_points = total_points + v_reward
       where id = v_pred.user_id;

      insert into point_logs (user_id, amount, reason, reference_id)
      values (v_pred.user_id, v_reward, 'bet_reward', v_pred.id::text);

      update predictions set status = 'WON'  where id = v_pred.id;
      v_rewarded := v_rewarded + 1;
    else
      update predictions set status = 'LOST' where id = v_pred.id;
    end if;
  end loop;

  return jsonb_build_object('settled', v_settled, 'rewarded', v_rewarded);
end;
$$;

-- Restrict settle_predictions to authenticated callers only
-- (additional CRON_SECRET check is enforced at the API layer)
grant execute on function public.settle_predictions(integer, text) to authenticated;
