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
import AdSlot from "@/components/ads/AdSlot";
import { getPostsByLeague } from "@/lib/community/teamPosts";
import { TEAM_REGISTRY } from "@/lib/football/teamRegistry";

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
    analysis:         "Latest Analysis",
    viewAll:          "View all →",
    ft:               "FT",
    standingsPreview: "Table",
    pos:              "Pos",
    team:             "Club",
    pts:              "Pts",
    played:           "P",
    gd:               "GD",
    noResults:        "No recent results.",
    noUpcoming:       "No upcoming fixtures.",
  },
  ko: {
    recentResults:    "최근 결과",
    upcoming:         "다가오는 경기",
    analysis:         "최근 분석",
    viewAll:          "전체 보기 →",
    ft:               "종료",
    standingsPreview: "순위",
    pos:              "순위",
    team:             "클럽",
    pts:              "승점",
    played:           "경기",
    gd:               "득실",
    noResults:        "최근 결과가 없습니다.",
    noUpcoming:       "예정된 경기가 없습니다.",
  },
};

type PostCategory = "match-discussion" | "transfer-news" | "tactics" | "highlights" | "predictions" | "general";

const CATEGORY_META: Record<PostCategory, { labelEn: string; labelKo: string; color: string; bg: string; border: string }> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"   },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#8b949e", bg: "rgba(139,148,158,0.1)", border: "rgba(139,148,158,0.25)" },
};

const MOCK_ANALYSIS = [
  {
    slug:       "arsenal-liverpool-preview",
    titleEn:    "Arsenal vs Liverpool: Title Race Decider Preview",
    titleKo:    "아스날 vs 리버풀: 타이틀 레이스 결정전 프리뷰",
    confidence: 72,
    outcomeEn:  "Arsenal Win",
    outcomeKo:  "아스날 승리",
  },
  {
    slug:       "man-city-tactical-breakdown",
    titleEn:    "Man City's Pressing System — A Deep Dive",
    titleKo:    "맨시티 프레싱 시스템 심층 분석",
    confidence: 65,
    outcomeEn:  "Home Win",
    outcomeKo:  "홈 승리",
  },
];

// ─── Shared row renderers ─────────────────────────────────────────────────────

function SectionHeader({ title, href, viewAll }: { title: string; href: string; viewAll: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="section-title-bar" />
        <h2 style={{ color: "#e6edf3", fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      <a href={href} style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
        {viewAll}
      </a>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center py-10 rounded-xl"
      style={{ background: "#161b22", border: "1px solid #30363d" }}
    >
      <p style={{ color: "#484f58", fontSize: 13 }}>{message}</p>
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

  // 301 redirect old slugs to canonical
  if (LEAGUE_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/league/${LEAGUE_URL_REDIRECTS[slug]}`);
  }

  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const league       = LEAGUE_BY_SLUG[internalSlug];
  if (!league) notFound();

  const t    = labels[loc];
  const isKo = loc === "ko";

  // Fetch all data in parallel via the provider abstraction
  const [results, upcoming, standings, communityResult] = await Promise.all([
    queryRecentResults(internalSlug, 5),
    queryUpcomingFixtures(internalSlug, 5),
    queryStandings(internalSlug),
    getPostsByLeague(internalSlug, { sort: "latest", limit: 10 }),
  ]);

  const recentMatches   = fixturesToMatches(results, loc);
  const upcomingMatches = fixturesToMatches(upcoming, loc);
  const standingRows    = standings ? standingsToRows(standings, 6) : [];

  // Teams in this league, derived from the static registry
  const leagueTeams = Object.entries(TEAM_REGISTRY)
    .filter(([, entry]) => entry.leagueSlug === internalSlug)
    .map(([teamSlug, entry]) => ({ slug: teamSlug, ...entry }));

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* League header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <LeagueHeader slug={internalSlug} locale={loc} />
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdSlot slotId={`league-${slug}-top`} size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main content ── */}
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
                <div
                  style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {recentMatches.map((m, idx) => {
                    const homeWin = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                    const awayWin = (m.awayScore ?? 0) > (m.homeScore ?? 0);
                    return (
                      <a
                        key={m.id}
                        href={`/${loc}/match/${m.id}`}
                        className="hover-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 20px",
                          borderBottom: idx < recentMatches.length - 1 ? "1px solid #21262d" : "none",
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Home team */}
                        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{m.homeFlag}</span>
                          <span
                            className="truncate"
                            style={{
                              color: homeWin ? "#e6edf3" : "#8b949e",
                              fontSize: 14,
                              fontWeight: homeWin ? 700 : 500,
                            }}
                          >
                            {m.homeTeam}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center gap-1 shrink-0 mx-3">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              background: "#0d1117",
                              borderRadius: 8,
                              padding: "4px 14px",
                              border: "1px solid #21262d",
                            }}
                          >
                            <span style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800 }}>{m.homeScore}</span>
                            <span style={{ color: "#484f58", fontSize: 12 }}>–</span>
                            <span style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800 }}>{m.awayScore}</span>
                          </div>
                          <span style={{ color: "#484f58", fontSize: 10, fontWeight: 600 }}>{t.ft}</span>
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 justify-end" style={{ flex: 1, minWidth: 0 }}>
                          <span
                            className="truncate text-right"
                            style={{
                              color: awayWin ? "#e6edf3" : "#8b949e",
                              fontSize: 14,
                              fontWeight: awayWin ? 700 : 500,
                            }}
                          >
                            {m.awayTeam}
                          </span>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{m.awayFlag}</span>
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
                <div
                  style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {upcomingMatches.map((m, idx) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        borderBottom: idx < upcomingMatches.length - 1 ? "1px solid #21262d" : "none",
                      }}
                    >
                      {/* Home */}
                      <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{m.homeFlag}</span>
                        <span className="truncate" style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>
                          {m.homeTeam}
                        </span>
                      </div>

                      {/* Kick-off time */}
                      <div className="flex flex-col items-center gap-1 shrink-0 mx-3">
                        {m.time && (
                          <span
                            style={{
                              color: "#22c55e",
                              fontSize: 14,
                              fontWeight: 700,
                              background: "rgba(34,197,94,0.08)",
                              border: "1px solid rgba(34,197,94,0.2)",
                              borderRadius: 6,
                              padding: "3px 10px",
                            }}
                          >
                            {m.time}
                          </span>
                        )}
                        {m.venue && (
                          <span style={{ color: "#484f58", fontSize: 10 }} className="truncate max-w-24">
                            {m.venue}
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2 justify-end" style={{ flex: 1, minWidth: 0 }}>
                        <span className="truncate text-right" style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>
                          {m.awayTeam}
                        </span>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{m.awayFlag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Latest Analysis */}
            <section>
              <SectionHeader
                title={t.analysis}
                href={`/${loc}/analysis`}
                viewAll={t.viewAll}
              />
              <div className="flex flex-col gap-3">
                {MOCK_ANALYSIS.map((item) => (
                  <a
                    key={item.slug}
                    href={`/${loc}/analysis/${item.slug}`}
                    className="hover-card"
                    style={{
                      display: "block",
                      background: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: 12,
                      padding: "18px 20px",
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase" as const,
                            color: "#8b5cf6",
                            background: "rgba(139,92,246,0.12)",
                            border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: 5,
                            padding: "3px 9px",
                            display: "inline-block",
                            width: "fit-content",
                          }}
                        >
                          {isKo ? "AI 프리뷰" : "AI Preview"}
                        </span>
                        <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.45 }}>
                          {isKo ? item.titleKo : item.titleEn}
                        </h3>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ color: "#22c55e", fontSize: 20, fontWeight: 800 }}>{item.confidence}%</div>
                        <div style={{ color: "#8b949e", fontSize: 11 }}>{isKo ? item.outcomeKo : item.outcomeEn}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* ── Teams in this league ── */}
            {leagueTeams.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <span className="section-title-bar" />
                  <h2 style={{ color: "#e6edf3", fontSize: 18, fontWeight: 700, margin: "0 0 0 8px" }}>
                    {isKo ? "⚽ 팀" : "⚽ Teams"}
                  </h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
                  {leagueTeams.map((team) => (
                    <a
                      key={team.slug}
                      href={`/${loc}/team/${team.slug}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 12px", borderRadius: 10,
                        backgroundColor: "#161b22", border: "1px solid #30363d",
                        textDecoration: "none", transition: "border-color 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{team.flag}</span>
                      <span style={{ color: "#c9d1d9", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
                        {isKo ? team.nameKo : team.nameEn}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ── Community discussion ── */}
            <section>
              <SectionHeader
                title={isKo ? "💬 팬 토론" : "💬 Fan Discussion"}
                href={`/${loc}/community`}
                viewAll={isKo ? "커뮤니티 →" : "Community →"}
              />
              {communityResult.posts.length === 0 ? (
                <EmptyCard message={isKo ? "아직 게시글이 없습니다." : "No posts yet."} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {communityResult.posts.map((post) => {
                    const catMeta = CATEGORY_META[post.category as PostCategory];
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
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-6">
            {/* Compact standings */}
            <div
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid #21262d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {t.standingsPreview}
                </h3>
                <a
                  href={`/${loc}/league/${slug}/standings`}
                  style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                >
                  {t.viewAll}
                </a>
              </div>

              {standingRows.length === 0 ? (
                <div className="px-4 py-6">
                  <p style={{ color: "#484f58", fontSize: 12, textAlign: "center" as const }}>—</p>
                </div>
              ) : (
                standingRows.map((row, idx) => (
                  <div
                    key={row.team}
                    className="hover-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 18px",
                      borderBottom: idx < standingRows.length - 1 ? "1px solid #21262d" : "none",
                      transition: "background 0.15s",
                    }}
                  >
                    <span
                      style={{
                        color: row.pos <= 4 ? "#22c55e" : row.pos === 5 ? "#f59e0b" : "#484f58",
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 18,
                        textAlign: "right" as const,
                      }}
                    >
                      {row.pos}
                    </span>
                    <span style={{ fontSize: 16 }}>{row.flag}</span>
                    <span
                      style={{
                        color: "#e6edf3",
                        fontSize: 13,
                        fontWeight: 600,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {isKo ? (row.teamKo ?? row.team) : row.team}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 12, minWidth: 22, textAlign: "right" as const }}>
                      {row.played}
                    </span>
                    <span
                      style={{
                        color: "#e6edf3",
                        fontSize: 13,
                        fontWeight: 800,
                        minWidth: 28,
                        textAlign: "right" as const,
                      }}
                    >
                      {row.pts}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar ad */}
            <AdSlot slotId={`league-${slug}-sidebar`} size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
