export const dynamic = "force-dynamic";

import { Fragment } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildCommunityMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import PostCard from "@/components/community/PostCard";
import { isNewsBotPost } from "@/lib/community/newsbot";
// ssr:false dynamic import는 Client Component 안에서만 가능 — WorldCupLoaders에서 담당
import { WorldCupWidgetDynamic as WorldCupWidget, WorldCupInfoPanelDynamic as WorldCupInfoPanel } from "@/components/worldcup/WorldCupLoaders";
import { TeamLogo } from "@/components/ui/TeamLogo";
import HomeRetryButton from "@/components/home/HomeRetryButton";
import { isWorldCupVisible } from "@/lib/worldcup/visibility";
import { listPosts, type ListPostsResult } from "@/lib/community/actions";
import { listHotPosts } from "@/lib/community/hotPosts";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { locale }   = await params;
  const { category } = await searchParams;
  if (!isValidLocale(locale)) return {};
  return buildCommunityMetadata(locale as Locale, category);
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

// "worldcup-2026" is not a tab: existing World Cup posts stay reachable via
// ?category=worldcup-2026, which shows the list without a tab.
const ALL_CATEGORIES: PostCategory[] = [
  "match-discussion", "transfer-news", "tactics", "highlights", "predictions", "general",
];

// ─── List rules (URL values) ──────────────────────────────────────────────────
// category: a tab category or worldcup-2026 (direct URL only); "notice" goes to
//   the official notice board; anything else → redirect without the filter.
// sort: hot (default) | latest | trending; anything else → redirect without it.
// page: 1–9999 written as a plain number ("2", not "02", "-1", "2.5", "1e3");
//   anything else → redirect to page 1; past the last page → the last page.
// Pinned posts are loaded separately and shown above page 1 only; the paged
// list excludes them, so every page holds PAGE_SIZE regular posts.

const LIST_CATEGORIES: PostCategory[] = [...ALL_CATEGORIES, "worldcup-2026"];
const SORTS: SortKey[] = ["hot", "latest", "trending"];
const PAGE_SIZE = 20;
const PINNED_LIMIT = 5;
const PAGE_RE = /^[1-9]\d{0,3}$/;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function listHref(loc: Locale, { category, sort, page }: { category: PostCategory | null; sort: SortKey; page: number }) {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (sort !== "hot") q.set("sort", sort);
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return `/${loc}/community${qs ? `?${qs}` : ""}`;
}

/** "3분 전" / "3m ago" … from the post's created_at (the list helper only has English). */
function timeAgo(iso: string, isKo: boolean): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)     return isKo ? "방금 전" : "just now";
  if (diff < 3600)   return isKo ? `${Math.floor(diff / 60)}분 전` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return isKo ? `${Math.floor(diff / 3600)}시간 전` : `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return isKo ? `${Math.floor(diff / 86400)}일 전` : `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(isKo ? "ko-KR" : "en-GB", { timeZone: "Asia/Seoul", month: "short", day: "numeric" });
}

/** Page numbers around the current page: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(current: number, last: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  const from = Math.max(2, current - 2), to = Math.min(last - 1, current + 2);
  out.push(1);
  if (from > 2) out.push("gap");
  for (let n = from; n <= to; n++) out.push(n);
  if (to < last - 1) out.push("gap");
  if (last > 1) out.push(last);
  return out;
}

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
    allPosts: "All Posts",
    pinnedTitle: "📌 Pinned",
    loadFailed: "Couldn't load posts",
    loadFailedHint: "Please try again in a moment.",
    pinnedFailed: "Pinned posts couldn't be loaded.",
    sortLabel: "Sort",
    pageOf: (p: number, last: number) => `Page ${p} of ${last}`,
    prev: "Prev",
    next: "Next",
    pagination: "Pages",
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
    allPosts: "모든 게시글",
    pinnedTitle: "📌 고정 게시글",
    loadFailed: "게시글을 불러오지 못했습니다",
    loadFailedHint: "잠시 후 다시 시도해 주세요.",
    pinnedFailed: "고정 게시글을 불러오지 못했습니다.",
    sortLabel: "정렬",
    pageOf: (p: number, last: number) => `${p} / ${last} 페이지`,
    prev: "이전",
    next: "다음",
    pagination: "페이지",
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
  searchParams: Promise<{ category?: string | string[]; sort?: string | string[]; page?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp         = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc    = locale as Locale;
  const isKo   = loc === "ko";
  const tx     = labels[loc];
  const user   = await getServerUser();
  const isLoggedIn = !!user;

  // ── Validate URL values (see "List rules") ─────────────────────────────────
  const rawCategory = first(sp.category), rawSort = first(sp.sort), rawPage = first(sp.page);
  if (rawCategory === "notice") redirect(`/${loc}/notice`);
  const categoryOk = rawCategory === undefined || (LIST_CATEGORIES as string[]).includes(rawCategory);
  const sortOk     = rawSort === undefined || (SORTS as string[]).includes(rawSort);
  const pageOk     = rawPage === undefined || PAGE_RE.test(rawPage);
  const activeCategory = categoryOk && rawCategory ? (rawCategory as PostCategory) : null;
  const activeSort: SortKey = sortOk && rawSort ? (rawSort as SortKey) : "hot";
  const activePage = categoryOk && pageOk && rawPage ? Number(rawPage) : 1;
  const repeated = [sp.category, sp.sort, sp.page].some(Array.isArray);
  if (!categoryOk || !sortOk || !pageOk || repeated) {
    redirect(listHref(loc, { category: activeCategory, sort: activeSort, page: activePage }));
  }
  // World Cup promotion (widget, info panel) follows the shared display window;
  // existing World Cup posts stay reachable via ?category= (never as a tab).
  const showWorldCup   = isWorldCupVisible();
  const isWorldCupList = activeCategory === "worldcup-2026";

  // Pinned posts: the newest PINNED_LIMIT pinned posts of this filter are shown above
  // page 1 and left out of the paged list on every page (the same set each time);
  // any further pinned posts stay in the list. If the pinned query fails, nothing is
  // left out — the list then holds every post — and a note says pinned posts are missing.
  const failedResult: ListPostsResult = { posts: [], total: 0, page: activePage, pageSize: PAGE_SIZE, hasMore: false, failed: true };
  const [pinnedR, trendingR] = await Promise.allSettled([
    listPosts({ category: activeCategory, sort: "latest", page: 1, limit: PINNED_LIMIT, excludeNotice: true, pinned: "only" }),
    listHotPosts({ limit: 5 }),
  ]);
  const pinnedResult  = pinnedR.status === "fulfilled" ? pinnedR.value : failedResult;
  const shownPinned   = pinnedResult.failed ? [] : pinnedResult.posts;
  const trendingPosts = trendingR.status === "fulfilled" ? trendingR.value.posts : [];

  const listArgs = { category: activeCategory, sort: activeSort, limit: PAGE_SIZE, excludeNotice: true, excludeIds: shownPinned.map((p) => p.id) };
  const mainResult = await listPosts({ ...listArgs, page: activePage }).catch(() => failedResult);

  // Past the last page (or a page the database refuses as out of range): look up
  // the real page count with page 1 and redirect to the last page.
  if (activePage > 1 && (mainResult.failed || mainResult.posts.length === 0)) {
    const probe = mainResult.failed ? await listPosts({ ...listArgs, page: 1 }).catch(() => failedResult) : mainResult;
    if (!probe.failed) {
      const last = Math.max(1, Math.ceil(probe.total / PAGE_SIZE));
      if (activePage > last) redirect(listHref(loc, { category: activeCategory, sort: activeSort, page: last }));
    }
  }

  const loadFailed   = !!mainResult.failed;
  const regularPosts = mainResult.posts;
  const total        = mainResult.total;                      // paged list (without the shown pinned posts)
  const postCount    = total + shownPinned.length;            // every post of this filter
  const lastPage     = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pinnedPosts  = activePage === 1 ? shownPinned : [];
  const pinnedFailed = !!pinnedResult.failed && !loadFailed;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "hot",      label: tx.sortHot },
    { key: "latest",   label: tx.sortLatest },
    { key: "trending", label: tx.sortTrending },
  ];

  const BANNER_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000";
  const RECT_SLOT   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "1111111111";

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Page hero ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-0.5 h-6 rounded-full bg-emerald-600 shrink-0" />
                <h1 className="text-2xl font-black text-gray-900">{tx.pageTitle}</h1>
              </div>
              <p className="text-sm text-gray-500 ml-3.5">{tx.pageSubtitle}</p>
            </div>
            {isLoggedIn ? (
              <a
                href={`/${loc}/community/write`}
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors sm:w-auto"
              >
                ✏️ {tx.writePost}
              </a>
            ) : (
              <a
                href={`/${loc}/auth/login`}
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors sm:w-auto"
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

            {/* Toolbar: categories (scroll sideways on mobile) + heading/count + sort */}
            <div className="flex flex-col gap-3" data-community-toolbar="">
              <nav aria-label={isKo ? "카테고리" : "Categories"} className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                <a
                  href={listHref(loc, { category: null, sort: activeSort, page: 1 })}
                  aria-current={!activeCategory ? "page" : undefined}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    !activeCategory
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {tx.allCategories}
                </a>
                {ALL_CATEGORIES.map((cat) => {
                  const meta     = CATEGORY_META[cat] ?? CATEGORY_META["general"];
                  const isActive = activeCategory === cat;
                  return (
                    <a
                      key={cat}
                      href={listHref(loc, { category: cat, sort: activeSort, page: 1 })}
                      aria-current={isActive ? "page" : undefined}
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
              </nav>

              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-sm font-bold text-gray-800" data-community-heading="">
                  {activeCategory
                    ? (isKo ? (CATEGORY_META[activeCategory] ?? CATEGORY_META["general"]).labelKo : (CATEGORY_META[activeCategory] ?? CATEGORY_META["general"]).labelEn)
                    : tx.allPosts}
                  {!loadFailed && <span className="ml-1.5 text-xs font-normal text-gray-400">({postCount})</span>}
                </h2>
                <div role="group" aria-label={tx.sortLabel} className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5" data-community-sort={activeSort}>
                  {sortOptions.map((opt) => {
                    const isActive = opt.key === activeSort;
                    return (
                      <a
                        key={opt.key}
                        href={listHref(loc, { category: activeCategory, sort: opt.key, page: 1 })}
                        aria-current={isActive ? "page" : undefined}
                        className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isActive ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {opt.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 월드컵 정보 패널 — ?category=worldcup-2026 목록에서, 노출 기간에만 */}
            {showWorldCup && isWorldCupList && (
              <WorldCupInfoPanel isKo={isKo} />
            )}

            {/* Pinned posts — page 1 only, loaded separately from the paged list */}
            {pinnedPosts.length > 0 && (
              <section data-community-pinned={pinnedPosts.length}>
                <SectionHeader title={tx.pinnedTitle} />
                <div className="flex flex-col gap-1.5">
                  {pinnedPosts.map((post) => (
                    <Fragment key={post.id}>
                      <PostCard
                        href={`/${loc}/community/post/${post.id}`}
                        title={post.title}
                        preview={post.preview}
                        timeAgo={timeAgo(post.createdAt, isKo)}
                        category={CATEGORY_META[post.category] ?? CATEGORY_META["general"]}
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
                        aiSummary={isNewsBotPost(post)}
                      />
                    </Fragment>
                  ))}
                </div>
              </section>
            )}
            {/* Pinned query failed: the list below then includes the pinned posts (nothing is hidden) */}
            {pinnedFailed && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5" data-community-state="pinned-error">
                <p className="text-xs text-gray-500">{tx.pinnedFailed}</p>
                <HomeRetryButton locale={loc} />
              </div>
            )}

            {/* Regular posts */}
            <section data-community-list={loadFailed ? "error" : regularPosts.length}>
              {loadFailed ? (
                <div role="alert" data-community-state="error" className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center flex flex-col items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">⚠️</span>
                  <p className="text-sm font-semibold text-gray-700">{tx.loadFailed}</p>
                  <p className="text-xs text-gray-400">{tx.loadFailedHint}</p>
                  <HomeRetryButton locale={loc} />
                </div>
              ) : regularPosts.length === 0 && pinnedPosts.length > 0 ? null : regularPosts.length === 0 ? (
                <div data-community-state="empty" className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <span className="text-4xl">⚽</span>
                  <p className="text-gray-400 text-sm mt-3">
                    {isWorldCupList ? (isKo ? "게시글이 없습니다." : "No posts.") : tx.noPosts}
                  </p>
                  {/* New posts cannot use the World Cup category, so no "first post" button there */}
                  {isLoggedIn && !isWorldCupList && (
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
                  {regularPosts.map((post, idx) => (
                    <Fragment key={post.id}>
                      <PostCard
                        href={`/${loc}/community/post/${post.id}`}
                        title={post.title}
                        preview={post.preview}
                        timeAgo={timeAgo(post.createdAt, isKo)}
                        category={CATEGORY_META[post.category] ?? CATEGORY_META["general"]}
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
                        aiSummary={isNewsBotPost(post)}
                      />
                      {(idx === 3 || idx === 7) && regularPosts.length > idx + 1 && (
                        <AdBanner slot={BANNER_SLOT} />
                      )}
                    </Fragment>
                  ))}
                </div>
              )}
            </section>

            {/* Pagination */}
            {!loadFailed && lastPage > 1 && (
              <nav aria-label={tx.pagination} className="flex flex-col items-center gap-2 pt-2" data-community-pagination={`${activePage}/${lastPage}`}>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {activePage > 1 && (
                    <a
                      href={listHref(loc, { category: activeCategory, sort: activeSort, page: activePage - 1 })}
                      rel="prev"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
                    >
                      ← {tx.prev}
                    </a>
                  )}
                  {pageWindow(activePage, lastPage).map((n, i) =>
                    n === "gap" ? (
                      <span key={`gap-${i}`} className="px-1 text-sm text-gray-400" aria-hidden="true">…</span>
                    ) : (
                      <a
                        key={n}
                        href={listHref(loc, { category: activeCategory, sort: activeSort, page: n })}
                        aria-current={n === activePage ? "page" : undefined}
                        className={`min-w-9 rounded-lg px-2.5 py-2 text-center text-sm font-semibold tabular-nums ${
                          n === activePage ? "bg-emerald-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {n}
                      </a>
                    ),
                  )}
                  {activePage < lastPage && (
                    <a
                      href={listHref(loc, { category: activeCategory, sort: activeSort, page: activePage + 1 })}
                      rel="next"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
                    >
                      {tx.next} →
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-400">{tx.pageOf(activePage, lastPage)}</p>
              </nav>
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

            {/* 월드컵 D-Day 위젯 (노출 기간에만) */}
            {showWorldCup && <WorldCupWidget locale={loc} isKo={isKo} />}

            {/* Community stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 divide-x divide-gray-100 overflow-hidden">
              {[
                { value: loadFailed ? "—" : String(postCount), label: tx.posts },
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
                    const catMeta = CATEGORY_META[p.category] ?? CATEGORY_META["general"];
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
