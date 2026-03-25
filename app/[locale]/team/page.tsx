import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { TEAMS_BY_LEAGUE } from "@/lib/football/teamRegistry";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { canonicalTeamUrl } from "@/lib/football/slugs";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { LeagueSlug } from "@/lib/football/types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({
    locale: loc,
    title:
      loc === "ko"
        ? "팀 게시판 — 클럽별 팬 커뮤니티"
        : "Team Boards — Fan Community by Club",
    description:
      loc === "ko"
        ? "좋아하는 팀을 선택하고 팬 토론, 경기 일정, 순위를 확인하세요."
        : "Pick your club and explore fan discussions, fixtures and standings.",
    path: "/team",
  });
}

// ─── Static config ─────────────────────────────────────────────────────────────
// Only the 4 main leagues are displayed on the Team Hub.

const DISPLAY_LEAGUES: LeagueSlug[] = [
  "premier-league",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "eredivisie",
  "primeira-liga",
  "saudi-pro-league",
  "mls",
];

// API-Football CDN — already in next.config.ts remotePatterns
function logoUrl(id: number) {
  return `https://media.api-sports.io/football/teams/${id}.png`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const loc  = locale as Locale;
  const isKo = loc === "ko";

  // Derive sections from the pre-grouped static constant.
  // TEAMS_BY_LEAGUE is built at module-init time — no runtime filtering, no
  // reference equality checks, no possible empty-array surprises.
  const sections = DISPLAY_LEAGUES.map((leagueSlug) => ({
    leagueSlug,
    league: LEAGUE_BY_SLUG[leagueSlug],
    teams:  TEAMS_BY_LEAGUE[leagueSlug] ?? [],
  })).filter((s) => s.league && s.teams.length > 0);

  return (
    <main className="bg-gray-50 min-h-screen">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            {isKo ? "팀 게시판" : "Team Boards"}
          </h1>
          <p className="text-sm text-gray-500">
            {isKo
              ? "좋아하는 팀을 선택하고 팬 토론, 경기 일정, 순위를 확인하세요."
              : "Pick your club to explore fan discussions, fixtures and standings."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">⚽</span>
            <h2 className="text-lg font-bold text-gray-700 mb-2">
              {isKo ? "팀 데이터를 불러올 수 없습니다" : "No team data available"}
            </h2>
            <p className="text-sm text-gray-400">
              {isKo ? "잠시 후 다시 시도해 주세요." : "Please try again later."}
            </p>
            <a
              href={`/${loc}`}
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
            >
              ← {isKo ? "홈으로" : "Back to Home"}
            </a>
          </div>
        )}

        {/* ── League sections ────────────────────────────────────────────── */}
        {sections.map(({ leagueSlug, league, teams }) => (
          <section key={leagueSlug} aria-label={league.name}>

            {/* League heading */}
            <div className="flex items-center gap-3 mb-5">
              <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" aria-hidden />
              <h2 className="text-base font-bold text-gray-900">
                {league.flag} {isKo ? league.nameKo : league.name}
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {teams.length} {isKo ? "개 팀" : "clubs"}
              </span>
            </div>

            {/* Team grid — 2 cols → 4 cols */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {teams.map((team) => {
                const urlSlug     = canonicalTeamUrl(team.slug);
                const displayName = isKo ? team.nameKo : team.nameEn;

                return (
                  <a
                    key={team.id}
                    href={`/${loc}/team/${urlSlug}`}
                    className="group flex flex-col items-center gap-3 px-4 py-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all no-underline"
                  >
                    {/* Logo — explicit 48 × 48 prevents layout collapse */}
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <TeamLogo
                        logo={logoUrl(team.id)}
                        name={displayName}
                        size={48}
                      />
                    </div>

                    {/* Name */}
                    <span className="text-xs font-semibold text-gray-900 text-center leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {displayName}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
