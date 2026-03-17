-- ═══════════════════════════════════════════════════════════════════
-- KickVista Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────────────
-- One row per authenticated user. Created automatically on first sign-in
-- via the OAuth callback (ensureProfile).

create table if not exists public.profiles (
  id              uuid        primary key references auth.users (id) on delete cascade,
  nickname        text        not null default '',
  avatar_url      text,
  total_points    integer     not null default 0,
  current_streak  integer     not null default 0,
  favorite_league text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for leaderboard queries
create index if not exists profiles_total_points_idx on public.profiles (total_points desc);

-- ─── attendance_logs ──────────────────────────────────────────────
-- One row per (user, calendar-date) check-in. The unique constraint
-- makes the daily check-in naturally idempotent.

create table if not exists public.attendance_logs (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references public.profiles (id) on delete cascade,
  attendance_date  date        not null,
  points_earned    integer     not null default 10,
  streak_day       integer     not null default 1,
  created_at       timestamptz not null default now(),

  constraint attendance_logs_user_date_unique unique (user_id, attendance_date)
);

create index if not exists attendance_logs_user_date_idx
  on public.attendance_logs (user_id, attendance_date desc);

-- ─── Row Level Security ───────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.attendance_logs enable row level security;

-- profiles: users can only read/write their own row
create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- attendance_logs: users can only read/write their own logs
create policy "attendance_logs: owner read"
  on public.attendance_logs for select
  using (auth.uid() = user_id);

create policy "attendance_logs: owner insert"
  on public.attendance_logs for insert
  with check (auth.uid() = user_id);

-- ─── Leaderboard view (public read) ──────────────────────────────
-- Shows nickname + points + streak for the top-100. No PII exposed.

create or replace view public.leaderboard as
  select
    nickname,
    total_points,
    current_streak,
    created_at
  from public.profiles
  order by total_points desc
  limit 100;

-- Grant anonymous/authenticated read access to the leaderboard view
grant select on public.leaderboard to anon, authenticated;

-- ─── Trigger: auto-update updated_at on profiles ─────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
