import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFootballProvider } from "@/lib/football/provider";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { fixturesToMatches } from "@/lib/football/adapters";
import { standingsToRows } from "@/lib/football/adapters";
import { queryStandings } from "@/lib/football/query";
import { TEAM_REGISTRY, VALID_TEAM_SLUGS } from "@/lib/football/teamRegistry";
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
import type { Metadata } from "next";

// Canonical URL slugs + old redirect slugs (for pre-rendering the 301 page)
const VALID_SLUGS = [
  ...VALID_TEAM_SLUGS.map(canonicalTeamUrl),
  ...Object.keys(TEAM_URL_REDIRECTS),
];

type PostCategory = "match-discussion" | "transfer-news" | "tactics" | "highlights" | "predictions" | "general";

const CATEGORY_META: Record<PostCategory, { labelEn: string; labelKo: string; color: string; bg: string; border: string }> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)"   },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#8b949e", bg: "rgba(139,148,158,0.1)", border: "rgba(139,148,158,0.25)" },
};

const FORM_COLORS: Record<string, { background: string; color: string }> = {
  W: { background: "#22c55e22", color: "#22c55e" },
  D: { background: "#f59e0b22", color: "#f59e0b" },
  L: { background: "#ef444422", color: "#ef4444" },
};

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  return VALID_SLUGS.flatMap((slug) => locales.map((locale) => ({ locale, slug })));
}

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
  const loc          = locale as Locale;
  const name         = loc === "ko" ? entry.nameKo : entry.nameEn;
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
    recentResults: "Recent Results",
    upcomingFixtures: "Upcoming Fixtures",
    standingsPosition: "League Position",
    ft: "FT",
    vs: "vs",
    viewFullTable: "Full table →",
    viewAllMatches: "All matches →",
    noResults: "No recent results.",
    noUpcoming: "No upcoming fixtures.",
    notInStandings: "Not in standings.",
    pos: "Pos",
    pts: "Pts",
    played: "P",
    won: "W",
    drawn: "D",
    lost: "L",
    form: "Form",
  },
  ko: {
    recentResults: "최근 결과",
    upcomingFixtures: "다가오는 경기",
    standingsPosition: "리그 순위",
    ft: "종료",
    vs: "vs",
    viewFullTable: "전체 순위 →",
    viewAllMatches: "전체 경기 →",
    noResults: "최근 결과가 없습니다.",
    noUpcoming: "예정된 경기가 없습니다.",
    notInStandings: "순위 정보가 없습니다.",
    pos: "순위",
    pts: "승점",
    played: "경기",
    won: "승",
    drawn: "무",
    lost: "패",
    form: "최근",
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

  // 301 redirect old slugs (e.g. man-united → manchester-united)
  if (TEAM_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/team/${TEAM_URL_REDIRECTS[slug]}`);
  }

  const internalSlug = resolveTeamUrlSlug(slug);
  const entry = TEAM_REGISTRY[internalSlug];
  if (!entry) notFound();

  const loc    = locale as Locale;
  const isKo   = loc === "ko";
  const t      = labels[loc];
  const league = LEAGUE_BY_SLUG[entry.leagueSlug];

  const teamName    = isKo ? entry.nameKo : entry.nameEn;
  const leagueName  = isKo ? league.nameKo : league.name;

  const jsonLd = sportsTeamJsonLd({
    nameEn:      entry.nameEn,
    nameKo:      entry.nameKo,
    leagueName:  leagueName,
    slug,
    locale:      loc,
  });

  // Fetch via provider —  real API swap: these calls stay the same
  const provider = getFootballProvider();
  const [allFixtures, standings, latestPosts, hotPosts] = await Promise.all([
    provider.fetchFixtures(league.id, undefined, league.season),
    queryStandings(entry.leagueSlug),
    getPostsByTeam(internalSlug, { sort: "latest", limit: 10 }),
    getPostsByTeam(internalSlug, { sort: "hot",    limit: 5  }),
  ]);

  // Filter to fixtures involving this team
  const teamFixtures = allFixtures.filter(
    (f) => f.homeTeam.id === entry.id || f.awayTeam.id === entry.id
  );

  const FINISHED = new Set(["FT", "AET", "PEN"]);
  const LIVE     = new Set(["1H", "HT", "2H", "ET", "P"]);

  const recentFixtures  = teamFixtures.filter((f) => FINISHED.has(f.status)).slice(-5);
  const liveFixtures    = teamFixtures.filter((f) => LIVE.has(f.status));
  const upcomingFixtures = teamFixtures.filter((f) => f.status === "NS" || f.status === "PST").slice(0, 5);

  const recentMatches   = fixturesToMatches(recentFixtures, loc);
  const liveMatches     = fixturesToMatches(liveFixtures, loc);
  const upcomingMatches = fixturesToMatches(upcomingFixtures, loc);

  // Find team in standings
  const standingRow = standings
    ? standingsToRows(standings).find((r) => r.team === entry.nameEn || r.teamKo === entry.nameKo)
    : null;

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* ── Team Header ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          borderBottom: "1px solid #21262d",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-5">
            {/* Badge */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "#161b22",
                border: "1px solid #30363d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                flexShrink: 0,
              }}
            >
              {entry.flag}
            </div>

            <div>
              <h1 style={{ color: "#e6edf3", fontSize: 28, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.1 }}>
                {teamName}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}`}
                  style={{ color: "#8b949e", fontSize: 14, textDecoration: "none" }}
                >
                  {league.flag} {leagueName}
                </a>
                {standingRow && (
                  <>
                    <span style={{ color: "#30363d" }}>·</span>
                    <span style={{ color: standingRow.pos <= 4 ? "#22c55e" : "#8b949e", fontSize: 14, fontWeight: 700 }}>
                      {isKo ? `${standingRow.pos}위` : `${standingRow.pos}${["st","nd","rd"][standingRow.pos - 1] ?? "th"}`}
                    </span>
                    <span style={{ color: "#30363d" }}>·</span>
                    <span style={{ color: "#8b949e", fontSize: 14 }}>
                      {standingRow.pts} {t.pts}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form strip */}
          {standingRow && standingRow.form.length > 0 && (
            <div className="flex items-center gap-2 mt-5">
              <span style={{ color: "#484f58", fontSize: 12, fontWeight: 600 }}>{t.form}</span>
              {standingRow.form.map((f, i) => (
                <span
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    ...(FORM_COLORS[f] ?? { background: "#21262d", color: "#8b949e" }),
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot slotId={`team-${slug}-top`} size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main: fixtures ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Live matches */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: "#22c55e" }}
                  />
                  <h2 style={{ color: "#22c55e", fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {isKo ? "라이브" : "LIVE"}
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {liveMatches.map((m) => (
                    <a
                      key={m.id}
                      href={`/${loc}/match/${m.id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px", borderRadius: 12, textDecoration: "none",
                        background: "rgba(34,197,94,0.05)",
                        border: "1px solid rgba(34,197,94,0.25)",
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span style={{ fontSize: 18 }}>{m.homeFlag}</span>
                        <span className="truncate" style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>{m.homeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mx-3">
                        <span style={{ color: "#22c55e", fontSize: 16, fontWeight: 900 }}>{m.homeScore}</span>
                        <span style={{ color: "#484f58" }}>–</span>
                        <span style={{ color: "#22c55e", fontSize: 16, fontWeight: 900 }}>{m.awayScore}</span>
                        {m.minute && (
                          <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{m.minute}&apos;</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="truncate text-right" style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>{m.awayTeam}</span>
                        <span style={{ fontSize: 18 }}>{m.awayFlag}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Results */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="section-title-bar" />
                  <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 700, margin: 0 }}>{t.recentResults}</h2>
                </div>
                <a
                  href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/results`}
                  style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  {t.viewAllMatches}
                </a>
              </div>

              {recentMatches.length === 0 ? (
                <div className="flex items-center justify-center py-10 rounded-xl" style={{ background: "#161b22", border: "1px solid #30363d" }}>
                  <p style={{ color: "#484f58", fontSize: 13 }}>{t.noResults}</p>
                </div>
              ) : (
                <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
                  {recentMatches.map((m, idx) => {
                    const isHome  = m.homeTeam === teamName || m.homeTeam === entry.nameEn;
                    const scored  = isHome ? m.homeScore : m.awayScore;
                    const conceded = isHome ? m.awayScore : m.homeScore;
                    const won     = (scored ?? 0) > (conceded ?? 0);
                    const lost    = (scored ?? 0) < (conceded ?? 0);
                    const result  = won ? "W" : lost ? "L" : "D";

                    return (
                      <a
                        key={m.id}
                        href={`/${loc}/match/${m.id}`}
                        className="hover-row"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "13px 20px", textDecoration: "none",
                          borderBottom: idx < recentMatches.length - 1 ? "1px solid #21262d" : "none",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Result badge */}
                        <span
                          style={{
                            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, marginRight: 12,
                            ...(FORM_COLORS[result] ?? { background: "#21262d", color: "#8b949e" }),
                          }}
                        >
                          {result}
                        </span>

                        {/* Home */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span style={{ fontSize: 16 }}>{m.homeFlag}</span>
                          <span className="truncate" style={{ color: m.homeTeam === teamName ? "#e6edf3" : "#8b949e", fontSize: 14, fontWeight: m.homeTeam === teamName ? 700 : 500 }}>
                            {m.homeTeam}
                          </span>
                        </div>

                        {/* Score */}
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: 6, flexShrink: 0, margin: "0 12px",
                            background: "#0d1117", border: "1px solid #21262d",
                            borderRadius: 8, padding: "4px 12px",
                          }}
                        >
                          <span style={{ color: "#e6edf3", fontSize: 15, fontWeight: 800 }}>{m.homeScore}</span>
                          <span style={{ color: "#484f58" }}>–</span>
                          <span style={{ color: "#e6edf3", fontSize: 15, fontWeight: 800 }}>{m.awayScore}</span>
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="truncate text-right" style={{ color: m.awayTeam === teamName ? "#e6edf3" : "#8b949e", fontSize: 14, fontWeight: m.awayTeam === teamName ? 700 : 500 }}>
                            {m.awayTeam}
                          </span>
                          <span style={{ fontSize: 16 }}>{m.awayFlag}</span>
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
                <div className="flex items-center gap-2">
                  <span className="section-title-bar" />
                  <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 700, margin: 0 }}>{t.upcomingFixtures}</h2>
                </div>
                <a
                  href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/fixtures`}
                  style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  {t.viewAllMatches}
                </a>
              </div>

              {upcomingMatches.length === 0 ? (
                <div className="flex items-center justify-center py-10 rounded-xl" style={{ background: "#161b22", border: "1px solid #30363d" }}>
                  <p style={{ color: "#484f58", fontSize: 13 }}>{t.noUpcoming}</p>
                </div>
              ) : (
                <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
                  {upcomingMatches.map((m, idx) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "13px 20px",
                        borderBottom: idx < upcomingMatches.length - 1 ? "1px solid #21262d" : "none",
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span style={{ fontSize: 16 }}>{m.homeFlag}</span>
                        <span className="truncate" style={{ color: m.homeTeam === teamName ? "#e6edf3" : "#8b949e", fontSize: 14, fontWeight: 600 }}>
                          {m.homeTeam}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0 mx-3">
                        {m.time && (
                          <span
                            style={{
                              color: "#22c55e", fontSize: 13, fontWeight: 700,
                              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                              borderRadius: 6, padding: "3px 10px",
                            }}
                          >
                            {m.time}
                          </span>
                        )}
                        {m.venue && (
                          <span style={{ color: "#484f58", fontSize: 10 }} className="truncate max-w-28">{m.venue}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="truncate text-right" style={{ color: m.awayTeam === teamName ? "#e6edf3" : "#8b949e", fontSize: 14, fontWeight: 600 }}>
                          {m.awayTeam}
                        </span>
                        <span style={{ fontSize: 16 }}>{m.awayFlag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Fan Discussions (latest 10) ── */}
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
                  <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, margin: 0 }}>
                    💬 {isKo ? "팬 토론" : "Fan Discussions"}
                  </h2>
                </div>
                <a href={`/${loc}/team/${slug}/community`} style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  {isKo ? "전체 보기 →" : "View all →"}
                </a>
              </div>
              {latestPosts.posts.length === 0 ? (
                <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "40px 20px", textAlign: "center" }}>
                  <span style={{ fontSize: 36 }}>{entry.flag}</span>
                  <p style={{ color: "#8b949e", fontSize: 14, marginTop: 12 }}>
                    {isKo ? `아직 ${teamName} 관련 게시글이 없습니다.` : `No ${teamName} posts yet — be the first!`}
                  </p>
                  <a
                    href={`/${loc}/community/write?team=${internalSlug}`}
                    style={{ display: "inline-block", marginTop: 14, padding: "8px 20px", backgroundColor: "#22c55e", color: "#0d1117", fontSize: 13, fontWeight: 700, borderRadius: 8, textDecoration: "none" }}
                  >
                    {isKo ? "첫 글 작성하기" : "Write the first post"}
                  </a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {latestPosts.posts.map((post) => {
                    const meta = CATEGORY_META[post.category as PostCategory];
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

          {/* ── Sidebar: hot posts + standings + ad ── */}
          <div className="flex flex-col gap-6">

            {/* Hot community posts card */}
            <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, margin: 0 }}>
                  🔥 {isKo ? "인기 토론" : "Hot Discussions"}
                </h3>
                <a href={`/${loc}/team/${slug}/community`} style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  {isKo ? "전체 보기 →" : "View all →"}
                </a>
              </div>
              {hotPosts.posts.length === 0 ? (
                <div style={{ padding: "20px 18px", textAlign: "center" }}>
                  <p style={{ color: "#484f58", fontSize: 12, margin: "0 0 10px" }}>
                    {isKo ? "아직 게시글이 없습니다." : "No posts yet."}
                  </p>
                  <a
                    href={`/${loc}/community/write?team=${internalSlug}`}
                    style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                  >
                    {isKo ? "첫 글 쓰기 →" : "Write the first post →"}
                  </a>
                </div>
              ) : (
                hotPosts.posts.map((post, idx) => {
                  const rankColor = idx === 0 ? "#22c55e" : idx === 1 ? "#f59e0b" : "#484f58";
                  return (
                    <a
                      key={post.id}
                      href={`/${loc}/community/post/${post.id}`}
                      style={{
                        display: "flex", gap: 10, padding: "11px 16px", textDecoration: "none",
                        borderBottom: idx < hotPosts.posts.length - 1 ? "1px solid #21262d" : "none",
                      }}
                    >
                      <span style={{ color: rankColor, fontSize: 15, fontWeight: 800, flexShrink: 0, minWidth: 18, lineHeight: 1.4 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: "#e6edf3", fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                          marginBottom: 4, overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                        }}>
                          {post.title}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: "#8b949e", fontSize: 11 }}>▲ {post.likeCount}</span>
                          <span style={{ color: "#8b949e", fontSize: 11 }}>💬 {post.commentCount}</span>
                          <span style={{ color: "#484f58", fontSize: 11 }}>{post.timeAgo}</span>
                        </div>
                      </div>
                    </a>
                  );
                })
              )}
              <div style={{ padding: "10px 18px", borderTop: "1px solid #21262d" }}>
                <a
                  href={`/${loc}/community/write?team=${internalSlug}`}
                  style={{
                    display: "block", textAlign: "center", padding: "8px",
                    borderRadius: 8, fontSize: 12, fontWeight: 700,
                    color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)",
                    textDecoration: "none", background: "rgba(34,197,94,0.05)",
                  }}
                >
                  ✏️ {isKo ? "글쓰기" : "Write a Post"}
                </a>
              </div>
            </div>
            {standingRow ? (
              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, overflow: "hidden" }}>
                <div
                  style={{
                    padding: "14px 18px", borderBottom: "1px solid #21262d",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <h3 style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, margin: 0 }}>{t.standingsPosition}</h3>
                  <a
                    href={`/${loc}/league/${canonicalLeagueUrl(entry.leagueSlug)}/standings`}
                    style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                  >
                    {t.viewFullTable}
                  </a>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  {/* Position highlight */}
                  <div
                    className="flex items-center gap-3 mb-4 p-3 rounded-xl"
                    style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
                  >
                    <span
                      style={{
                        color: standingRow.pos <= 4 ? "#22c55e" : "#f59e0b",
                        fontSize: 32, fontWeight: 900, lineHeight: 1,
                        minWidth: 40, textAlign: "center" as const,
                      }}
                    >
                      {standingRow.pos}
                    </span>
                    <div>
                      <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>{teamName}</div>
                      <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>
                        {league.flag} {leagueName}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "1px",
                      background: "#21262d",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { label: t.played, value: standingRow.played },
                      { label: t.won,    value: standingRow.won },
                      { label: t.drawn,  value: standingRow.drawn },
                      { label: t.lost,   value: standingRow.lost },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: "#161b22", padding: "10px 8px", textAlign: "center" as const }}>
                        <div style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800 }}>{value}</div>
                        <div style={{ color: "#484f58", fontSize: 11, marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid #21262d" }}>
                    <span style={{ color: "#8b949e", fontSize: 13 }}>{t.pts}</span>
                    <span style={{ color: "#e6edf3", fontSize: 22, fontWeight: 900 }}>{standingRow.pts}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 rounded-xl" style={{ background: "#161b22", border: "1px solid #30363d" }}>
                <p style={{ color: "#484f58", fontSize: 13 }}>{t.notInStandings}</p>
              </div>
            )}

            <AdSlot slotId={`team-${slug}-sidebar`} size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
