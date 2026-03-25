import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { SUPPORTED_LEAGUES } from "@/lib/football/constants";
import { TEAMS_BY_LEAGUE } from "@/lib/football/teamRegistry";
import { canonicalLeagueUrl } from "@/lib/football/slugs";
import { LeagueLogo } from "@/components/ui/LeagueLogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata({
    locale: locale as Locale,
    title: locale === "ko" ? "리그 목록 — 전 세계 축구 리그" : "All Leagues — World Football",
    description:
      locale === "ko"
        ? "프리미어리그, 라리가, 분데스리가, 세리에A, K리그 등 전 세계 주요 축구 리그를 확인하세요."
        : "Browse Premier League, La Liga, Bundesliga, Serie A, K League and more football leagues worldwide.",
    path: "/leagues",
  });
}

// ─── 리그 그룹 정의 ─────────────────────────────────────────────────────────

const LEAGUE_GROUPS = [
  {
    titleKo: "🏆 유럽 빅5 리그",
    titleEn: "🏆 Big 5 European Leagues",
    slugs: ["premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1"],
  },
  {
    titleKo: "⭐ UEFA 대회",
    titleEn: "⭐ UEFA Competitions",
    slugs: ["champions-league", "europa-league"],
  },
  {
    titleKo: "🌍 기타 유럽 리그",
    titleEn: "🌍 Other European Leagues",
    slugs: ["eredivisie", "primeira-liga", "scottish-premiership"],
  },
  {
    titleKo: "🌏 아시아 리그",
    titleEn: "🌏 Asian Leagues",
    slugs: ["k-league-1", "j1-league", "saudi-pro-league"],
  },
  {
    titleKo: "🌎 아메리카 리그",
    titleEn: "🌎 Americas Leagues",
    slugs: ["mls", "liga-mx", "brasileirao"],
  },
  {
    titleKo: "🇹🇷 기타",
    titleEn: "🌐 More Leagues",
    slugs: ["super-lig"],
  },
];

const LEAGUE_MAP = Object.fromEntries(SUPPORTED_LEAGUES.map((l) => [l.slug, l]));

export default async function LeaguesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isKo = locale === "ko";

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-black text-gray-900">
            {isKo ? "⚽ 전체 리그" : "⚽ All Leagues"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isKo
              ? "세계 주요 축구 리그를 한눈에 — 순위, 일정, 경기 결과"
              : "World football leagues at a glance — standings, fixtures and results"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 flex flex-col gap-10">
        {LEAGUE_GROUPS.map((group) => {
          const leagues = group.slugs
            .map((s) => LEAGUE_MAP[s])
            .filter(Boolean);
          if (leagues.length === 0) return null;

          return (
            <section key={group.titleEn}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                <h2 className="text-base font-bold text-gray-900">
                  {isKo ? group.titleKo : group.titleEn}
                </h2>
              </div>

              {/* League cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.map((league) => {
                  const urlSlug = canonicalLeagueUrl(league.slug);
                  const teams = TEAMS_BY_LEAGUE[league.slug] ?? [];

                  return (
                    <div
                      key={league.slug}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
                    >
                      {/* Card top accent */}
                      <div
                        className="h-1.5 w-full"
                        style={{ backgroundColor: league.color }}
                      />

                      <div className="p-5">
                        {/* League identity — entire top area is a link */}
                        <a
                          href={`/${locale}/league/${urlSlug}`}
                          className="flex items-center gap-3 mb-4 no-underline"
                        >
                          <LeagueLogo
                            logo={league.logo}
                            name={isKo ? league.nameKo : league.name}
                            flag={league.flag}
                            size={48}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                              {isKo ? league.nameKo : league.name}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {isKo ? league.countryKo : league.country}
                              {league.totalRounds
                                ? ` · ${isKo ? `${league.totalRounds}라운드` : `${league.totalRounds} rounds`}`
                                : ""}
                            </p>
                          </div>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#d1d5db"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 group-hover:stroke-emerald-500 transition-colors"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </a>

                        {/* Team logos row */}
                        {teams.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-4">
                            {teams.slice(0, 10).map((team) => (
                              <span
                                key={team.slug}
                                title={isKo ? team.nameKo : team.nameEn}
                                className="text-base leading-none"
                              >
                                {team.flag}
                              </span>
                            ))}
                            {teams.length > 10 && (
                              <span className="text-xs text-gray-400 font-semibold">
                                +{teams.length - 10}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quick links */}
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          <a
                            href={`/${locale}/league/${urlSlug}/standings`}
                            className="text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            {isKo ? "순위" : "Standings"}
                          </a>
                          <span className="text-gray-200">|</span>
                          <a
                            href={`/${locale}/league/${urlSlug}/fixtures`}
                            className="text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            {isKo ? "일정" : "Fixtures"}
                          </a>
                          <span className="text-gray-200">|</span>
                          <a
                            href={`/${locale}/league/${urlSlug}/results`}
                            className="text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            {isKo ? "결과" : "Results"}
                          </a>
                          <span className="ml-auto text-[10px] text-gray-300">
                            {isKo ? `시즌 ${league.season}` : `${league.season} season`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
