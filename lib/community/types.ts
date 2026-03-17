export type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

export interface PostAuthor {
  id: string;
  nickname: string;
  rankBadge: string;      // emoji
  rankTier: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  likeCount: number;
  createdAt: string;
  isDeleted?: boolean;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  titleKo?: string;
  excerpt: string;
  excerptKo?: string;
  content: string;
  contentKo?: string;
  category: PostCategory;
  tags: string[];
  author: PostAuthor;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
  isHot?: boolean;
  isAnnouncement?: boolean;
  createdAt: string;
  updatedAt?: string;
  // Related football data
  relatedLeague?: string;
  relatedFixtureId?: number;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
