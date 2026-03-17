import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser } from "@/lib/auth";
import AdSlot from "@/components/ads/AdSlot";
import PostCard from "@/components/community/PostCard";
import { listHotPosts } from "@/lib/community/hotPosts";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isKo = locale === "ko";
  return {
    title: isKo ? "인기 게시글 — KickVista" : "Hot Posts — KickVista",
    description: isKo
      ? "지금 가장 인기 있는 축구 토론을 확인하세요."
      : "The hottest football discussions happening right now.",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string; border: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"   },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#8b949e", bg: "rgba(139,148,158,0.1)", border: "rgba(139,148,158,0.25)" },
};

const ALL_CATEGORIES: PostCategory[] = [
  "match-discussion", "transfer-news", "tactics", "highlights", "predictions", "general",
];

// Rank medal colors: #1 green, #2 amber, #3 bronze, rest muted
function rankColor(idx: number): string {
  if (idx === 0) return "#22c55e";
  if (idx === 1) return "#f59e0b";
  if (idx === 2) return "#cd7f32";
  return "#484f58";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HotPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";
  const user = await getServerUser();
  const isLoggedIn = !!user;

  const activeCategory = (sp.category as PostCategory | undefined) ?? null;
  const activePage = Math.max(1, parseInt(sp.page ?? "1", 10));

  const { posts, total, hasMore } = await listHotPosts({
    category: activeCategory,
    page: activePage,
    limit: 20,
  });

  const tx = {
    title:         isKo ? "🔥 인기 게시글" : "🔥 Hot Posts",
    subtitle:      isKo ? "지금 가장 뜨거운 축구 토론" : "The hottest football discussions right now",
    allCategories: isKo ? "전체" : "All",
    back:          isKo ? "← 커뮤니티로" : "← Community",
    latest:        isKo ? "최신 글 보기 →" : "View Latest →",
    noPosts:       isKo ? "아직 게시글이 없습니다." : "No posts yet.",
    writePost:     isKo ? "글쓰기" : "Write Post",
    loginCta:      isKo ? "로그인하여 글쓰기" : "Sign In to Post",
    prev:          isKo ? "이전" : "Prev",
    next:          isKo ? "다음" : "Next",
    posts:         isKo ? "게시글" : "Posts",
  };

  return (
    <>
      <style>{`
        .kv-hot-card:hover { background: #1c2128; }
      `}</style>
      <main style={{ background: "#0d1117", minHeight: "100vh" }}>

        {/* Hero */}
        <div
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%), linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
          }}
          className="py-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <a
                  href={`/${loc}/community`}
                  style={{ color: "#8b949e", fontSize: 13, textDecoration: "none", display: "block", marginBottom: 8 }}
                >
                  {tx.back}
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: "#ef4444", flexShrink: 0 }} />
                  <h1 style={{ color: "#e6edf3", fontSize: 28, fontWeight: 900, margin: 0 }}>
                    {tx.title}
                  </h1>
                </div>
                <p style={{ color: "#8b949e", fontSize: 14, margin: "0 0 0 13px" }}>
                  {tx.subtitle}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 24 }}>
                <a
                  href={`/${loc}/community/latest${activeCategory ? `?category=${activeCategory}` : ""}`}
                  style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: "#8b949e", border: "1px solid #30363d", textDecoration: "none",
                  }}
                >
                  {tx.latest}
                </a>
                {isLoggedIn ? (
                  <a
                    href={`/${loc}/community/write`}
                    style={{
                      padding: "8px 18px", backgroundColor: "#22c55e",
                      color: "#0d1117", fontSize: 13, fontWeight: 700,
                      borderRadius: 8, textDecoration: "none",
                    }}
                  >
                    ✏️ {tx.writePost}
                  </a>
                ) : (
                  <a
                    href={`/${loc}/auth/login`}
                    style={{
                      padding: "8px 18px", backgroundColor: "rgba(34,197,94,0.1)",
                      color: "#22c55e", fontSize: 13, fontWeight: 700,
                      borderRadius: 8, textDecoration: "none", border: "1px solid rgba(34,197,94,0.25)",
                    }}
                  >
                    ✏️ {tx.loginCta}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top ad */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <AdSlot slotId="community-hot-top" size="leaderboard" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 16 }}>
            <a
              href={`/${loc}/community/hot`}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                textDecoration: "none", flexShrink: 0,
                backgroundColor: !activeCategory ? "#22c55e" : "transparent",
                color: !activeCategory ? "#0d1117" : "#8b949e",
                border: !activeCategory ? "none" : "1px solid #30363d",
              }}
            >
              {tx.allCategories}
            </a>
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isActive = activeCategory === cat;
              return (
                <a
                  key={cat}
                  href={`/${loc}/community/hot?category=${cat}`}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    textDecoration: "none", flexShrink: 0,
                    backgroundColor: isActive ? meta.bg : "transparent",
                    color: isActive ? meta.color : "#8b949e",
                    border: isActive ? `1px solid ${meta.border}` : "1px solid #30363d",
                  }}
                >
                  {isKo ? meta.labelKo : meta.labelEn}
                </a>
              );
            })}
          </div>

          {/* Post list */}
          {posts.length === 0 ? (
            <div
              style={{
                backgroundColor: "#161b22", border: "1px solid #30363d",
                borderRadius: 12, padding: "48px 20px", textAlign: "center",
              }}
            >
              <span style={{ fontSize: 36 }}>🔥</span>
              <p style={{ color: "#8b949e", fontSize: 14, marginTop: 12 }}>
                {tx.noPosts}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {posts.map((post, idx) => {
                const globalRank = (activePage - 1) * 20 + idx;
                const meta = CATEGORY_META[post.category];
                return (
                  <div key={post.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {/* Rank number */}
                    <div
                      style={{
                        flexShrink: 0, width: 28, textAlign: "center",
                        fontSize: globalRank < 3 ? 18 : 14,
                        fontWeight: 800,
                        color: rankColor(globalRank),
                        lineHeight: 1,
                      }}
                    >
                      {globalRank + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PostCard
                        href={`/${loc}/community/post/${post.id}`}
                        title={post.title}
                        preview={post.preview}
                        timeAgo={post.timeAgo}
                        category={meta}
                        isPinned={post.isPinned}
                        isHot={post.isHot}
                        authorName={post.authorName}
                        authorBadge={post.authorBadge}
                        rankColor={post.rankColor}
                        upvotes={post.likeCount}
                        comments={post.commentCount}
                        views={post.viewCount}
                        isKo={isKo}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {(activePage > 1 || hasMore) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 20 }}>
              {activePage > 1 && (
                <a
                  href={`/${loc}/community/hot?${new URLSearchParams({
                    ...(activeCategory ? { category: activeCategory } : {}),
                    page: String(activePage - 1),
                  }).toString()}`}
                  style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    backgroundColor: "transparent", color: "#8b949e",
                    border: "1px solid #30363d", textDecoration: "none",
                  }}
                >
                  ← {tx.prev}
                </a>
              )}
              {hasMore && (
                <a
                  href={`/${loc}/community/hot?${new URLSearchParams({
                    ...(activeCategory ? { category: activeCategory } : {}),
                    page: String(activePage + 1),
                  }).toString()}`}
                  style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.25)", textDecoration: "none",
                  }}
                >
                  {tx.next} →
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
