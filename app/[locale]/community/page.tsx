export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildCommunityMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import PostCard from "@/components/community/PostCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
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
  | "general"
  | "notice"
  | "worldcup-2026";

type SortKey = "hot" | "latest" | "trending";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string; border: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",  color: "#d97706", bg: "#fffbeb", border: "#fde68a"   },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe"   },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트", color: "#dc2626", bg: "#fef2f2", border: "#fecaca"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",       color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc"   },
  "general":          { labelEn: "General",          labelKo: "일반",       color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb"   },
  "notice":           { labelEn: "Notice",           labelKo: "공지사항",   color: "#b45309", bg: "#fefce8", border: "#fde68a"   },
  "worldcup-2026":    { labelEn: "2026 World Cup",   labelKo: "2026 월드컵", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5"   },
};

const ALL_CATEGORIES: PostCategory[] = [
  "worldcup-2026", "match-discussion", "transfer-news", "tactics", "highlights", "predictions", "general",
];

// ─── Team boards ──────────────────────────────────────────────────────────────

const TEAM_BOARDS = [
  { slug: "arsenal",           nameEn: "Arsenal",           nameKo: "아스널" },
  { slug: "man-city",          nameEn: "Man City",          nameKo: "맨체스터 시티" },
  { slug: "liverpool",         nameEn: "Liverpool",         nameKo: "리버풀" },
  { slug: "chelsea",           nameEn: "Chelsea",           nameKo: "첼시" },
  { slug: "man-united",        nameEn: "Man United",        nameKo: "맨체스터 유나이티드" },
  { slug: "tottenham",         nameEn: "Tottenham",         nameKo: "토트넘" },
  { slug: "real-madrid",       nameEn: "Real Madrid",       nameKo: "레알 마드리드" },
  { slug: "barcelona",         nameEn: "Barcelona",         nameKo: "바르셀로나" },
  { slug: "atletico-madrid",   nameEn: "Atletico Madrid",   nameKo: "아틀레티코 마드리드" },
  { slug: "bayern-munich",     nameEn: "Bayern Munich",     nameKo: "바이에른 뮌헨" },
  { slug: "dortmund",          nameEn: "Dortmund",          nameKo: "보루시아 도르트문트" },
  { slug: "inter-milan",       nameEn: "Inter Milan",       nameKo: "인터 밀란" },
  { slug: "ac-milan",          nameEn: "AC Milan",          nameKo: "AC 밀란" },
  { slug: "juventus",          nameEn: "Juventus",          nameKo: "유벤투스" },
];

// ─── Labels ───────────────────────────────────────────────────────────────────

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
    noticeBoardLabel: "Notice Board",
    noticeBoardDesc: "Official announcements",
    noticeViewAll: "View all notices →",
    rules: "Community Rules",
    rulesItems: [
      "Be respectful to all members",
      "No spam or self-promotion",
      "Keep discussions football-related",
      "No hate speech or discrimination",
      "Cite sources for news claims",
    ],
    loginCta: "Sign In to Post",
    noAuth: "Join the community — post, comment, and vote on the best football discussions.",
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
    noticeBoardLabel: "공지사항",
    noticeBoardDesc: "운영팀 공식 공지",
    noticeViewAll: "공지 전체보기 →",
    rules: "커뮤니티 규칙",
    rulesItems: [
      "모든 회원을 존중해주세요",
      "스팸 및 홍보 금지",
      "축구 관련 주제로만 토론",
      "혐오 발언 및 차별 금지",
      "뉴스 주장 시 출처 명시",
    ],
    loginCta: "로그인하여 글쓰기",
    noAuth: "커뮤니티에 참여하여 게시글을 작성하고 댓글을 달고 최고의 축구 토론에 투표하세요.",
    posts: "게시글",
    members: "회원",
    online: "접속 중",
    allBoards: "전체 팀 보기 →",
    noPosts: "아직 게시글이 없습니다 — 첫 번째로 작성해보세요!",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-0.5 h-4 rounded-full bg-emerald-600 shrink-0" />
      <h2 className="text-sm font-bold text-gray-800">
        {title}
        {count !== undefined && (
          <span className="text-gray-400 text-xs font-normal ml-1.5">({count})</span>
        )}
      </h2>
    </div>
  );
}

function SidebarCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</h3>
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
  const { locale } = await params;
  const sp         = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc    = locale as Locale;
  const isKo   = loc === "ko";
  const tx     = labels[loc];
  const user   = await getServerUser();
  const isLoggedIn = !!user;

  const activeCategory = (sp.category as PostCategory | undefined) ?? null;
  const activeSort     = (sp.sort as SortKey | undefined) ?? "hot";
  const activePage     = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [mainR, trendingR] = await Promise.allSettled([
    listPosts({ category: activeCategory, sort: activeSort, page: activePage, limit: 20, excludeNotice: true }),
    listHotPosts({ limit: 5 }),
  ]);

  const mainResult    = mainR.status    === "fulfilled" ? mainR.value    : { posts: [], total: 0, hasMore: false };
  const trendingResult = trendingR.status === "fulfilled" ? trendingR.value : { posts: [] };
  const { posts, total, hasMore } = mainResult;
  const trendingPosts = trendingResult.posts;

  const pinnedPosts  = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const sortOptions: { key: SortKey; label: string; href: string }[] = [
    { key: "hot",      label: tx.sortHot,      href: `/${loc}/community/hot${activeCategory ? `?category=${activeCategory}` : ""}` },
    { key: "latest",   label: tx.sortLatest,   href: `/${loc}/community/latest${activeCategory ? `?category=${activeCategory}` : ""}` },
    { key: "trending", label: tx.sortTrending, href: activeCategory ? `/${loc}/community?category=${activeCategory}&sort=trending` : `/${loc}/community?sort=trending` },
  ];

  const BANNER_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000";
  const RECT_SLOT   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "1111111111";

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Page hero ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-0.5 h-6 rounded-full bg-emerald-600 shrink-0" />
                <h1 className="text-2xl font-black text-gray-900">{tx.pageTitle}</h1>
              </div>
              <p className="text-sm text-gray-500 ml-3.5">{tx.pageSubtitle}</p>
            </div>
            {isLoggedIn ? (
              <a
                href={`/${loc}/community/write`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                ✏️ {tx.writePost}
              </a>
            ) : (
              <a
                href={`/${loc}/auth/login`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                ✏️ {tx.loginCta}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Top ad ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <AdBanner slot={BANNER_SLOT} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Category filter + sort */}
            <div className="flex flex-col gap-2">
              {/* Category pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                <a
                  href={`/${loc}/community${activeSort !== "hot" ? `?sort=${activeSort}` : ""}`}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    !activeCategory
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
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
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={{
                        backgroundColor: isActive ? meta.bg : "#ffffff",
                        color: isActive ? meta.color : "#6b7280",
                        borderColor: isActive ? meta.border : "#e5e7eb",
                      }}
                    >
                      {isKo ? meta.labelKo : meta.labelEn}
                    </a>
                  );
                })}
              </div>

              {/* Sort pills */}
              <div className="flex gap-1.5">
                {sortOptions.map((opt) => {
                  const isActive = opt.key === "trending" && activeSort === "trending";
                  return (
                    <a
                      key={opt.key}
                      href={opt.href}
                      className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
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
                <div className="flex flex-col gap-1.5">
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
                        imageUrl={post.imageUrl}
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <span className="text-4xl">⚽</span>
                  <p className="text-gray-400 text-sm mt-3">{tx.noPosts}</p>
                  {isLoggedIn && (
                    <a
                      href={`/${loc}/community/write`}
                      className="inline-block mt-4 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      {isKo ? "첫 글 작성하기" : "Be the first to post"}
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
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
                        {(idx === 3 || idx === 7) && regularPosts.length > idx + 1 && (
                          <AdBanner
                            key={`ad-after-${idx}`}
                            slot={BANNER_SLOT}
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
              <div className="flex justify-center gap-2 pt-2">
                {activePage > 1 && (
                  <a
                    href={`/${loc}/community?${new URLSearchParams({
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSort !== "hot" ? { sort: activeSort } : {}),
                      page: String(activePage - 1),
                    }).toString()}`}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
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
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    {isKo ? "다음" : "Next"} →
                  </a>
                )}
              </div>
            )}

            <AdBanner slot={BANNER_SLOT} />
          </div>

          {/* ── Sidebar (1/3) ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Notice Board shortcut */}
            <a
              href={`/${loc}/notice`}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 hover:bg-amber-100 transition-colors no-underline"
            >
              <span className="text-2xl shrink-0">📢</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-800">{tx.noticeBoardLabel}</div>
                <div className="text-xs text-amber-600 mt-0.5">{tx.noticeBoardDesc}</div>
              </div>
              <span className="text-xs font-semibold text-amber-700 shrink-0">{isKo ? "보기" : "View"} →</span>
            </a>

            {/* Community stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
              {[
                { value: total > 0 ? String(total) : "0", label: tx.posts },
                { value: "—", label: tx.members },
                { value: "—", label: tx.online },
              ].map((stat) => (
                <div key={stat.label} className="text-center py-4 px-2">
                  <div className="text-lg font-extrabold text-emerald-600 leading-none">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trending */}
            {trendingPosts.length > 0 && (
              <SidebarCard title={`🔥 ${tx.trending}`}>
                <div className="divide-y divide-gray-100">
                  {trendingPosts.map((p, idx) => {
                    const catMeta = CATEGORY_META[p.category];
                    return (
                      <a
                        key={p.id}
                        href={`/${loc}/community/post/${p.id}`}
                        className="flex gap-3 items-start px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`text-sm font-extrabold shrink-0 mt-0.5 w-4 ${
                          idx === 0 ? "text-emerald-600" : idx === 1 ? "text-amber-500" : "text-gray-300"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
                            {p.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold" style={{ color: catMeta.color }}>
                              {isKo ? catMeta.labelKo : catMeta.labelEn}
                            </span>
                            <span className="text-[11px] text-gray-400">👁 {p.viewCount.toLocaleString()}</span>
                            <span className="text-[11px] text-gray-400">▲ {p.likeCount}</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <a href={`/${loc}/community/hot`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    {isKo ? "전체 인기글 보기 →" : "View all hot posts →"}
                  </a>
                </div>
              </SidebarCard>
            )}

            {/* Team boards */}
            <SidebarCard title={`⚽ ${tx.teamBoards}`}>
              <div className="flex flex-wrap gap-1.5 p-3">
                {TEAM_BOARDS.map((team) => (
                  <a
                    key={team.slug}
                    href={`/${loc}/team/${team.slug}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                  >
                    <TeamLogo logo={undefined} name={isKo ? team.nameKo : team.nameEn} size={16} />
                    {isKo ? team.nameKo : team.nameEn}
                  </a>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100">
                <a href={`/${loc}/team`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  {tx.allBoards}
                </a>
              </div>
            </SidebarCard>

            {/* Community Rules */}
            <SidebarCard title={`📋 ${tx.rules}`}>
              <ol className="list-decimal list-inside flex flex-col gap-2 px-4 py-3">
                {tx.rulesItems.map((rule, idx) => (
                  <li key={idx} className="text-xs text-gray-500 leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ol>
            </SidebarCard>

            {/* Login CTA */}
            {!isLoggedIn && (
              <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5 text-center flex flex-col gap-3">
                <span className="text-3xl">⚽</span>
                <p className="text-xs text-gray-500 leading-relaxed">{tx.noAuth}</p>
                <a
                  href={`/${loc}/auth/login`}
                  className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {tx.loginCta}
                </a>
              </div>
            )}

            {/* Sticky sidebar ad */}
            <AdSidebar slot={RECT_SLOT} />
          </div>
        </div>
      </div>
    </main>
  );
}
