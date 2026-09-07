import { listPosts } from "./actions";
import type { ListPostsResult, ListPostsParams } from "./actions";

// ─── getPostsByTeam ───────────────────────────────────────────────────────────

export interface TeamPostsParams {
  category?: ListPostsParams["category"];
  sort?:     ListPostsParams["sort"];
  page?:     number;
  limit?:    number;
}

export async function getPostsByTeam(
  teamSlug: string,
  params: TeamPostsParams = {}
): Promise<ListPostsResult> {
  return listPosts({ ...params, teamSlug });
}

// ─── getPostsByLeague ─────────────────────────────────────────────────────────

export async function getPostsByLeague(
  leagueSlug: string,
  params: TeamPostsParams = {}
): Promise<ListPostsResult> {
  return listPosts({ ...params, leagueSlug });
}
