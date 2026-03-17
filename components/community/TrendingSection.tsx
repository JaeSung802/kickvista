import Link from "next/link";

type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

interface PostAuthor {
  id: string;
  nickname: string;
  rankBadge: string;
  rankTier: string;
  avatarUrl?: string;
}

interface Post {
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
  relatedLeague?: string;
  relatedFixtureId?: number;
}

interface TrendingSectionProps {
  posts: Post[];
  locale: "ko" | "en";
}

const CATEGORY_LABELS: Record<PostCategory, { en: string; ko: string; color: string }> = {
  "match-discussion": { en: "Match",     ko: "경기",   color: "#22c55e" },
  "transfer-news":    { en: "Transfer",  ko: "이적",   color: "#60a5fa" },
  "tactics":          { en: "Tactics",   ko: "전술",   color: "#a78bfa" },
  "highlights":       { en: "Highlights",ko: "하이라이트", color: "#fb923c" },
  "predictions":      { en: "Predict",   ko: "예측",   color: "#facc15" },
  "general":          { en: "General",   ko: "자유",   color: "#9ca3af" },
};

const RANK_COLORS: Record<number, string> = {
  1: "#ffd700",
  2: "#c0c0c0",
  3: "#cd7f32",
};

function trendingScore(post: Post): number {
  return post.viewCount + post.likeCount * 3 + post.commentCount * 5;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TrendingSection({ posts, locale }: TrendingSectionProps) {
  const sorted = [...posts]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "10px",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <span style={{ fontSize: "16px" }}>🔥</span>
        <h3
          style={{
            color: "#e6edf3",
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {locale === "ko" ? "인기 게시글" : "Trending"}
        </h3>
      </div>

      {/* List */}
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        {sorted.map((post, idx) => {
          const rank = idx + 1;
          const rankColor = RANK_COLORS[rank] ?? "#8b949e";
          const cat = CATEGORY_LABELS[post.category];
          const title = locale === "ko" && post.titleKo ? post.titleKo : post.title;
          const href = `/${locale}/community/post/${post.id}`;

          return (
            <li key={post.id}>
              <Link
                href={href}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "9px 8px",
                    borderRadius: "6px",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#0d1117";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                  }}
                >
                  {/* Rank number */}
                  <span
                    style={{
                      color: rankColor,
                      fontWeight: 800,
                      fontSize: "14px",
                      minWidth: "18px",
                      lineHeight: "1.4",
                      flexShrink: 0,
                    }}
                  >
                    {rank}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    {/* Category badge (tiny) */}
                    <span
                      style={{
                        color: cat.color,
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                      }}
                    >
                      {locale === "ko" ? cat.ko : cat.en}
                    </span>

                    {/* Title */}
                    <div
                      style={{
                        color: "#e6edf3",
                        fontSize: "13px",
                        fontWeight: 500,
                        lineHeight: "1.35",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ color: "#8b949e", fontSize: "11px" }}>
                        👁 {formatCount(post.viewCount)}
                      </span>
                      <span style={{ color: "#8b949e", fontSize: "11px" }}>
                        ❤️ {formatCount(post.likeCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {sorted.length === 0 && (
        <p style={{ color: "#8b949e", fontSize: "13px", textAlign: "center", margin: "16px 0 8px" }}>
          {locale === "ko" ? "게시글이 없습니다." : "No posts yet."}
        </p>
      )}
    </div>
  );
}
