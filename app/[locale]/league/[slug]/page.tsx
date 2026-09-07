import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildLeagueMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug } from "@/lib/football/types";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import {
  ALL_VALID_LEAGUE_URL_SLUGS,
  LEAGUE_URL_REDIRECTS,
  resolveLeagueUrlSlug,
} from "@/lib/football/slugs";
import {
  queryRecentResults,
  queryUpcomingFixtures,
  queryStandings,
} from "@/lib/football/query";
import { fixturesToMatches, standingsToRows } from "@/lib/football/adapters";
import LeagueHeader from "@/components/league/LeagueHeader";
import PostCard from "@/components/community/PostCard";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import { getPostsByLeague } from "@/lib/community/teamPosts";
import { TEAM_REGISTRY } from "@/lib/football/teamRegistry";
import { listAnalysesByLeague } from "@/lib/analysis/db";
import { TeamLogo } from "@/components/ui/TeamLogo";

export const revalidate = 3600; // 1시간 ISR

function isValidLeagueUrlSlug(value: string): boolean {
  return ALL_VALID_LEAGUE_URL_SLUGS.includes(value);
}

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  return locales.flatMap((locale) =>
    ALL_VALID_LEAGUE_URL_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) return {};
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  return buildLeagueMetadata(locale as Locale, internalSlug);
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    recentResults:    "Recent Results",
    upcoming:         "Upcoming Fixtures",
    analysis:         "AI Match Analysis",
    viewAll:          "View all →",
    ft:               "FT",
    standingsTitle:   "Standings",
    pos:              "Pos",
    team:             "Club",
    pts:              "Pts",
    played:           "P",
    gd:               "GD",
    noResults:        "No recent results.",
    noUpcoming:       "No upcoming fixtures.",
    noAnalysis:       "Analysis coming soon.",
    teams:            "Teams",
    fanDiscussion:    "Fan Discussion",
    community:        "Community →",
    leagueStats:      "League Stats",
    decidedMatches:   "Decided Matches",
    draws:            "Draws",
    avgGoals:         "Avg Goals",
    topTeam:          "Top of Table",
  },
  ko: {
    recentResults:    "최근 결과",
    upcoming:         "다가오는 경기",
    analysis:         "AI 경기 분석",
    viewAll:          "전체 보기 →",
    ft:               "종료",
    standingsTitle:   "순위표",
    pos:              "순위",
    team:             "클럽",
    pts:              "승점",
    played:           "경기",
    gd:               "득실",
    noResults:        "최근 결과가 없습니다.",
    noUpcoming:       "예정된 경기가 없습니다.",
    noAnalysis:       "분석이 곧 제공됩니다.",
    teams:            "팀",
    fanDiscussion:    "팬 토론",
    community:        "커뮤니티 →",
    leagueStats:      "리그 통계",
    decidedMatches:   "승부 결정",
    draws:            "무승부",
    avgGoals:         "경기당 평균 득점",
    topTeam:          "리그 1위",
  },
};

type PostCategory = "match-discussion" | "transfer-news" | "tactics" | "highlights" | "predictions" | "general" | "notice" | "worldcup-2026";

const CATEGORY_META: Record<PostCategory, { labelEn: string; labelKo: string; color: string; bg: string; border: string }> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#059669", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"   },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#8b949e", bg: "rgba(139,148,158,0.1)", border: "rgba(139,148,158,0.25)" },
  "notice":           { labelEn: "Notice",           labelKo: "공지사항",    color: "#059669", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)"    },
  "worldcup-2026":    { labelEn: "2026 World Cup",   labelKo: "2026 월드컵", color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.25)"   },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, href, viewAll }: { title: string; href: string; viewAll: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="w-0.5 h-5 rounded-full bg-emerald-600 shrink-0" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <a href={href} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
        {viewAll}
      </a>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10 rounded-xl bg-white border border-gray-200">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) notFound();

  if (LEAGUE_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/league/${LEAGUE_URL_REDIRECTS[slug]}`);
  }

  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const league       = LEAGUE_BY_SLUG[internalSlug];
  if (!league) notFound();

  const t    = labels[loc];
  const isKo = loc === "ko";

  // allSettled: slow or failing sources never block the rest of the page
  const [resultsR, upcomingR, standingsR, communityR, analysesR] = await Promise.allSettled([
    queryRecentResults(internalSlug, 8),
    queryUpcomingFixtures(internalSlug, 8),
    queryStandings(internalSlug),
    getPostsByLeague(internalSlug, { sort: "latest", limit: 10 }),
    listAnalysesByLeague(internalSlug, loc, 3),
  ]);

  const results        = resultsR.status   === "fulfilled" ? resultsR.value   : [];
  const upcoming       = upcomingR.status  === "fulfilled" ? upcomingR.value  : [];
  const standings      = standingsR.status === "fulfilled" ? standingsR.value : null;
  const communityResult = communityR.status === "fulfilled" ? communityR.value : { posts: [], total: 0 };
  const analyses       = analysesR.status  === "fulfilled" ? analysesR.value  : [];

  const recentMatches   = fixturesToMatches(results, loc);
  const upcomingMatches = fixturesToMatches(upcoming, loc);
  const standingRows    = standings ? standingsToRows(standings) : [];
  const topRows         = standingRows.slice(0, 20);

  // League teams: prefer live standings (current-season accurate) over static registry
  // Build an ID→slug lookup so we can link to /team/{slug} from standings data
  const teamIdToSlug = Object.fromEntries(
    Object.entries(TEAM_REGISTRY).map(([slug, entry]) => [entry.id, slug])
  );
  const leagueTeams = Object.entries(TEAM_REGISTRY)
    .filter(([, entry]) => entry.leagueSlug === internalSlug)
    .map(([, entry]) => entry);

  // League stats derived from standings
  // StandingEntry has only aggregate won/drawn/lost — no home/away split.
  const totalTeams = standingRows.length;
  const totalGames = standingRows.reduce((s, r) => s + r.played, 0) / 2; // each match counted twice
  const drawnGames = standingRows.reduce((s, r) => s + r.drawn, 0) / 2;
  const drawPct    = totalGames > 0 ? Math.round((drawnGames / totalGames) * 100) : 0;
  const decidedPct = totalGames > 0 ? 100 - drawPct : 0;
  const leader     = standingRows[0];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* League header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <LeagueHeader slug={internalSlug} locale={loc} />
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdBanner slot="league-top" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content (2/3) ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Recent Results */}
            <section>
              <SectionHeader
                title={t.recentResults}
                href={`/${loc}/league/${slug}/results`}
                viewAll={t.viewAll}
              />
              {recentMatches.length === 0 ? (
                <EmptyCard message={t.noResults} />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {recentMatches.map((m) => {
                    const homeWin = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                    const awayWin = (m.awayScore ?? 0) > (m.homeScore ?? 0);
                    return (
                      <a
                        key={m.id}
                        href={`/${loc}/match/${m.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={20} />
                          <span className={`text-sm truncate ${homeWin ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                            {m.homeTeam}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 shrink-0 mx-3">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                            <span className="text-base font-black text-gray-900 tabular-nums">{m.homeScore}</span>
                            <span className="text-gray-300 text-xs">–</span>
                            <span className="text-base font-black text-gray-900 tabular-nums">{m.awayScore}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400">{t.ft}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
                          <span className={`text-sm truncate text-right ${awayWin ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
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
              <SectionHeader
                title={t.upcoming}
                href={`/${loc}/league/${slug}/fixtures`}
                viewAll={t.viewAll}
              />
              {upcomingMatches.length === 0 ? (
                <EmptyCard message={t.noUpcoming} />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {upcomingMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo logo={m.homeLogo} name={m.homeTeam} size={20} />
                        <span className="text-sm font-semibold text-gray-800 truncate">{m.homeTeam}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0 mx-3">
                        {m.time && (
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-0.5">
                            {m.time}
                          </span>
                        )}
                        {m.venue && (
                          <span className="text-[10px] text-gray-400 truncate max-w-28">{m.venue}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam}</span>
                        <TeamLogo logo={m.awayLogo} name={m.awayTeam} size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* AI Analysis */}
            <section>
              <SectionHeader
                title={t.analysis}
                href={`/${loc}/analysis`}
                viewAll={t.viewAll}
              />
              {analyses.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                  <span className="text-3xl">🤖</span>
                  <p className="text-sm text-gray-400 mt-2">{t.noAnalysis}</p>
                  <a
                    href={`/${loc}/analysis`}
                    className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {isKo ? "전체 분석 보기 →" : "Browse all analysis →"}
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {analyses.map((item) => (
                    <a
                      key={item.id}
                      href={`/${loc}/analysis/${item.slug}`}
                      className="block bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5 w-fit ${
                              item.type === "preview"
                                ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                                : "text-blue-600 bg-blue-50 border border-blue-200"
                            }`}>
                              {item.type === "preview"
                                ? (isKo ? "AI 프리뷰" : "AI Preview")
                                : (isKo ? "AI 리캡" : "AI Recap")}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(item.generatedAt).toLocaleDateString(isKo ? "ko-KR" : "en-GB", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.title}</h3>
                          {item.summary && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.summary}</p>
                          )}
                        </div>
                        {item.prediction && (
                          <div className="text-right shrink-0">
                            <div className="text-xl font-black text-emerald-600">{item.prediction.confidence}%</div>
                            <div className="text-xs text-gray-400">{item.prediction.label}</div>
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                  <a
                    href={`/${loc}/analysis`}
                    className="text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 py-2"
                  >
                    {isKo ? "모든 분석 보기 →" : "View all analyses →"}
                  </a>
                </div>
              )}
            </section>

            {/* Teams in this league */}
            {(standingRows.length > 0 || leagueTeams.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-0.5 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h2 className="text-lg font-bold text-gray-900">⚽ {t.teams}</h2>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
                  {standingRows.length > 0
                    ? /* Live: standings-based list — always current season */ standingRows.map((row) => {
                        const teamSlug = teamIdToSlug[row.teamId];
                        const logoUrl = row.logo ?? `https://media.api-sports.io/football/teams/${row.teamId}.png`;
                        const name = isKo ? (row.teamKo ?? row.team) : row.team;
                        const href = teamSlug ? `/${loc}/team/${teamSlug}` : undefined;
                        return (
                          <a
                            key={row.teamId}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 bg-white border border-gray-200 rounded-lg transition-colors ${href ? "hover:border-emerald-300 hover:text-emerald-700" : "pointer-events-none"}`}
                          >
                            <div className="bg-white rounded-full p-0.5 border border-gray-100 shadow-sm shrink-0">
                              <TeamLogo logo={logoUrl} name={name} size={28} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 leading-snug truncate">
                              {name}
                            </span>
                          </a>
                        );
                      })
                    : /* Fallback: static registry with CDN logo */ leagueTeams.map((team) => (
                        <a
                          key={team.slug}
                          href={`/${loc}/team/${team.slug}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                        >
                          <div className="bg-white rounded-full p-0.5 border border-gray-100 shadow-sm shrink-0">
                            <TeamLogo
                              logo={`https://media.api-sports.io/football/teams/${team.id}.png`}
                              name={isKo ? team.nameKo : team.nameEn}
                              size={28}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 leading-snug truncate">
                            {isKo ? team.nameKo : team.nameEn}
                          </span>
                        </a>
                      ))
                  }
                </div>
              </section>
            )}

            {/* Community discussion */}
            <section>
              <SectionHeader
                title={`💬 ${t.fanDiscussion}`}
                href={`/${loc}/community`}
                viewAll={t.community}
              />
              {communityResult.posts.length === 0 ? (
                <EmptyCard message={isKo ? "아직 게시글이 없습니다." : "No posts yet."} />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {communityResult.posts.map((post) => {
                    const catMeta = CATEGORY_META[post.category as PostCategory] ?? CATEGORY_META["general"];
                    return (
                      <PostCard
                        key={post.id}
                        href={`/${loc}/community/post/${post.id}`}
                        title={post.title}
                        preview={post.preview}
                        timeAgo={post.timeAgo}
                        category={catMeta}
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
                  <div className="px-5 py-3 bg-gray-50">
                    <a href={`/${loc}/community`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      {isKo ? "커뮤니티 전체 보기 →" : "View all community posts →"}
                    </a>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="flex flex-col gap-5">

            {/* Full standings (top 8 with zone indicators) */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-800">{t.standingsTitle}</h3>
                <a href={`/${loc}/league/${slug}/standings`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  {t.viewAll}
                </a>
              </div>

              {topRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">—</div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-100 bg-gray-50/50">
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-right">{t.pos}</span>
                    <span className="flex-1 text-[10px] font-bold text-gray-400">{t.team}</span>
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-right">{t.played}</span>
                    <span className="text-[10px] font-bold text-gray-400 w-6 text-right">{t.gd}</span>
                    <span className="text-[10px] font-bold text-gray-400 w-7 text-right">{t.pts}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {topRows.map((row) => {
                      const zoneColor =
                        row.pos <= 4 ? "bg-blue-500" :
                        row.pos === 5 ? "bg-orange-400" :
                        totalTeams > 0 && row.pos >= totalTeams - 2 ? "bg-red-500" :
                        "bg-transparent";
                      return (
                        <div key={row.pos} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors">
                          <div className="relative flex items-center justify-end w-5">
                            <span className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${zoneColor}`} />
                            <span className={`text-xs font-bold tabular-nums ${
                              row.pos <= 4 ? "text-blue-600" :
                              row.pos === 5 ? "text-orange-500" :
                              totalTeams > 0 && row.pos >= totalTeams - 2 ? "text-red-500" :
                              "text-gray-400"
                            }`}>
                              {row.pos}
                            </span>
                          </div>
                          <TeamLogo logo={row.logo} name={row.team} size={16} />
                          <span className="text-xs font-medium text-gray-800 flex-1 truncate">
                            {row.displayName}
                          </span>
                          <span className="text-[11px] text-gray-400 tabular-nums w-5 text-right">{row.played}</span>
                          <span className="text-[11px] text-gray-400 tabular-nums w-6 text-right">{row.gd}</span>
                          <span className="text-xs font-bold text-gray-900 tabular-nums w-7 text-right">{row.pts}</span>
                        </div>
                      );
                    })}
                  </div>
                  {standingRows.length > 8 && (
                    <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                      <a href={`/${loc}/league/${slug}/standings`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                        {isKo ? `전체 ${standingRows.length}팀 보기 →` : `View all ${standingRows.length} teams →`}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* League Stats */}
            {totalTeams > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">📊 {t.leagueStats}</h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {/* Leader */}
                  {leader && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{t.topTeam}</span>
                      <div className="flex items-center gap-1.5">
                        <TeamLogo logo={leader.logo} name={leader.team} size={16} />
                        <span className="text-xs font-bold text-gray-900">{leader.displayName}</span>
                        <span className="text-xs text-emerald-600 font-bold">{leader.pts}pts</span>
                      </div>
                    </div>
                  )}
                  {/* Match outcome distribution */}
                  {totalGames > 0 && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{t.decidedMatches}</span>
                          <span className="text-xs font-bold text-gray-700">{decidedPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${decidedPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{t.draws}</span>
                          <span className="text-xs font-bold text-gray-700">{drawPct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-400 rounded-full" style={{ width: `${drawPct}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{isKo ? "팀 수" : "Teams"}</span>
                    <span className="text-xs font-bold text-gray-700">{totalTeams}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar ad */}
            <AdSidebar slot="league-sidebar" />
          </div>
        </div>
      </div>
    </main>
  );
}
