import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import Hero from "@/components/layout/Hero";
import LeagueCards from "@/components/league/LeagueCards";
import MatchesSection from "@/components/match/MatchesSection";
import StandingsPreview from "@/components/standings/StandingsPreview";
import AIAnalysisSection from "@/components/analysis/AIAnalysisSection";
import CommunityHighlights from "@/components/community/CommunityHighlights";
import PopularTeamsSection from "@/components/teams/PopularTeamsSection";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import AdSlot from "@/components/ads/AdSlot";
import LoadingState from "@/components/ui/LoadingState";
import { queryTodayFixtures, queryStandings, countLiveByLeague } from "@/lib/football/query";
import { fixturesToMatches, standingsToRows } from "@/lib/football/adapters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata({ locale: locale as Locale });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;

  await getDictionary(loc);

  const jsonLd = websiteJsonLd(loc);

  // Fetch football data in parallel — mock in dev, real API in prod
  const [fixtures, plStandings] = await Promise.all([
    queryTodayFixtures(),
    queryStandings("premier-league"),
  ]);
  const liveCountsByLeague = countLiveByLeague(fixtures);
  const matchViewModels    = fixturesToMatches(fixtures, loc);
  const plRows             = plStandings ? standingsToRows(plStandings, 8) : undefined;

  const mockAttendanceProps = {
    totalDays: 45,
    currentStreak: 3,
    totalPoints: 350,
    rankTier: "silver" as const,
    rankLabel: loc === "ko" ? "실버" : "Silver",
    rankColor: "#c0c0c0",
    rankBadge: "🥈",
    hasCheckedInToday: false,
    progressToNextRank: 50,
    locale: loc,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero locale={loc} />

      {/* Top ad banner */}
      <div className="py-4 px-4 sm:px-6 lg:px-8" style={{ borderBottom: "1px solid #21262d" }}>
        <div className="max-w-7xl mx-auto">
          <AdSlot slotId="homepage-top" size="leaderboard" />
        </div>
      </div>

      <main>
        <LeagueCards locale={loc} liveCounts={liveCountsByLeague} />

        {/* Between leagues and matches ad */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <AdSlot slotId="homepage-mid-1" size="leaderboard" />
        </div>

        <Suspense fallback={<LoadingState />}>
          <MatchesSection locale={loc} matches={matchViewModels.length ? matchViewModels : undefined} />
        </Suspense>

        {/* Two-column section: Standings + Attendance widget */}
        <section id="standings-section" className="py-8" style={{ borderTop: "1px solid #21262d" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StandingsPreview locale={loc} standingsData={plRows ? { 0: plRows } : undefined} />
              </div>
              <div className="flex flex-col gap-4">
                <AttendanceWidget {...mockAttendanceProps} />
                <AdSlot slotId="homepage-sidebar" size="rectangle" />
              </div>
            </div>
          </div>
        </section>

        <AIAnalysisSection locale={loc} />

        <CommunityHighlights locale={loc} />

        <PopularTeamsSection locale={loc} />

        {/* Bottom ad */}
        <div className="py-8" style={{ borderTop: "1px solid #21262d" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AdSlot slotId="homepage-bottom" size="leaderboard" />
          </div>
        </div>
      </main>
    </>
  );
}
