-- ═══════════════════════════════════════════════════════════════════
-- KickVista Community Report System
-- Run in Supabase SQL editor AFTER schema.sql, community.sql, admin.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── community_post_reports ──────────────────────────────────────

create table if not exists public.community_post_reports (
  id           uuid        primary key default gen_random_uuid(),
  reporter_id  uuid        not null
    references public.profiles (id) on delete cascade,
  post_id      uuid        not null
    references public.community_posts (id) on delete cascade,
  reason       text        not null
    check (reason in ('spam','harassment','misinformation','hate_speech','illegal','other')),
  details      text,
  status       text        not null default 'open'
    check (status in ('open','reviewed','dismissed','actioned')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid
    references public.profiles (id) on delete set null,

  -- One report per user per post
  constraint community_post_reports_unique unique (reporter_id, post_id)
);

create index if not exists community_post_reports_post_idx
  on public.community_post_reports (post_id);
create index if not exists community_post_reports_status_idx
  on public.community_post_reports (status)
  where status = 'open';
create index if not exists community_post_reports_created_idx
  on public.community_post_reports (created_at desc);

-- ─── community_comment_reports ───────────────────────────────────

create table if not exists public.community_comment_reports (
  id           uuid        primary key default gen_random_uuid(),
  reporter_id  uuid        not null
    references public.profiles (id) on delete cascade,
  comment_id   uuid        not null
    references public.community_comments (id) on delete cascade,
  reason       text        not null
    check (reason in ('spam','harassment','misinformation','hate_speech','illegal','other')),
  details      text,
  status       text        not null default 'open'
    check (status in ('open','reviewed','dismissed','actioned')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid
    references public.profiles (id) on delete set null,

  -- One report per user per comment
  constraint community_comment_reports_unique unique (reporter_id, comment_id)
);

create index if not exists community_comment_reports_comment_idx
  on public.community_comment_reports (comment_id);
create index if not exists community_comment_reports_status_idx
  on public.community_comment_reports (status)
  where status = 'open';
create index if not exists community_comment_reports_created_idx
  on public.community_comment_reports (created_at desc);

-- ─── Row Level Security ───────────────────────────────────────────

alter table public.community_post_reports    enable row level security;
alter table public.community_comment_reports enable row level security;

-- Authenticated users can submit reports (must own the reporter_id row)
create policy "community_post_reports: auth insert"
  on public.community_post_reports for insert
  with check (auth.uid() = reporter_id);

create policy "community_comment_reports: auth insert"
  on public.community_comment_reports for insert
  with check (auth.uid() = reporter_id);

-- Users can read their own reports; mods/admins can read all
create policy "community_post_reports: read"
  on public.community_post_reports for select
  using (
    auth.uid() = reporter_id
    or public.get_my_role() in ('admin', 'moderator')
  );

create policy "community_comment_reports: read"
  on public.community_comment_reports for select
  using (
    auth.uid() = reporter_id
    or public.get_my_role() in ('admin', 'moderator')
  );

-- Only mods/admins can update report status
create policy "community_post_reports: mod update"
  on public.community_post_reports for update
  using (public.get_my_role() in ('admin', 'moderator'));

create policy "community_comment_reports: mod update"
  on public.community_comment_reports for update
  using (public.get_my_role() in ('admin', 'moderator'));

-- ═══════════════════════════════════════════════════════════════════
