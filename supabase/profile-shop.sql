-- ═══════════════════════════════════════════════════════════════════
-- KickVista — Profile Shop & Settlement Notification
-- Run in Supabase SQL editor AFTER predictions.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── predictions: add notification flag & team names ─────────────────────────

alter table public.predictions
  add column if not exists is_notified     boolean not null default false;

-- Store team names at bet-time so the notification modal can display them
-- without needing a Football API call.
alter table public.predictions
  add column if not exists home_team_name  text;

alter table public.predictions
  add column if not exists away_team_name  text;

-- ─── profiles: add customization columns ─────────────────────────────────────

-- Hex color string for the avatar ring (e.g. '#eab308' for gold). Null = default.
alter table public.profiles
  add column if not exists avatar_border_color text default null;

-- Display badge next to nickname. Default is the entry-level 'Rookie' title.
alter table public.profiles
  add column if not exists title_badge text not null default 'Rookie';

-- ─── RLS: allow owner to update the new columns ──────────────────────────────
-- The existing "profiles: owner update" policy already covers any column on the
-- profiles table, so no new policies are required.

-- Allow owners to update is_notified on their own predictions
create policy "predictions: owner update notify"
  on public.predictions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
