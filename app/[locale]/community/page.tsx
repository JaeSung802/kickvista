import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildCommunityMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import PostCard from "@/components/community/PostCard";
import { listPosts } from "@/lib/community/actions";
import { listHotPosts } from "@/lib/community/hotPosts";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildCommunityMetadata(locale as Locale);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

type SortKey = "hot" | "latest" | "trending";

// ─── Category metadata ─────────────────────────────────────────────────────────

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

// ─── Team boards ──────────────────────────────────────────────────────────────

const TEAM_BOARDS = [
  { slug: "arsenal",      flag: "🔴", nameEn: "Arsenal",      nameKo: "아스날" },
  { slug: "man-city",     flag: "🔵", nameEn: "Man City",      nameKo: "맨시티" },
  { slug: "liverpool",    flag: "🔴", nameEn: "Liverpool",     nameKo: "리버풀" },
  { slug: "chelsea",      flag: "🔵", nameEn: "Chelsea",       nameKo: "첼시" },
  { slug: "real-madrid",  flag: "⚪", nameEn: "Real Madrid",   nameKo: "레알 마드리드" },
  { slug: "barcelona",    flag: "🔵", nameEn: "Barcelona",     nameKo: "바르셀로나" },
  { slug: "bayern",       flag: "🔴", nameEn: "Bayern Munich", nameKo: "바이에른" },
  { slug: "psg",          flag: "🔵", nameEn: "PSG",           nameKo: "PSG" },
];

// ─── Labels ────────────────────────────────────────────────────────────────────

const labels = {
  en: {
    pageTitle: "Community",
    pageSubtitle: "Discuss football with fans around the world",
    writePost: "Write Post",
    allCategories: "All",
    sortHot: "🔥 Hot",
    sortLatest: "Latest",
    sortTrending: "📈 Trending",
    pinned: "PINNED",
    hot: "HOT",
    trending: "Trending",
    teamBoards: "Team Boards",
    rules: "Community Rules",
    topContributors: "Top Contributors",
    rulesItems: [
      "Be respectful to all members",
      "No spam or self-promotion",
      "Keep discussions football-related",
      "No hate speech or discrimination",
      "Cite sources for news claims",
    ],
    loginCta: "Sign In to Post",
    noAuth: "Join the community — post, comment, and vote on the best football discussions.",
    communityStats: "Community Stats",
    posts: "Posts",
    members: "Members",
    online: "Online",
    allBoards: "All Boards →",
    noPosts: "No posts yet — be the first!",
  },
  ko: {
    pageTitle: "커뮤니티",
    pageSubtitle: "전 세계 축구 팬들과 이야기 나눠보세요",
    writePost: "글쓰기",
    allCategories: "전체",
    sortHot: "🔥 인기",
    sortLatest: "최신",
    sortTrending: "📈 트렌딩",
    pinned: "고정",
    hot: "인기",
    trending: "트렌딩",
    teamBoards: "팀 게시판",
    rules: "커뮤니티 규칙",
    topContributors: "인기 작성자",
    rulesItems: [
      "모든 회원을 존중해주세요",
      "스팸 및 홍보 금지",
      "축구 관련 주제로만 토론",
      "혐오 발언 및 차별 금지",
      "뉴스 주장 시 출처 명시",
    ],
    loginCta: "로그인하여 글쓰기",
    noAuth: "커뮤니티에 참여하여 게시글을 작성하고 댓글을 달고 최고의 축구 토론에 투표하세요.",
    communityStats: "커뮤니티 통계",
    posts: "게시글",
    members: "회원",
    online: "접속 중",
    allBoards: "전체 팀 보기 →",
    noPosts: "아직 게시글이 없습니다 — 첫 번째로 작성해보세요!",
  },
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
      <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, margin: 0 }}>
        {title}
        {count !== undefined && (
          <span style={{ color: "#8b949e", fontSize: 13, fontWeight: 400, marginLeft: 8 }}>({count})</span>
        )}
      </h2>
    </div>
  );
}

// ─── SidebarCard ─────────────────────────────────────────────────────────────

function SidebarCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "11px 16px", borderBottom: "1px solid #21262d", backgroundColor: "#0d1117" }}>
        <h3 style={{ color: "#e6edf3", fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: "0.03em", textTransform: "uppercase" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const { locale }    = await params;
  const sp            = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc    = locale as Locale;
  const isKo   = loc === "ko";
  const tx     = labels[loc];
  const user   = await getServerUser();
  const isLoggedIn = !!user;

  const activeCategory = (sp.category as PostCategory | undefined) ?? null;
  const activeSort     = (sp.sort as SortKey | undefined) ?? "hot";
  const activePage     = Math.max(1, parseInt(sp.page ?? "1", 10));

  // Parallel data fetch: main list + hot sidebar
  const [mainResult, trendingResult] = await Promise.all([
    listPosts({ category: activeCategory, sort: activeSort, page: activePage, limit: 20 }),
    listHotPosts({ limit: 5 }),
  ]);

  const { posts, total, hasMore } = mainResult;
  const trendingPosts = trendingResult.posts;

  const pinnedPosts  = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const sortOptions: { key: SortKey; label: string; href: string }[] = [
    { key: "hot",      label: tx.sortHot,      href: `/${loc}/community/hot${activeCategory ? `?category=${activeCategory}` : ""}` },
    { key: "latest",   label: tx.sortLatest,   href: `/${loc}/community/latest${activeCategory ? `?category=${activeCategory}` : ""}` },
    { key: "trending", label: tx.sortTrending, href: activeCategory ? `/${loc}/community?category=${activeCategory}&sort=trending` : `/${loc}/community?sort=trending` },
  ];

  return (
    <>
    <style>{`
      .kv-trending-link:hover { background: #1c2128; }
      .kv-team-link:hover { border-color: rgba(34,197,94,0.3) !important; color: #22c55e !important; }
    `}</style>
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>

      {/* Page hero */}
      <div
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,197,94,0.05) 0%, transparent 70%), linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          borderBottom: "1px solid #21262d",
        }}
        className="py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
                <h1 style={{ color: "#e6edf3", fontSize: 28, fontWeight: 900, margin: 0 }}>
                  {tx.pageTitle}
                </h1>
              </div>
              <p style={{ color: "#8b949e", fontSize: 14, margin: "0 0 0 13px" }}>
                {tx.pageSubtitle}
              </p>
            </div>

            {isLoggedIn ? (
              <a
                href={`/${loc}/community/write`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", backgroundColor: "#22c55e",
                  color: "#0d1117", fontSize: 14, fontWeight: 700,
                  borderRadius: 10, textDecoration: "none",
                  boxShadow: "0 0 16px rgba(34,197,94,0.2)",
                }}
              >
                ✏️ {tx.writePost}
              </a>
            ) : (
              <a
                href={`/${loc}/auth/login`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", backgroundColor: "rgba(34,197,94,0.1)",
                  color: "#22c55e", fontSize: 14, fontWeight: 700,
                  borderRadius: 10, textDecoration: "none",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                ✏️ {tx.loginCta}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000"} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Category filter + sort row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
                <a
                  href={`/${loc}/community${activeSort !== "hot" ? `?sort=${activeSort}` : ""}`}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13,
                    fontWeight: 700, textDecoration: "none", flexShrink: 0,
                    backgroundColor: !activeCategory ? "#22c55e" : "transparent",
                    color: !activeCategory ? "#0d1117" : "#8b949e",
                    border: !activeCategory ? "none" : "1px solid #30363d",
                  }}
                >
                  {tx.allCategories}
                </a>
                {ALL_CATEGORIES.map((cat) => {
                  const meta     = CATEGORY_META[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <a
                      key={cat}
                      href={`/${loc}/community?category=${cat}${activeSort !== "hot" ? `&sort=${activeSort}` : ""}`}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 13,
                        fontWeight: 600, textDecoration: "none", flexShrink: 0,
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

              <div style={{ display: "flex", gap: 4 }}>
                {sortOptions.map((opt) => {
                  // hot and latest have dedicated pages; only "trending" stays on this page
                  const isActive = opt.key === "trending" && activeSort === "trending";
                  return (
                    <a
                      key={opt.key}
                      href={opt.href}
                      style={{
                        padding: "5px 14px", borderRadius: 7, fontSize: 12,
                        fontWeight: 700, textDecoration: "none",
                        backgroundColor: isActive ? "rgba(34,197,94,0.1)" : "transparent",
                        color: isActive ? "#22c55e" : "#8b949e",
                        border: isActive ? "1px solid rgba(34,197,94,0.25)" : "1px solid #21262d",
                      }}
                    >
                      {opt.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Pinned posts */}
            {pinnedPosts.length > 0 && (
              <section>
                <SectionHeader title={isKo ? "📌 고정 게시글" : "📌 Pinned"} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pinnedPosts.map((post) => {
                    const meta = CATEGORY_META[post.category];
                    return (
                      <PostCard
                        key={post.id}
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
                    );
                  })}
                </div>
              </section>
            )}

            {/* Regular posts */}
            <section>
              <SectionHeader
                title={
                  activeCategory
                    ? (isKo ? CATEGORY_META[activeCategory].labelKo : CATEGORY_META[activeCategory].labelEn)
                    : (isKo ? "모든 게시글" : "All Posts")
                }
                count={total}
              />
              {regularPosts.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#161b22", border: "1px solid #30363d",
                    borderRadius: 12, padding: "48px 20px", textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 36 }}>⚽</span>
                  <p style={{ color: "#8b949e", fontSize: 14, marginTop: 12 }}>
                    {tx.noPosts}
                  </p>
                  {isLoggedIn && (
                    <a
                      href={`/${loc}/community/write`}
                      style={{
                        display: "inline-block", marginTop: 16,
                        padding: "8px 20px", backgroundColor: "#22c55e",
                        color: "#0d1117", fontSize: 13, fontWeight: 700,
                        borderRadius: 8, textDecoration: "none",
                      }}
                    >
                      {isKo ? "첫 글 작성하기" : "Be the first to post"}
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {regularPosts.map((post, idx) => {
                    const meta = CATEGORY_META[post.category];
                    return (
                      <>
                        <PostCard
                          key={post.id}
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
                        {/* In-feed banner after post 4 and post 8 */}
                        {(idx === 3 || idx === 7) && regularPosts.length > idx + 1 && (
                          <AdBanner
                            key={`ad-after-${idx}`}
                            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000"}
                          />
                        )}
                      </>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Pagination */}
            {(activePage > 1 || hasMore) && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 8 }}>
                {activePage > 1 && (
                  <a
                    href={`/${loc}/community?${new URLSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSort !== "hot" ? { sort: activeSort } : {}),
                      page: String(activePage - 1),
                    }).toString()}`}
                    style={{
                      padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      backgroundColor: "transparent", color: "#8b949e",
                      border: "1px solid #30363d", textDecoration: "none",
                    }}
                  >
                    ← {isKo ? "이전" : "Prev"}
                  </a>
                )}
                {hasMore && (
                  <a
                    href={`/${loc}/community?${new URLSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSort !== "hot" ? { sort: activeSort } : {}),
                      page: String(activePage + 1),
                    }).toString()}`}
                    style={{
                      padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e",
                      border: "1px solid rgba(34,197,94,0.25)", textDecoration: "none",
                    }}
                  >
                    {isKo ? "다음" : "Next"} →
                  </a>
                )}
              </div>
            )}

            {/* Mid ad — after post list, before pagination */}
            <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000"} />
          </div>

          {/* ── Sidebar (1/3) ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Community stats */}
            <div
              style={{
                backgroundColor: "#161b22", border: "1px solid #30363d",
                borderRadius: 12, padding: "16px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1,
                overflow: "hidden",
              }}
            >
              {[
                { value: total > 0 ? String(total) : "0", label: tx.posts },
                { value: "—", label: tx.members },
                { value: "—", label: tx.online },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    textAlign: "center", padding: "12px 8px",
                    borderRight: i < 2 ? "1px solid #21262d" : "none",
                  }}
                >
                  <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: "#8b949e", fontSize: 11, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trending */}
            {trendingPosts.length > 0 && (
              <SidebarCard title={`🔥 ${tx.trending}`}>
                {trendingPosts.map((p, idx) => {
                  const catMeta = CATEGORY_META[p.category];
                  return (
                    <a
                      key={p.id}
                      href={`/${loc}/community/post/${p.id}`}
                      className="kv-trending-link"
                      style={{
                        display: "block", padding: "12px 16px",
                        borderBottom: idx < trendingPosts.length - 1 ? "1px solid #21262d" : "none",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span
                          style={{
                            color: idx === 0 ? "#22c55e" : idx === 1 ? "#f59e0b" : "#484f58",
                            fontSize: 16, fontWeight: 800, lineHeight: 1, flexShrink: 0, minWidth: 18,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: "#e6edf3", fontSize: 13, fontWeight: 600,
                              lineHeight: 1.4, marginBottom: 5,
                              overflow: "hidden", display: "-webkit-box",
                              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                            }}
                          >
                            {p.title}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: catMeta.color }}>
                              {isKo ? catMeta.labelKo : catMeta.labelEn}
                            </span>
                            <span style={{ color: "#8b949e", fontSize: 11 }}>👁 {p.viewCount.toLocaleString()}</span>
                            <span style={{ color: "#8b949e", fontSize: 11 }}>▲ {p.likeCount}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
                <div style={{ padding: "10px 16px", borderTop: "1px solid #21262d" }}>
                  <a
                    href={`/${loc}/community/hot`}
                    style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                  >
                    {isKo ? "전체 인기글 보기 →" : "View all hot posts →"}
                  </a>
                </div>
              </SidebarCard>
            )}

            {/* Team boards */}
            <SidebarCard title={`⚽ ${tx.teamBoards}`}>
              <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TEAM_BOARDS.map((team) => (
                  <a
                    key={team.slug}
                    href={`/${loc}/team/${team.slug}`}
                    className="kv-team-link"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "5px 10px", borderRadius: 7,
                      backgroundColor: "#0d1117", border: "1px solid #30363d",
                      textDecoration: "none", fontSize: 12, color: "#c9d1d9", fontWeight: 500,
                    }}
                  >
                    {team.flag} {isKo ? team.nameKo : team.nameEn}
                  </a>
                ))}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid #21262d" }}>
                <a
                  href={`/${loc}/leagues`}
                  style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                >
                  {tx.allBoards}
                </a>
              </div>
            </SidebarCard>

            {/* Community Rules */}
            <SidebarCard title={`📋 ${tx.rules}`}>
              <div style={{ padding: "14px 16px" }}>
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {tx.rulesItems.map((rule, idx) => (
                    <li key={idx} style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.5 }}>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            </SidebarCard>

            {/* Login CTA — only if not logged in */}
            {!isLoggedIn && (
              <div
                style={{
                  backgroundColor: "#161b22", border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 12, padding: "20px",
                  display: "flex", flexDirection: "column",
                  gap: 12, textAlign: "center",
                  background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.05) 0%, #161b22 70%)",
                }}
              >
                <span style={{ fontSize: 36 }}>⚽</span>
                <p style={{ color: "#8b949e", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  {tx.noAuth}
                </p>
                <a
                  href={`/${loc}/auth/login`}
                  style={{
                    display: "inline-block", padding: "10px 20px",
                    backgroundColor: "#22c55e", color: "#0d1117",
                    fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none",
                  }}
                >
                  {tx.loginCta}
                </a>
              </div>
            )}

            {/* Sticky sidebar ad */}
            <AdSidebar slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "1111111111"} />
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
