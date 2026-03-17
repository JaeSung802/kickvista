import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug } from "@/lib/football/types";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { queryRecentResults } from "@/lib/football/query";
import { fixturesToMatches } from "@/lib/football/adapters";
import LeagueHeader from "@/components/league/LeagueHeader";
import AdSlot from "@/components/ads/AdSlot";
import type { Metadata } from "next";
import {
  ALL_VALID_LEAGUE_URL_SLUGS,
  LEAGUE_URL_REDIRECTS,
  resolveLeagueUrlSlug,
  canonicalLeagueUrl,
} from "@/lib/football/slugs";

function isValidLeagueUrlSlug(value: string): boolean {
  return ALL_VALID_LEAGUE_URL_SLUGS.includes(value);
}

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  return ALL_VALID_LEAGUE_URL_SLUGS.flatMap((slug) =>
    locales.map((locale) => ({ locale, slug }))
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) return {};
  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const league       = LEAGUE_BY_SLUG[internalSlug];
  const name         = league ? (loc === "ko" ? league.nameKo : league.name) : slug;
  const urlSlug      = canonicalLeagueUrl(internalSlug);

  return buildMetadata({
    locale: loc,
    title:       loc === "ko" ? `${name} 경기 결과` : `${name} Results`,
    description: loc === "ko"
      ? `${name} 최신 경기 결과와 스코어를 KickVista에서 확인하세요.`
      : `Check the latest ${name} match results and scores on KickVista.`,
    path: `/league/${urlSlug}/results`,
  });
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    pageTitle:    "Results",
    pageSubtitle: "Latest finished matches",
    date:         "Date",
    home:         "Home",
    score:        "Score",
    away:         "Away",
    view:         "View",
    ft:           "FT",
    noResults:    "No results yet for this league.",
  },
  ko: {
    pageTitle:    "경기 결과",
    pageSubtitle: "최근 완료된 경기",
    date:         "날짜",
    home:         "홈팀",
    score:        "스코어",
    away:         "원정팀",
    view:         "보기",
    ft:           "종료",
    noResults:    "이 리그의 결과가 아직 없습니다.",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueResultsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) notFound();

  if (LEAGUE_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/league/${LEAGUE_URL_REDIRECTS[slug]}/results`);
  }

  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const isKo         = loc === "ko";
  const t            = labels[loc];
  const league       = LEAGUE_BY_SLUG[internalSlug];

  // Fetch finished results via provider
  const fixtures = await queryRecentResults(internalSlug, 20);
  const matches  = fixturesToMatches(fixtures, loc);

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* League header */}
        <LeagueHeader slug={internalSlug} locale={loc} />

        {/* Top ad */}
        <AdSlot slotId="results-top" size="leaderboard" />

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: "#e6edf3", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {isKo ? league?.nameKo : league?.name} — {t.pageTitle}
            </h1>
            <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>{t.pageSubtitle}</p>
          </div>
        </div>

        {/* Results table */}
        {matches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            <span style={{ fontSize: 36, marginBottom: 12 }}>📋</span>
            <p style={{ color: "#484f58", fontSize: 14 }}>{t.noResults}</p>
          </div>
        ) : (
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr auto 1fr 72px",
                gap: 8,
                padding: "8px 20px",
                background: "#0d1117",
                borderBottom: "1px solid #21262d",
              }}
            >
              <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600 }}>{t.date}</span>
              <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600, textAlign: "right" as const }}>{t.home}</span>
              <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600, textAlign: "center" as const }}>{t.score}</span>
              <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600 }}>{t.away}</span>
              <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600, textAlign: "center" as const }}>{t.view}</span>
            </div>

            {/* Result rows */}
            {matches.map((m, idx) => {
              const homeWin  = (m.homeScore ?? 0) > (m.awayScore ?? 0);
              const awayWin  = (m.awayScore ?? 0) > (m.homeScore ?? 0);
              const isDraw   = m.homeScore !== undefined && m.homeScore === m.awayScore;

              return (
                <div
                  key={m.id}
                  className="hover-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr auto 1fr 72px",
                    gap: 8,
                    padding: "13px 20px",
                    borderBottom: idx < matches.length - 1 ? "1px solid #21262d" : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Date */}
                  <span style={{ color: "#8b949e", fontSize: 12 }}>
                    {m.league}
                  </span>

                  {/* Home team */}
                  <div className="flex items-center gap-2 justify-end min-w-0">
                    <span
                      className="truncate"
                      style={{
                        color: homeWin ? "#e6edf3" : isDraw ? "#8b949e" : "#484f58",
                        fontSize: 14,
                        fontWeight: homeWin ? 700 : 500,
                        textAlign: "right" as const,
                      }}
                    >
                      {m.homeTeam}
                    </span>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{m.homeFlag}</span>
                  </div>

                  {/* Score */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#0d1117",
                      border: "1px solid #21262d",
                      borderRadius: 6,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 10px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: homeWin ? "#22c55e" : "#e6edf3",
                        minWidth: 28,
                        textAlign: "center" as const,
                      }}
                    >
                      {m.homeScore}
                    </span>
                    <span style={{ padding: "4px 2px", fontSize: 12, color: "#484f58" }}>–</span>
                    <span
                      style={{
                        padding: "4px 10px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: awayWin ? "#22c55e" : "#e6edf3",
                        minWidth: 28,
                        textAlign: "center" as const,
                      }}
                    >
                      {m.awayScore}
                    </span>
                  </div>

                  {/* Away team */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{m.awayFlag}</span>
                    <span
                      className="truncate"
                      style={{
                        color: awayWin ? "#e6edf3" : isDraw ? "#8b949e" : "#484f58",
                        fontSize: 14,
                        fontWeight: awayWin ? 700 : 500,
                      }}
                    >
                      {m.awayTeam}
                    </span>
                  </div>

                  {/* Match detail link */}
                  <a
                    href={`/${loc}/match/${m.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: "none",
                      color: "#8b949e",
                      border: "1px solid #30363d",
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    {t.view}
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom ad */}
        <AdSlot slotId="results-bottom" size="leaderboard" />
      </div>
    </main>
  );
}
