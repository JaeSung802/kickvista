"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PostCategory } from "./types";

// ─── Rank helpers ─────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700",
  diamond: "#a8d8f0", legend: "#22c55e",
};

function getRankTier(totalPoints: number): string {
  if (totalPoints >= 5000) return "legend";
  if (totalPoints >= 2000) return "diamond";
  if (totalPoints >= 1000) return "gold";
  if (totalPoints >= 300)  return "silver";
  return "bronze";
}

function getRankBadge(tier: string): string {
  const badges: Record<string, string> = {
    legend: "👑", diamond: "💎", gold: "🥇", silver: "🥈", bronze: "🥉",
  };
  return badges[tier] ?? "🥉";
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Shared row types for query results ───────────────────────────

interface AuthorJoin {
  id: string;
  nickname: string;
  total_points: number;
}

function extractAuthor(raw: AuthorJoin | AuthorJoin[] | null): AuthorJoin {
  const a = Array.isArray(raw) ? raw[0] : raw;
  return a ?? { id: "", nickname: "unknown", total_points: 0 };
}

// ─── listPosts ────────────────────────────────────────────────────

export interface ListPostsParams {
  category?: PostCategory | null;
  sort?: "hot" | "latest" | "trending";
  page?: number;
  limit?: number;
  excludeId?: string;
  teamSlug?: string | null;
  leagueSlug?: string | null;
}

export interface PostListItem {
  id: string;
  category: PostCategory;
  title: string;
  preview: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorBadge: string;
  rankTier: string;
  rankColor: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isHot: boolean;
  createdAt: string;
  timeAgo: string;
  teamSlug: string | null;
  leagueSlug: string | null;
}

export interface ListPostsResult {
  posts: PostListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function listPosts({
  category,
  sort = "hot",
  page = 1,
  limit = 20,
  excludeId,
  teamSlug,
  leagueSlug,
}: ListPostsParams = {}): Promise<ListPostsResult> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("community_posts")
    .select(
      `id, category, title, content, tags,
       view_count, like_count, comment_count, is_pinned, is_hot, created_at,
       team_slug, league_slug,
       author:profiles!author_id(id, nickname, total_points)`,
      { count: "exact" }
    );

  if (category)   query = query.eq("category", category);
  if (excludeId)  query = query.neq("id", excludeId);
  if (teamSlug)   query = query.eq("team_slug", teamSlug);
  if (leagueSlug) query = query.eq("league_slug", leagueSlug);

  switch (sort) {
    case "latest":
      query = query.order("created_at", { ascending: false });
      break;
    case "trending":
      query = query.order("view_count", { ascending: false })
                   .order("like_count", { ascending: false });
      break;
    default: // hot
      query = query.order("like_count", { ascending: false })
                   .order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    return { posts: [], total: 0, page, pageSize: limit, hasMore: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: PostListItem[] = (data as any[]).map((row) => {
    const author = extractAuthor(row.author);
    const tier   = getRankTier(author.total_points);
    return {
      id:           row.id,
      category:     row.category as PostCategory,
      title:        row.title,
      preview:      (row.content as string).slice(0, 200).replace(/\n+/g, " "),
      tags:         (row.tags as string[]) ?? [],
      authorId:     author.id,
      authorName:   author.nickname,
      authorBadge:  getRankBadge(tier),
      rankTier:     tier,
      rankColor:    RANK_COLORS[tier] ?? "#8b949e",
      likeCount:    row.like_count    ?? 0,
      commentCount: row.comment_count ?? 0,
      viewCount:    row.view_count    ?? 0,
      isPinned:     row.is_pinned     ?? false,
      isHot:        row.is_hot        ?? false,
      createdAt:    row.created_at,
      timeAgo:      relativeTime(row.created_at),
      teamSlug:     row.team_slug     ?? null,
      leagueSlug:   row.league_slug   ?? null,
    };
  });

  return {
    posts,
    total:    count ?? 0,
    page,
    pageSize: limit,
    hasMore:  (count ?? 0) > offset + limit,
  };
}

// ─── getPost ──────────────────────────────────────────────────────

export interface PostDetail {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorBadge: string;
  rankTier: string;
  rankColor: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isHot: boolean;
  createdAt: string;
  isLikedByUser: boolean;
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const user     = await getServerUser();

  const { data, error } = await supabase
    .from("community_posts")
    .select(
      `id, category, title, content, tags,
       view_count, like_count, comment_count, is_pinned, is_hot, created_at,
       author:profiles!author_id(id, nickname, total_points)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Fire-and-forget view increment
  supabase
    .from("community_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ view_count: ((data as any).view_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  let isLikedByUser = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("community_post_likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLikedByUser = !!likeRow;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row    = data as any;
  const author = extractAuthor(row.author);
  const tier   = getRankTier(author.total_points);

  return {
    id:           row.id,
    category:     row.category as PostCategory,
    title:        row.title,
    content:      row.content,
    tags:         row.tags ?? [],
    authorId:     author.id,
    authorName:   author.nickname,
    authorBadge:  getRankBadge(tier),
    rankTier:     tier,
    rankColor:    RANK_COLORS[tier] ?? "#8b949e",
    likeCount:    row.like_count    ?? 0,
    commentCount: row.comment_count ?? 0,
    viewCount:    row.view_count    ?? 0,
    isPinned:     row.is_pinned     ?? false,
    isHot:        row.is_hot        ?? false,
    createdAt:    row.created_at,
    isLikedByUser,
  };
}

// ─── createPost ───────────────────────────────────────────────────

export interface CreatePostInput {
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  teamSlug?: string | null;
  leagueSlug?: string | null;
}

export type CreatePostResult =
  | { id: string; error?: never }
  | { error: string; id?: never };

export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      author_id:   user.id,
      category:    input.category,
      title:       input.title.trim(),
      content:     input.content.trim(),
      tags:        input.tags.filter(Boolean),
      team_slug:   input.teamSlug   ?? null,
      league_slug: input.leagueSlug ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "insert failed" };

  revalidatePath("/[locale]/community", "page");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { id: (data as any).id };
}

// ─── listComments ─────────────────────────────────────────────────

export interface CommentAuthorData {
  id: string;
  nickname: string;
  rankBadge: string;
  rankTier: string;
  rankColor: string;
}

export interface ReplyData {
  id: string;
  author: CommentAuthorData;
  content: string;
  likeCount: number;
  createdAt: string;
  timeAgo: string;
}

export interface CommentData {
  id: string;
  author: CommentAuthorData;
  content: string;
  likeCount: number;
  createdAt: string;
  timeAgo: string;
  replies: ReplyData[];
}

function buildCommentAuthor(rawAuthor: AuthorJoin | AuthorJoin[] | null): CommentAuthorData {
  const a    = extractAuthor(rawAuthor);
  const tier = getRankTier(a.total_points);
  return {
    id:        a.id,
    nickname:  a.nickname,
    rankTier:  tier,
    rankBadge: getRankBadge(tier),
    rankColor: RANK_COLORS[tier] ?? "#8b949e",
  };
}

export async function listComments(postId: string): Promise<CommentData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_comments")
    .select(
      `id, post_id, parent_id, content, like_count, is_deleted, created_at,
       author:profiles!author_id(id, nickname, total_points)`
    )
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];

  const topLevel = rows.filter((r) => !r.parent_id);
  const replies  = rows.filter((r) => !!r.parent_id);

  return topLevel.map((c) => ({
    id:        c.id,
    author:    buildCommentAuthor(c.author),
    content:   c.content,
    likeCount: c.like_count ?? 0,
    createdAt: c.created_at,
    timeAgo:   relativeTime(c.created_at),
    replies:   replies
      .filter((r) => r.parent_id === c.id)
      .map((r) => ({
        id:        r.id,
        author:    buildCommentAuthor(r.author),
        content:   r.content,
        likeCount: r.like_count ?? 0,
        createdAt: r.created_at,
        timeAgo:   relativeTime(r.created_at),
      })),
  }));
}

// ─── createComment ────────────────────────────────────────────────

export type CreateCommentResult =
  | { comment: CommentData; error?: never }
  | { error: string; comment?: never };

export async function createComment(
  postId: string,
  content: string
): Promise<CreateCommentResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, author_id: user.id, content: content.trim() })
    .select(
      `id, content, like_count, created_at,
       author:profiles!author_id(id, nickname, total_points)`
    )
    .single();

  if (error || !data) return { error: error?.message ?? "insert failed" };

  revalidatePath(`/[locale]/community/post/${postId}`, "page");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    comment: {
      id:        row.id,
      author:    buildCommentAuthor(row.author),
      content:   row.content,
      likeCount: 0,
      createdAt: row.created_at,
      timeAgo:   "just now",
      replies:   [],
    },
  };
}

// ─── createReply ──────────────────────────────────────────────────

export type CreateReplyResult =
  | { reply: ReplyData; error?: never }
  | { error: string; reply?: never };

export async function createReply(
  postId: string,
  parentId: string,
  content: string
): Promise<CreateReplyResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: user.id, content: content.trim() })
    .select(
      `id, content, like_count, created_at,
       author:profiles!author_id(id, nickname, total_points)`
    )
    .single();

  if (error || !data) return { error: error?.message ?? "insert failed" };

  revalidatePath(`/[locale]/community/post/${postId}`, "page");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    reply: {
      id:        row.id,
      author:    buildCommentAuthor(row.author),
      content:   row.content,
      likeCount: 0,
      createdAt: row.created_at,
      timeAgo:   "just now",
    },
  };
}

// ─── togglePostLike ───────────────────────────────────────────────

export type ToggleLikeResult =
  | { liked: boolean; count: number; error?: never }
  | { error: string; liked?: never; count?: never };

export async function togglePostLike(postId: string): Promise<ToggleLikeResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("community_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("community_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("community_post_likes")
      .insert({ post_id: postId, user_id: user.id });
  }

  const { data: updated } = await supabase
    .from("community_posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  return {
    liked: !existing,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: (updated as any)?.like_count ?? 0,
  };
}
