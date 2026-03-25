import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug } from "@/lib/football/types";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { queryRecentResults } from "@/lib/football/query";
import { fixturesToMatches } from "@/lib/football/adapters";
import LeagueHeader from "@/components/league/LeagueHeader";
import AdSlot from "@/components/ads/AdSlot";
import { TeamLogo } from "@/components/ui/TeamLogo";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string, locale: Locale): string {
  const d = new Date(dateStr + "T12:00:00Z");
  if (locale === "ko") {
    return d.toLocaleDateString("ko-KR", {
      month: "long", day: "numeric", weekday: "short",
    });
  }
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long",
  });
}

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
  const league       = LEAGUE_BY_SLUG[internalSlug];

  const fixtures = await queryRecentResults(internalSlug, 20);
  const matches  = fixturesToMatches(fixtures, loc);

  // Group by date (most recent first)
  const grouped = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key = m.date ?? "unknown";
    (acc[key] ??= []).push(m);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const noResults = isKo ? "이 리그의 결과가 아직 없습니다." : "No results yet for this league.";
  const viewLabel  = isKo ? "보기" : "View";

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        <LeagueHeader slug={internalSlug} locale={loc} activeTab={2} />

        <AdSlot slotId="results-top" size="leaderboard" />

        {/* Page title */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            {isKo ? league?.nameKo : league?.name} — {isKo ? "경기 결과" : "Results"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isKo ? "최근 완료된 경기" : "Latest finished matches"}
          </p>
        </div>

        {/* Results grouped by date */}
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm text-gray-400">{noResults}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {dateKey !== "unknown" ? formatDateLabel(dateKey, loc) : (isKo ? "날짜 미정" : "Date unknown")}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Match cards for this date */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {grouped[dateKey].map((m, idx) => {
                    const homeWin = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                    const awayWin = (m.awayScore ?? 0) > (m.homeScore ?? 0);

                    return (
                      <a
                        key={m.id}
                        href={`/${loc}/match/${m.id}`}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          idx < grouped[dateKey].length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        {/* Home team */}
                        <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
                          <span
                            className="truncate text-sm"
                            style={{
                              fontWeight: homeWin ? 700 : 500,
                              color: homeWin ? "#111827" : "#6b7280",
                              textAlign: "right",
                            }}
                          >
                            {m.homeTeam}
                          </span>
                          <TeamLogo
                            logo={m.homeLogo}
                            name={m.homeTeam}
                            size={24}
                          />
                        </div>

                        {/* Score */}
                        <div className="flex items-center shrink-0">
                          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            <span
                              className="tabular-nums text-sm font-black px-3 py-1.5 min-w-[2rem] text-center"
                              style={{ color: homeWin ? "#059669" : "#111827" }}
                            >
                              {m.homeScore ?? "–"}
                            </span>
                            <span className="text-gray-300 text-xs">:</span>
                            <span
                              className="tabular-nums text-sm font-black px-3 py-1.5 min-w-[2rem] text-center"
                              style={{ color: awayWin ? "#059669" : "#111827" }}
                            >
                              {m.awayScore ?? "–"}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold ml-1.5 shrink-0">
                            {isKo ? "종료" : "FT"}
                          </span>
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TeamLogo
                            logo={m.awayLogo}
                            name={m.awayTeam}
                            size={24}
                          />
                          <span
                            className="truncate text-sm"
                            style={{
                              fontWeight: awayWin ? 700 : 500,
                              color: awayWin ? "#111827" : "#6b7280",
                            }}
                          >
                            {m.awayTeam}
                          </span>
                        </div>

                        {/* View chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="#d1d5db" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          className="shrink-0 hidden sm:block"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <AdSlot slotId="results-bottom" size="leaderboard" />
      </div>
    </main>
  );
}
