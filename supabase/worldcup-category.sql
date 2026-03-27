-- ═══════════════════════════════════════════════════════════════════
-- KickVista: Add worldcup-2026 category + image_url column
-- Run this in the Supabase SQL editor AFTER community.sql and admin.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Drop the old category CHECK constraint ────────────────────
-- PostgreSQL doesn't support ALTER CONSTRAINT directly, so we must
-- drop and re-add it.

alter table public.community_posts
  drop constraint if exists community_posts_category_check;

-- ─── 2. Add updated constraint including worldcup-2026 ─────────────

alter table public.community_posts
  add constraint community_posts_category_check
  check (category in (
    'match-discussion',
    'transfer-news',
    'tactics',
    'highlights',
    'predictions',
    'general',
    'notice',
    'worldcup-2026'
  ));

-- ─── 3. Add image_url column if not already present ───────────────

alter table public.community_posts
  add column if not exists image_url text;
