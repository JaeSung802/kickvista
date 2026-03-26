import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFootballProvider } from "@/lib/football/provider";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { fixturesToMatches, standingsToRows } from "@/lib/football/adapters";
import { queryStandings } from "@/lib/football/query";
import { TEAM_REGISTRY } from "@/lib/football/teamRegistry";
import {
  TEAM_URL_REDIRECTS,
  resolveTeamUrlSlug,
  canonicalTeamUrl,
  canonicalLeagueUrl,
} from "@/lib/football/slugs";
import { getPostsByTeam } from "@/lib/community/teamPosts";
import { sportsTeamJsonLd } from "@/lib/seo/jsonld";
import PostCard from "@/components/community/PostCard";
import AdSlot from "@/components/ads/AdSlot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getLiveSquad } from "@/lib/football/squads";
import SquadSection from "@/components/teams/SquadSection";

type PostCategory = "match-discussion" | "transfer-news" | "tactics" | "highlights" | "predictions" | "general" | "notice" | "worldcup-2026";

const CATEGORY_META: Record<PostCategory, { labelEn: string; labelKo: string; color: string; bg: string; border: string }> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",       color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "general":          { labelEn: "General",          labelKo: "일반",       color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  "notice":           { labelEn: "Notice",           labelKo: "공지사항",   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "worldcup-2026":    { labelEn: "2026 World Cup",   labelKo: "2026 월드컵", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
};

const FORM_BG: Record<string, string> = {
  W: "bg-emerald-50 text-emerald-700",
  D: "bg-amber-100 text-amber-700",
  L: "bg-red-100 text-red-600",
};

// Fully dynamic — team pages are rendered on first request and cached by ISR.
// generateStaticParams intentionally omitted: generating all 250+ team×locale
// combinations at build time exhausts the Football API rate limit (100 req/day).
export const dynamic = "force-dynamic";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const internalSlug = resolveTeamUrlSlug(slug);
  const entry = TEAM_REGISTRY[internalSlug];
  if (!entry) return {};
  const loc = locale as Locale;
  const name = loc === "ko" ? entry.nameKo : entry.nameEn;
  const canonicalSlug = canonicalTeamUrl(internalSlug);
  return buildMetadata({
    locale: loc,
    title:       loc === "ko" ? `${name} — 클럽 정보 & 경기 일정` : `${name} — Club Profile & Fixtures`,
    description: loc === "ko"
      ? `${name}의 최신 경기 결과, 예정 경기, 순위 정보를 KickVista에서 확인하세요.`
      : `${name} latest results, upcoming fixtures and standings on KickVista.`,
    path: `/team/${canonicalSlug}`,
  });
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    recentResults:     "Recent Results",
    upcomingFixtures:  "Upcoming Fixtures",
    standingsPosition: "League Position",
    viewFullTable:     "Full table →",
    viewAllMatches:    "All matches →",
    noResults:         "No recent results.",
    noUpcoming:        "No upcoming fixtures.",
    notInStandings:    "Not in standings.",
    pts:  "Pts",  played: "P",  won: "W",  drawn: "D",  lost: "L",  form: "Form",
  },
  ko: {
    recentResults:     "최근 결과",
    upcomingFixtures:  "다가오는 경기",
    standingsPosition: "리그 순위",
    viewFullTable:     "전체 순위 →",
    viewAllMatches:    "전체 경기 →",
    noResults:         "최근 결과가 없습니다.",
    noUpcoming:        "예정된 경기가 없습니다.",
    notInStandings:    "순위 정보가 없습니다.",
    pts:  "승점",  played: "경기",  won: "승",  drawn: "무",  lost: "패",  form: "최근",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  if (TEAM_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/team/${TEAM_URL_REDIRECTS[slug]}`);
  }

  const internalSlug = resolveTeamUrlSlug(slug);
  const entry = TEAM_REGISTRY[internalSlug];
  if (!entry) notFound();

  const loc       = locale as Locale;
  const isKo      = loc === "ko";
  const t         = labels[loc];
  const league    = LEAGUE_BY_SLUG[entry.leagueSlug];
  const teamName  = isKo ? entry.nameKo : entry.nameEn;
  const leagueName = isKo ? league.nameKo : league.name;

  const jsonLd = sportsTeamJsonLd({ nameEn: entry.nameEn, nameKo: entry.nameKo, leagueName, slug, locale: loc });

  const provider = getFootballProvider();
  const teamLogo = `https://media.api-sports.io/football/teams/${entry.id}.png`;

  const [squadR, recentR, upcomingR, liveAllR, standingsR, latestPostsR, hotPostsR] = await Promise.allSettled([
    getLiveSquad(internalSlug),
    provider.fetchTeamResults(entry.id, league.id, league.season, 5),
    provider.fetchTeamFixturesNext(entry.id, league.id, league.season, 5),
    provider.fetchFixtures(league.id, undefined, league.season),
    queryStandings(entry.leagueSlug),
    getPostsByTeam(internalSlug, { sort: "latest", limit: 10 }),
    getPostsByTeam(internalSlug, { sort: "hot",    limit: 5  }),
  ]);

  const squad          = squadR.status       === "fulfilled" ? squadR.value       : [];
  const recentFixtures = recentR.status      === "fulfilled" ? recentR.value      : [];
  const upcomingFixtures = upcomingR.status  === "fulfilled" ? upcomingR.value    : [];
  const liveAllFixtures  = liveAllR.status   === "fulfilled" ? liveAllR.value     : [];
  const standings      = standingsR.status   === "fulfilled" ? standingsR.value   : null;
  const EMPTY_POSTS = { posts: [], total: 0, page: 1, pageSize: 10, hasMore: false } as const;
  const latestPosts    = latestPostsR.status === "fulfilled" ? latestPostsR.value : EMPTY_POSTS;
  const hotPosts       = hotPostsR.status    === "fulfilled" ? hotPostsR.value    : EMPTY_POSTS;

  const LIVE       = new Set(["1H", "HT", "2H", "ET", "P"]);
  const liveFixtures = liveAllFixtures.filter(
    (f) => LIVE.has(f.status) && (f.homeTeam.id === entry.id || f.awayTeam.id === entry.id)
  );
  const recentMatches   = fixturesToMatches(recentFixtures, loc);
  const liveMatches     = fixturesToMatches(liveFixtures, loc);
  const upcomingMatches = fixturesToMatches(upcomingFixtures, loc);

  const standingRow = standings
    ? standingsToRows(standings).find((r) => r.team === entry.nameEn || r.teamKo === entry.nameKo)
    : null;

  const ordinal = (n: number) => ["st","nd","rd"][n-1] ?? "th";

  return (
    <main className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Team Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="bg-white rounded-full p-2 border border-gray-100 shadow-sm shrink-0">
              <TeamLogo logo={teamLogo} name={teamName} size={56} />
            </div>

            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight mb-1">{teamName}</h1>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <a
                  href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}`}
                  className="text-gray-500 hover:text-gray-700 no-underline transition-colors"
                >
                  {league.flag} {leagueName}
                </a>
                {standingRow && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className={`font-bold ${standingRow.pos <= 4 ? "text-emerald-600" : "text-gray-700"}`}>
                      {isKo ? `${standingRow.pos}위` : `${standingRow.pos}${ordinal(standingRow.pos)}`}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">{standingRow.pts} {t.pts}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form strip */}
          {standingRow && standingRow.form.length > 0 && (
            <div className="flex items-center gap-2 mt-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.form}</span>
              {standingRow.form.map((f, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${FORM_BG[f] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdSlot slotId={`team-${slug}-top`} size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* LIVE */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                  <h2 className="text-base font-bold text-red-600">{isKo ? "라이브" : "LIVE"}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {liveMatches.map((m) => (
                    <a
                      key={m.id}
                      href={`/${loc}/match/${m.id}`}
                      className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-red-50 border border-red-200 no-underline hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={22} />
                        <span className="truncate text-sm font-semibold text-gray-900">{m.homeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mx-3">
                        <span className="text-red-600 text-base font-black">{m.homeScore}</span>
                        <span className="text-gray-300">–</span>
                        <span className="text-red-600 text-base font-black">{m.awayScore}</span>
                        {m.minute && <span className="text-red-500 text-xs font-bold ml-1">{m.minute}&apos;</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="truncate text-right text-sm font-semibold text-gray-900">{m.awayTeam}</span>
                        <TeamLogo logo={m.awayLogo} name={m.awayTeam} size={22} />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Results */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h2 className="text-base font-bold text-gray-900">{t.recentResults}</h2>
                </div>
                <a href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/results`}
                   className="text-sm text-emerald-600 hover:text-emerald-700 font-medium no-underline transition-colors">
                  {t.viewAllMatches}
                </a>
              </div>

              {recentMatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
                  {t.noResults}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {recentMatches.map((m, idx) => {
                    const isHome  = m.homeTeam === teamName;
                    const scored  = isHome ? m.homeScore : m.awayScore;
                    const conceded = isHome ? m.awayScore : m.homeScore;
                    const won  = (scored ?? 0) > (conceded ?? 0);
                    const lost = (scored ?? 0) < (conceded ?? 0);
                    const result = won ? "W" : lost ? "L" : "D";
                    return (
                      <a
                        key={m.id}
                        href={`/${loc}/match/${m.id}`}
                        className={`flex items-center justify-between px-5 py-3 no-underline hover:bg-gray-50 transition-colors ${idx < recentMatches.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black shrink-0 mr-3 ${FORM_BG[result] ?? "bg-gray-100 text-gray-500"}`}>
                          {result}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={20} />
                          <span className={`truncate text-sm ${m.homeTeam === teamName ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                            {m.homeTeam}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mx-3 bg-gray-100 rounded-lg px-3 py-1">
                          <span className="text-sm font-black text-gray-900 tabular-nums">{m.homeScore}</span>
                          <span className="text-gray-400 text-xs">–</span>
                          <span className="text-sm font-black text-gray-900 tabular-nums">{m.awayScore}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className={`truncate text-right text-sm ${m.awayTeam === teamName ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                            {m.awayTeam}
                          </span>
                          <TeamLogo logo={m.awayLogo} name={m.awayTeam} size={20} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming Fixtures */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h2 className="text-base font-bold text-gray-900">{t.upcomingFixtures}</h2>
                </div>
                <a href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/fixtures`}
                   className="text-sm text-emerald-600 hover:text-emerald-700 font-medium no-underline transition-colors">
                  {t.viewAllMatches}
                </a>
              </div>

              {upcomingMatches.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
                  {t.noUpcoming}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {upcomingMatches.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between px-5 py-3 ${idx < upcomingMatches.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={20} />
                        <span className={`truncate text-sm ${m.homeTeam === teamName ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                          {m.homeTeam}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0 mx-3">
                        {m.time && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
                            {m.time}
                          </span>
                        )}
                        {m.venue && <span className="text-gray-400 text-xs truncate max-w-28">{m.venue}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`truncate text-right text-sm ${m.awayTeam === teamName ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                          {m.awayTeam}
                        </span>
                        <TeamLogo logo={m.awayLogo} name={m.awayTeam} size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Squad */}
            <SquadSection
              players={squad}
              teamName={teamName}
              teamFlag={entry.flag}
              locale={loc}
              isLive={!!process.env.API_FOOTBALL_KEY && squad.length > 0}
              updatedAt={new Date().toISOString()}
            />

            {/* Fan Discussions */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h2 className="text-base font-bold text-gray-900">
                    💬 {isKo ? "팬 토론" : "Fan Discussions"}
                  </h2>
                </div>
                <a href={`/${loc}/team/${slug}/community`}
                   className="text-sm text-emerald-600 hover:text-emerald-700 font-medium no-underline transition-colors">
                  {isKo ? "전체 보기 →" : "View all →"}
                </a>
              </div>

              {latestPosts.posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <div className="text-4xl mb-3">{entry.flag}</div>
                  <p className="text-gray-400 text-sm mb-4">
                    {isKo ? `아직 ${teamName} 관련 게시글이 없습니다.` : `No ${teamName} posts yet — be the first!`}
                  </p>
                  <a
                    href={`/${loc}/community/write?team=${internalSlug}`}
                    className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg no-underline transition-colors"
                  >
                    {isKo ? "첫 글 작성하기" : "Write the first post"}
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {latestPosts.posts.map((post) => {
                    const meta = CATEGORY_META[post.category as PostCategory] ?? CATEGORY_META["general"];
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
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-6">

            {/* Hot Discussions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  🔥 {isKo ? "인기 토론" : "Hot Discussions"}
                </h3>
                <a href={`/${loc}/team/${slug}/community`}
                   className="text-xs font-medium text-emerald-600 hover:text-emerald-700 no-underline transition-colors">
                  {isKo ? "전체 보기 →" : "View all →"}
                </a>
              </div>

              {hotPosts.posts.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-gray-400 mb-2">{isKo ? "아직 게시글이 없습니다." : "No posts yet."}</p>
                  <a href={`/${loc}/community/write?team=${internalSlug}`}
                     className="text-xs text-emerald-600 font-medium no-underline hover:text-emerald-700 transition-colors">
                    {isKo ? "첫 글 쓰기 →" : "Write the first post →"}
                  </a>
                </div>
              ) : (
                <>
                  {hotPosts.posts.map((post, idx) => (
                    <a
                      key={post.id}
                      href={`/${loc}/community/post/${post.id}`}
                      className={`flex gap-3 px-4 py-3 no-underline hover:bg-gray-50 transition-colors ${idx < hotPosts.posts.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <span className={`text-sm font-black shrink-0 min-w-4 ${idx === 0 ? "text-emerald-600" : idx === 1 ? "text-amber-500" : "text-gray-400"}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-1">{post.title}</div>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>▲ {post.likeCount}</span>
                          <span>💬 {post.commentCount}</span>
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <a
                      href={`/${loc}/community/write?team=${internalSlug}`}
                      className="block text-center py-2 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-50 no-underline transition-colors"
                    >
                      ✏️ {isKo ? "글쓰기" : "Write a Post"}
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Standings Position */}
            {standingRow ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{t.standingsPosition}</h3>
                  <a href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/standings`}
                     className="text-xs font-medium text-emerald-600 hover:text-emerald-700 no-underline transition-colors">
                    {t.viewFullTable}
                  </a>
                </div>
                <div className="p-4">
                  {/* Position highlight */}
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className={`text-4xl font-black leading-none min-w-10 text-center ${standingRow.pos <= 4 ? "text-emerald-600" : "text-amber-500"}`}>
                      {standingRow.pos}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{teamName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{league.flag} {leagueName}</div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-px bg-gray-200 rounded-xl overflow-hidden">
                    {[
                      { label: t.played, value: standingRow.played },
                      { label: t.won,    value: standingRow.won },
                      { label: t.drawn,  value: standingRow.drawn },
                      { label: t.lost,   value: standingRow.lost },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white px-2 py-3 text-center">
                        <div className="text-base font-black text-gray-900">{value}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{t.pts}</span>
                    <span className="text-2xl font-black text-gray-900">{standingRow.pts}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 py-8 text-center text-sm text-gray-400">
                {t.notInStandings}
              </div>
            )}

            <AdSlot slotId={`team-${slug}-sidebar`} size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
