-- ═══════════════════════════════════════════════════════════════════
-- KickVista: Add 'notice' category for admin announcements
-- Run in Supabase SQL editor AFTER community.sql and admin.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Update the category CHECK constraint ─────────────────────
-- PostgreSQL doesn't support ALTER CONSTRAINT directly, so we:
--   a) drop the old constraint
--   b) add a new one that includes 'notice'

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_category_check;

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_category_check
    CHECK (category IN (
      'match-discussion',
      'transfer-news',
      'tactics',
      'highlights',
      'predictions',
      'general',
      'notice'
    ));

-- ─── 2. RLS: only admins may INSERT a 'notice' post ──────────────
-- Drop the existing author-insert policy and replace it with one
-- that additionally blocks non-admins from writing notices.

DROP POLICY IF EXISTS "community_posts: author insert" ON public.community_posts;

CREATE POLICY "community_posts: author insert"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      category != 'notice'
      OR public.get_my_role() = 'admin'
    )
  );

-- ─── 3. RLS: only admins may UPDATE a post to/from 'notice' ──────
-- The existing moderator-update policy already covers admin updates.
-- This policy ensures the author-update path also enforces the rule.

DROP POLICY IF EXISTS "community_posts: author update" ON public.community_posts;

CREATE POLICY "community_posts: author update"
  ON public.community_posts FOR UPDATE
  USING (
    auth.uid() = author_id
    AND (
      category != 'notice'
      OR public.get_my_role() = 'admin'
    )
  );
