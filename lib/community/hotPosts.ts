import { listPosts } from "./actions";
import type { ListPostsResult, ListPostsParams } from "./actions";

// ─── Hot score formula ────────────────────────────────────────────────────────
// (likes * 3 + comments * 2 + views * 0.1) / (ageHours + 2) ^ 1.3

export function computeHotScore(
  likeCount: number,
  commentCount: number,
  viewCount: number,
  createdAt: string
): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  const score = likeCount * 3 + commentCount * 2 + viewCount * 0.1;
  return score / Math.pow(ageHours + 2, 1.3);
}

// ─── listHotPosts ─────────────────────────────────────────────────────────────
// Fetches up to 500 posts from the last 30 days, ranks them by hot score
// in-memory, then returns a paginated slice matching ListPostsResult shape.

export interface HotPostsParams {
  category?: ListPostsParams["category"];
  page?: number;
  limit?: number;
}

export async function listHotPosts({
  category,
  page = 1,
  limit = 20,
}: HotPostsParams = {}): Promise<ListPostsResult> {
  // Fetch a large candidate pool (last 30 days, up to 500)
  const pool = await listPosts({
    category,
    sort: "latest",
    page: 1,
    limit: 500,
  });

  const thirtyDaysAgo = Date.now() - 30 * 24 * 3_600_000;
  const candidates = pool.posts.filter(
    (p) => new Date(p.createdAt).getTime() >= thirtyDaysAgo
  );

  // Sort by hot score descending
  candidates.sort(
    (a, b) =>
      computeHotScore(b.likeCount, b.commentCount, b.viewCount, b.createdAt) -
      computeHotScore(a.likeCount, a.commentCount, a.viewCount, a.createdAt)
  );

  const total = candidates.length;
  const offset = (page - 1) * limit;
  const pagePosts = candidates.slice(offset, offset + limit);

  return {
    posts: pagePosts,
    total,
    page,
    pageSize: limit,
    hasMore: offset + limit < total,
  };
}

// ─── listLatestPosts ──────────────────────────────────────────────────────────

export async function listLatestPosts(
  params: HotPostsParams = {}
): Promise<ListPostsResult> {
  return listPosts({ ...params, sort: "latest" });
}
