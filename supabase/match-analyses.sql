-- ═══════════════════════════════════════════════════════════════════
-- KickVista: AI Match Analyses
-- Run in Supabase SQL editor AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.match_analyses (
  id           uuid        primary key default gen_random_uuid(),
  fixture_id   integer     not null,
  type         text        not null check (type in ('preview', 'recap')),
  locale       text        not null check (locale in ('en', 'ko')),
  slug         text        not null,
  title        text        not null,
  summary      text        not null,
  insight      text        not null,
  prediction   jsonb,
  key_factors  jsonb       not null default '[]',
  tips         jsonb       not null default '[]',
  league_id    integer,
  league_slug  text,
  home_team    text,
  away_team    text,
  match_date   timestamptz,
  ai_model     text        not null default 'claude-opus-4-6',
  generated_at timestamptz not null default now(),

  unique (fixture_id, type, locale)
);

create index if not exists match_analyses_slug_idx
  on public.match_analyses (slug);
create index if not exists match_analyses_locale_type_idx
  on public.match_analyses (locale, type, generated_at desc);
create index if not exists match_analyses_generated_idx
  on public.match_analyses (generated_at desc);

-- Public read — no auth required
alter table public.match_analyses enable row level security;

create policy "match_analyses: public read"
  on public.match_analyses for select
  using (true);

-- Only service role (cron) can write
create policy "match_analyses: service insert"
  on public.match_analyses for insert
  with check (true);

create policy "match_analyses: service upsert"
  on public.match_analyses for update
  using (true);
