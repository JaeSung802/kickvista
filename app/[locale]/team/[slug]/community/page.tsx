import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import { TEAM_REGISTRY, VALID_TEAM_SLUGS } from "@/lib/football/teamRegistry";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { getPostsByTeam } from "@/lib/community/teamPosts";
import {
  TEAM_URL_REDIRECTS,
  resolveTeamUrlSlug,
  canonicalTeamUrl,
  canonicalLeagueUrl,
} from "@/lib/football/slugs";
import PostCard from "@/components/community/PostCard";
import AdSlot from "@/components/ads/AdSlot";
import type { Metadata } from "next";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

type SortKey = "hot" | "latest" | "trending";

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

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  const urlSlugs = [
    ...VALID_TEAM_SLUGS.map(canonicalTeamUrl),
    ...Object.keys(TEAM_URL_REDIRECTS),
  ];
  return urlSlugs.flatMap((slug) => locales.map((locale) => ({ locale, slug })));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const internalSlug  = resolveTeamUrlSlug(slug);
  const entry         = TEAM_REGISTRY[internalSlug];
  if (!entry) return {};
  const loc           = locale as Locale;
  const name          = loc === "ko" ? entry.nameKo : entry.nameEn;
  const canonicalSlug = canonicalTeamUrl(internalSlug);
  return buildMetadata({
    locale: loc,
    title:
      loc === "ko"
        ? `${name} 팬 커뮤니티 — 토론 & 소식`
        : `${name} Fan Community — Discussion & News`,
    description:
      loc === "ko"
        ? `${name} 팬들과 함께 경기 토론, 이적 뉴스, 전술 분석을 나눠보세요.`
        : `Join ${name} fans to discuss matches, transfers, tactics and the latest news.`,
    path: `/team/${canonicalSlug}/community`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamCommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();

  // 301 redirect old slugs
  if (TEAM_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/team/${TEAM_URL_REDIRECTS[slug]}/community`);
  }

  const internalSlug = resolveTeamUrlSlug(slug);
  const entry        = TEAM_REGISTRY[internalSlug];
  if (!entry) notFound();

  const loc    = locale as Locale;
  const isKo   = loc === "ko";
  const league = LEAGUE_BY_SLUG[entry.leagueSlug];
  const user   = await getServerUser();
  const isLoggedIn = !!user;

  const teamName   = isKo ? entry.nameKo : entry.nameEn;
  const leagueName = isKo ? league.nameKo : league.name;

  const activeCategory = (sp.category as PostCategory | undefined) ?? null;
  const activeSort     = (sp.sort as SortKey | undefined) ?? "latest";
  const activePage     = Math.max(1, parseInt(sp.page ?? "1", 10));

  const { posts, total, hasMore } = await getPostsByTeam(internalSlug, {
    category: activeCategory,
    sort: activeSort,
    page: activePage,
    limit: 20,
  });

  const pinnedPosts  = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "latest",   label: isKo ? "최신"      : "Latest"   },
    { key: "hot",      label: isKo ? "🔥 인기"   : "🔥 Hot"  },
    { key: "trending", label: isKo ? "📈 트렌딩" : "📈 Trending" },
  ];

  const writeHref = isLoggedIn
    ? `/${loc}/community/write?team=${internalSlug}`
    : `/${loc}/auth/login`;

  return (
    <>
      <style>{`
        .kv-team-comm-hover:hover { background: #1c2128; }
      `}</style>
      <main style={{ background: "#0d1117", minHeight: "100vh" }}>

        {/* ── Team community hero ── */}
        <div
          style={{
            background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
          }}
          className="py-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14 }}>
              <a href={`/${loc}/community`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {isKo ? "커뮤니티" : "Community"}
              </a>
              <span style={{ color: "#30363d" }}>›</span>
              <a href={`/${loc}/team/${slug}`} style={{ color: "#8b949e", textDecoration: "none" }}>
                {entry.flag} {teamName}
              </a>
              <span style={{ color: "#30363d" }}>›</span>
              <span style={{ color: "#e6edf3" }}>{isKo ? "팬 커뮤니티" : "Fan Community"}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Team badge */}
                <div
                  style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: "#161b22", border: "1px solid #30363d",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, flexShrink: 0,
                  }}
                >
                  {entry.flag}
                </div>
                <div>
                  <h1 style={{ color: "#e6edf3", fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>
                    {teamName}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <a
                      href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}`}
                      style={{ color: "#8b949e", fontSize: 13, textDecoration: "none" }}
                    >
                      {league.flag} {leagueName}
                    </a>
                    <span style={{ color: "#30363d" }}>·</span>
                    <a
                      href={`/${loc}/team/${slug}`}
                      style={{ color: "#22c55e", fontSize: 13, textDecoration: "none" }}
                    >
                      {isKo ? "클럽 정보 →" : "Club page →"}
                    </a>
                  </div>
                </div>
              </div>

              <a
                href={writeHref}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px",
                  backgroundColor: isLoggedIn ? "#22c55e" : "rgba(34,197,94,0.1)",
                  color: isLoggedIn ? "#0d1117" : "#22c55e",
                  fontSize: 14, fontWeight: 700, borderRadius: 10, textDecoration: "none",
                  border: isLoggedIn ? "none" : "1px solid rgba(34,197,94,0.25)",
                  boxShadow: isLoggedIn ? "0 0 16px rgba(34,197,94,0.2)" : "none",
                }}
              >
                ✏️ {isKo ? "글쓰기" : "Write Post"}
              </a>
            </div>
          </div>
        </div>

        {/* Top ad */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <AdSlot slotId={`team-${slug}-comm-top`} size="leaderboard" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex flex-col gap-6">

          {/* Filter row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              <a
                href={`/${loc}/team/${slug}/community`}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", flexShrink: 0,
                  backgroundColor: !activeCategory ? "#22c55e" : "transparent",
                  color: !activeCategory ? "#0d1117" : "#8b949e",
                  border: !activeCategory ? "none" : "1px solid #30363d",
                }}
              >
                {isKo ? "전체" : "All"}
              </a>
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const isActive = activeCategory === cat;
                return (
                  <a
                    key={cat}
                    href={`/${loc}/team/${slug}/community?category=${cat}${activeSort !== "latest" ? `&sort=${activeSort}` : ""}`}
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

            {/* Sort tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {sortOptions.map((opt) => {
                const isActive = activeSort === opt.key;
                const base = activeCategory
                  ? `?category=${activeCategory}&sort=${opt.key}`
                  : `?sort=${opt.key}`;
                const href = opt.key === "latest" && !activeCategory
                  ? `/${loc}/team/${slug}/community`
                  : `/${loc}/team/${slug}/community${base}`;
                return (
                  <a
                    key={opt.key}
                    href={href}
                    style={{
                      padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      textDecoration: "none",
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
                <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {isKo ? "📌 고정 게시글" : "📌 Pinned"}
                </h2>
              </div>
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

          {/* Main posts */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
              <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, margin: 0 }}>
                {activeCategory
                  ? (isKo ? CATEGORY_META[activeCategory].labelKo : CATEGORY_META[activeCategory].labelEn)
                  : (isKo ? `${teamName} 게시글` : `${teamName} Posts`)}
                <span style={{ color: "#8b949e", fontSize: 13, fontWeight: 400, marginLeft: 8 }}>({total})</span>
              </h2>
            </div>

            {regularPosts.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#161b22", border: "1px solid #30363d",
                  borderRadius: 12, padding: "48px 20px", textAlign: "center",
                }}
              >
                <span style={{ fontSize: 36 }}>{entry.flag}</span>
                <p style={{ color: "#8b949e", fontSize: 14, marginTop: 12 }}>
                  {isKo
                    ? `아직 ${teamName} 관련 게시글이 없습니다 — 첫 번째로 작성해보세요!`
                    : `No ${teamName} posts yet — be the first!`}
                </p>
                {isLoggedIn && (
                  <a
                    href={`/${loc}/community/write?team=${internalSlug}`}
                    style={{
                      display: "inline-block", marginTop: 16,
                      padding: "8px 20px", backgroundColor: "#22c55e",
                      color: "#0d1117", fontSize: 13, fontWeight: 700,
                      borderRadius: 8, textDecoration: "none",
                    }}
                  >
                    {isKo ? "첫 글 작성하기" : "Write the first post"}
                  </a>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {regularPosts.map((post) => {
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
            )}
          </section>

          {/* Pagination */}
          {(activePage > 1 || hasMore) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 8 }}>
              {activePage > 1 && (
                <a
                  href={`/${loc}/team/${slug}/community?${new URLSearchParams({
                    ...(activeCategory ? { category: activeCategory } : {}),
                    ...(activeSort !== "latest" ? { sort: activeSort } : {}),
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
                  href={`/${loc}/team/${slug}/community?${new URLSearchParams({
                    ...(activeCategory ? { category: activeCategory } : {}),
                    ...(activeSort !== "latest" ? { sort: activeSort } : {}),
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
        </div>
      </main>
    </>
  );
}
