"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getServerRole, isAdmin, canModerate } from "@/lib/admin/roles";
import { USER_POST_CATEGORIES, type PostCategory } from "./types";

// ─── Rank helpers ─────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700",
  diamond: "#a8d8f0", legend: "#059669",
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
  excludeNotice?: boolean;
  /** "only" = pinned posts only; omitted = pinned and regular posts (unchanged behaviour). */
  pinned?: "only";
  /** Post ids to leave out (e.g. the pinned posts already shown above the list). */
  excludeIds?: string[];
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
  imageUrl: string | null;
  teamSlug: string | null;
  leagueSlug: string | null;
}

export interface ListPostsResult {
  posts: PostListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** true when the query failed (posts is then empty, not "no posts") */
  failed?: boolean;
}

export async function listPosts({
  category,
  sort = "hot",
  page = 1,
  limit = 20,
  excludeId,
  excludeNotice = false,
  pinned,
  excludeIds,
}: ListPostsParams = {}): Promise<ListPostsResult> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("community_posts")
    .select(
      `id, category, title, content, tags, image_url,
       view_count, like_count, comment_count, is_pinned, is_hot, created_at,
       author:profiles!author_id(id, nickname, total_points)`,
      { count: "exact" }
    );

  // RLS 우회 보조 필터 — admin.sql의 visible-read 정책이 적용 안 될 경우 대비
  query = query.eq("is_hidden", false).is("deleted_at", null);

  if (category)                  query = query.eq("category", category);
  else if (excludeNotice)        query = query.neq("category", "notice");
  if (excludeId)                 query = query.neq("id", excludeId);
  if (pinned === "only")         query = query.eq("is_pinned", true);
  if (excludeIds?.length)        query = query.not("id", "in", `(${excludeIds.join(",")})`);
  // team_slug / league_slug 컬럼 없음 — 필터 제거

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

  // Pinned posts: id as a tie-breaker so posts with the same created_at are always
  // picked and ordered the same way (the list leaves out exactly the ones shown).
  if (pinned === "only") query = query.order("id", { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    console.error("[listPosts] query error:", error?.message, error?.details, error?.hint);
    return { posts: [], total: 0, page, pageSize: limit, hasMore: false, failed: true };
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
      imageUrl:     row.image_url     ?? null,
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

// ─── listNotices ──────────────────────────────────────────────────
// Fetches notice-category posts ordered by pinned-first, then newest.
// No auth required — SELECT is open to all via public read RLS policy.

export interface NoticeItem {
  id: string;
  title: string;
  createdAt: string;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
}

export async function listNotices(limit = 50): Promise<NoticeItem[]> {
  const supabase = await createClient();

  // Use ilike for case-insensitive match in case of capitalisation drift
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, created_at, is_pinned, view_count, like_count")
    .ilike("category", "notice")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listNotices] Supabase error:", error.message, error.code);
    return [];
  }
  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id:        row.id as string,
    title:     row.title as string,
    createdAt: row.created_at as string,
    isPinned:  (row.is_pinned as boolean) ?? false,
    viewCount: (row.view_count as number) ?? 0,
    likeCount: (row.like_count as number) ?? 0,
  }));
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
  imageUrl: string | null;
  /** Soft-deleted or hidden (only moderators can still open it). */
  isRemoved: boolean;
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const user     = await getServerUser();

  const { data, error } = await supabase
    .from("community_posts")
    .select(
      `id, category, title, content, tags, image_url,
       view_count, like_count, comment_count, is_pinned, is_hot, created_at,
       deleted_at, is_hidden,
       author:profiles!author_id(id, nickname, total_points)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

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
    imageUrl:     row.image_url     ?? null,
    isRemoved:    !!row.deleted_at || !!row.is_hidden,
  };
}

// ─── recordPostView ───────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Counts one view through increment_post_view() (atomic +1; hidden, deleted
 * or missing posts are a no-op). Called once per mount by PostViewTracker,
 * never while rendering, so metadata, re-renders and revalidation after a
 * comment do not count again. Best-effort: errors are ignored.
 */
export async function recordPostView(postId: string): Promise<void> {
  if (typeof postId !== "string" || !UUID_RE.test(postId)) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_post_view", { p_post_id: postId });
  } catch {
    // ignore — the view count is best-effort
  }
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

  if (input.category === "notice") {
    const role = await getServerRole();
    if (!isAdmin(role)) return { error: "unauthorized" };
  }

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

// ─── Author edit / delete ─────────────────────────────────────────
// Only the author may edit or delete their own post; notices also need
// the admin role (same rule as createPost and the notice RLS policies).
// RLS enforces the same on the database side.

export type OwnPostError = "unauthenticated" | "forbidden" | "not_found" | "invalid" | "unavailable" | "failed";

export interface EditablePost {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
}

interface OwnPostRow {
  id: string;
  author_id: string;
  category: PostCategory;
  title: string;
  content: string;
  tags: string[] | null;
  deleted_at: string | null;
  is_hidden: boolean | null;
}

/** Loads a post the signed-in user may edit (no view-count side effect). */
async function loadOwnPost(
  postId: string
): Promise<{ row: OwnPostRow; userId: string; error?: never } | { error: OwnPostError; row?: never; userId?: never }> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, author_id, category, title, content, tags, deleted_at, is_hidden")
    .eq("id", postId)
    .maybeSingle();
  if (error) return { error: "failed" };
  const row = data as OwnPostRow | null;
  if (!row || row.deleted_at || row.is_hidden) return { error: "not_found" };
  if (row.author_id !== user.id) return { error: "forbidden" };
  if (row.category === "notice" && !isAdmin(await getServerRole())) return { error: "forbidden" };
  return { row, userId: user.id };
}

export async function getEditablePost(
  postId: string
): Promise<{ post: EditablePost; error?: never } | { error: OwnPostError; post?: never }> {
  const r = await loadOwnPost(postId);
  if (r.error) return { error: r.error };
  const { row } = r;
  return {
    post: { id: row.id, category: row.category, title: row.title, content: row.content, tags: row.tags ?? [] },
  };
}

export interface UpdatePostInput {
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
}

export type OwnPostResult = { ok: true; error?: never } | { error: OwnPostError; ok?: never };

function revalidateCommunity(postId: string) {
  revalidatePath("/[locale]/community", "layout");
  revalidatePath(`/[locale]/community/post/${postId}`, "page");
}

/** Edits title, content, category and tags of the caller's own post. Nothing else is written. */
export async function updatePost(postId: string, input: UpdatePostInput): Promise<OwnPostResult> {
  const r = await loadOwnPost(postId);
  if (r.error) return { error: r.error };
  const { row, userId } = r;

  const title   = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";
  const tags    = Array.isArray(input.tags)
    ? [...new Set(input.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean))]
    : [];
  if (title.length < 5 || title.length > 120 || content.length < 20) return { error: "invalid" };

  // Allowed: the user categories, the post's current one, and 'notice' for admins.
  const category = input.category;
  const isAdminUser = category === "notice" || row.category === "notice" ? isAdmin(await getServerRole()) : false;
  const allowed =
    USER_POST_CATEGORIES.includes(category) || category === row.category || (category === "notice" && isAdminUser);
  if (!allowed) return { error: category === "notice" ? "forbidden" : "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .update({ title, content, category, tags })
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id");
  if (error) return { error: error.code === "42501" ? "forbidden" : "failed" };
  if (!data || data.length === 0) return { error: "forbidden" };

  revalidateCommunity(postId);
  return { ok: true };
}

/**
 * Soft-deletes the caller's own post (deleted_at / deleted_by, like the admin
 * delete). Regular authors go through kv_soft_delete_own_post(), because the
 * read policy hides deleted rows and blocks a direct update; moderators can
 * still use the direct update when that function is not installed.
 */
export async function deletePost(postId: string): Promise<OwnPostResult> {
  const r = await loadOwnPost(postId);
  if (r.error) return { error: r.error };
  const { userId } = r;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kv_soft_delete_own_post", { p_post_id: postId });
  if (!error) {
    if (data === "deleted" || data === "already_deleted") {
      revalidateCommunity(postId);
      return { ok: true };
    }
    return { error: data === "forbidden" ? "forbidden" : "not_found" };
  }

  const missing = error.code === "PGRST202" || error.code === "42883";
  if (!missing) return { error: "failed" };
  if (!canModerate(await getServerRole())) return { error: "unavailable" };

  const { data: rows, error: updError } = await supabase
    .from("community_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, delete_reason: null } as any)
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id");
  if (updError) return { error: "failed" };
  if (!rows || rows.length === 0) return { error: "forbidden" };

  revalidateCommunity(postId);
  return { ok: true };
}

// ─── listComments ─────────────────────────────────────────────────

export interface CommentAuthorData {
  id: string;
  nickname: string;
  rankBadge: string;
  rankTier: string;
  rankColor: string;
}

/** "deleted" (by its author or a moderator) or "hidden" (by a moderator): shown as a placeholder, no text. */
export type CommentRemoved = "deleted" | "hidden" | null;

export interface ReplyData {
  id: string;
  author: CommentAuthorData;
  content: string;
  likeCount: number;
  createdAt: string;
  timeAgo: string;
  removed?: CommentRemoved;
}

export interface CommentData {
  id: string;
  author: CommentAuthorData;
  content: string;
  likeCount: number;
  createdAt: string;
  timeAgo: string;
  replies: ReplyData[];
  removed?: CommentRemoved;
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

interface ThreadRow {
  id: string;
  parent_id: string | null;
  removed: CommentRemoved;
  content: string | null;
  like_count: number | null;
  created_at: string;
  author_id: string | null;
  author_nickname: string | null;
  author_points: number | null;
}

const REMOVED_AUTHOR: CommentAuthorData = { id: "", nickname: "", rankBadge: "", rankTier: "", rankColor: "#d1d5db" };

function threadToComments(rows: ThreadRow[]): CommentData[] {
  const toItem = (r: ThreadRow) => ({
    id:        r.id,
    author:    r.removed ? REMOVED_AUTHOR
               : buildCommentAuthor({ id: r.author_id ?? "", nickname: r.author_nickname ?? "unknown", total_points: r.author_points ?? 0 }),
    content:   r.removed ? "" : r.content ?? "",
    likeCount: r.removed ? 0 : r.like_count ?? 0,
    createdAt: r.created_at,
    timeAgo:   relativeTime(r.created_at),
    removed:   r.removed ?? null,
  });
  return rows
    .filter((r) => !r.parent_id)
    .map((c) => ({ ...toItem(c), replies: rows.filter((r) => r.parent_id === c.id).map(toItem) }));
}

/**
 * The comment thread of a post. Uses kv_list_post_comments(): deleted and
 * hidden comments stay in place as placeholders (no text or author), so
 * replies keep their parent and the list matches comment_count. Falls back
 * to the old direct read while that function is not installed.
 */
export async function listComments(postId: string): Promise<CommentData[]> {
  const supabase = await createClient();

  const { data: thread, error: threadError } = await supabase.rpc("kv_list_post_comments", { p_post_id: postId });
  if (!threadError) return threadToComments((thread ?? []) as ThreadRow[]);
  if (threadError.code !== "PGRST202" && threadError.code !== "42883") return [];

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
    removed:   null,
    replies:   replies
      .filter((r) => r.parent_id === c.id)
      .map((r) => ({
        id:        r.id,
        author:    buildCommentAuthor(r.author),
        content:   r.content,
        likeCount: r.like_count ?? 0,
        createdAt: r.created_at,
        timeAgo:   relativeTime(r.created_at),
        removed:   null,
      })),
  }));
}

// ─── deleteComment ────────────────────────────────────────────────

export type DeleteCommentError = "unauthenticated" | "not_found" | "unavailable" | "failed";
export type DeleteCommentResult = { ok: true; error?: never } | { error: DeleteCommentError; ok?: never };

const COMMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Soft-deletes the caller's own comment or reply through
 * kv_soft_delete_own_comment(): the database checks the author with
 * auth.uid(); only the comment id is sent. comment_count does not change.
 */
export async function deleteComment(postId: string, commentId: string): Promise<DeleteCommentResult> {
  if (typeof commentId !== "string" || !COMMENT_ID_RE.test(commentId)) return { error: "not_found" };
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kv_soft_delete_own_comment", { p_comment_id: commentId });
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") return { error: "unavailable" };
    if (error.code === "28000") return { error: "unauthenticated" };
    return { error: "failed" };
  }
  if (data === "deleted" || data === "already_deleted") {
    if (typeof postId === "string" && COMMENT_ID_RE.test(postId)) {
      revalidatePath(`/[locale]/community/post/${postId}`, "page");
    }
    return { ok: true };
  }
  return { error: "not_found" };
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
      removed:   null,
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
      removed:   null,
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

  let liked: boolean;
  if (existing) {
    const { error } = await supabase
      .from("community_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { error: "failed" };
    liked = false;
  } else {
    const { error } = await supabase
      .from("community_post_likes")
      .insert({ post_id: postId, user_id: user.id });
    // 23505: a parallel request already added this like — it is liked.
    if (error && error.code !== "23505") return { error: error.code === "42501" ? "unavailable" : "failed" };
    liked = true;
  }

  const { data: updated } = await supabase
    .from("community_posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  return {
    liked,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: (updated as any)?.like_count ?? 0,
  };
}
