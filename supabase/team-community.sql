-- ─── Team & League context for community posts ────────────────────────────────
-- Run this migration to enable team- and league-scoped community boards.

alter table public.community_posts
  add column if not exists team_slug   text,
  add column if not exists league_slug text;

-- Partial indexes: skip nulls for size efficiency
create index if not exists community_posts_team_slug_idx
  on public.community_posts (team_slug)
  where team_slug is not null;

create index if not exists community_posts_league_slug_idx
  on public.community_posts (league_slug)
  where league_slug is not null;
