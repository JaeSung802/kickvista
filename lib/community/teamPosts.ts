import { listPosts } from "./actions";
import type { ListPostsResult, ListPostsParams } from "./actions";

// ─── getPostsByTeam ───────────────────────────────────────────────────────────
// team_slug 컬럼이 DB에 없으므로 팀 필터 없이 전체 게시글 반환

export interface TeamPostsParams {
  category?: ListPostsParams["category"];
  sort?:     ListPostsParams["sort"];
  page?:     number;
  limit?:    number;
}

export async function getPostsByTeam(
  _teamSlug: string,
  params: TeamPostsParams = {}
): Promise<ListPostsResult> {
  return listPosts({ ...params });
}

// ─── getPostsByLeague ─────────────────────────────────────────────────────────
// league_slug 컬럼이 DB에 없으므로 리그 필터 없이 전체 게시글 반환

export async function getPostsByLeague(
  _leagueSlug: string,
  params: TeamPostsParams = {}
): Promise<ListPostsResult> {
  return listPosts({ ...params });
}
