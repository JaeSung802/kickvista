/**
 * Match detail page — basic bundle.
 *
 * Real data only: one strict provider request (/fixtures?id=). A failed request
 * shows an error state with retry, a fixture the API does not have is a 404,
 * and a missing data source shows "unavailable" — none of them fall back to
 * mock matches, mock lineups or mock statistics.
 *
 * Tabs are URL-based (?tab=, lib/match/tabs.ts): overview, events, lineups and
 * team statistics, all from the same response (no request per tab). Standings,
 * head-to-head, AI analysis and recap are rebuilt in later bundles.
 * The prediction card keeps the server-side pause flags.
 */

import { cache } from "react";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { sportsEventJsonLd } from "@/lib/seo/jsonld";
import { queryMatchDetailResult, homeFootballSource } from "@/lib/football/query";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { matchStatusInfo, formatKickoffKST } from "@/lib/match/status";
import { resolveMatchTab, enabledMatchTabs } from "@/lib/match/tabs";
import AdSlot from "@/components/ads/AdSlot";
import PredictionCard from "@/components/match/PredictionCard";
import MatchScoreHeader from "@/components/match/MatchScoreHeader";
import MatchFactsPanel from "@/components/match/MatchFactsPanel";
import MatchDetailTabs from "@/components/match/MatchDetailTabs";
import MatchEventsPanel from "@/components/match/MatchEventsPanel";
import MatchLineupsPanel from "@/components/match/MatchLineupsPanel";
import MatchStatsPanel from "@/components/match/MatchStatsPanel";
import type { MatchPhase } from "@/components/match/MatchDataNotice";
import HomeRetryButton from "@/components/home/HomeRetryButton";
import { PREDICTION_PLACEMENT_PAUSED, PREDICTION_SETTLEMENT_PAUSED } from "@/lib/predictions-pause";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { getUserPrediction, getPredictionStats } from "@/lib/predictions";

export const revalidate = 300;

/** Positive integer ids only; anything else is a 404 without an API request. */
function parseFixtureId(id: string): number | null {
  return /^[1-9]\d{0,9}$/.test(id) ? Number(id) : null;
}

// One lookup per request, shared by generateMetadata and the page.
const loadMatch = cache((fixtureId: number) => queryMatchDetailResult(fixtureId));

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  const fixtureId = parseFixtureId(id);
  const result = fixtureId ? await loadMatch(fixtureId) : null;
  if (!result || result.status !== "ok") {
    return buildMetadata({ locale: loc, path: `/match/${id}`, noIndex: true });
  }
  const m = result.match;
  const isKo = loc === "ko";
  const home = isKo ? (m.homeTeam.nameKo ?? m.homeTeam.name) : m.homeTeam.name;
  const away = isKo ? (m.awayTeam.nameKo ?? m.awayTeam.name) : m.awayTeam.name;
  const st = matchStatusInfo(m.statusRaw, m.status, m.minute, m.date, loc);
  const score = st.showScore && m.homeScore !== undefined && m.awayScore !== undefined ? ` ${m.homeScore}–${m.awayScore} ` : " vs ";
  return buildMetadata({
    locale: loc,
    title: `${home}${score}${away}`,
    description: isKo ? `${home} vs ${away} 경기 정보와 킥오프 시간(KST).` : `${home} vs ${away} match info and kick-off time (KST).`,
    path: `/match/${id}`,
  });
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const fixtureId = parseFixtureId(id);
  if (!fixtureId) notFound();
  const activeTab = resolveMatchTab((await searchParams).tab);

  const result = await loadMatch(fixtureId);
  if (result.status === "not_found") notFound();

  if (result.status !== "ok") {
    const isError = result.status === "error";
    return (
      <main className="min-h-screen bg-gray-50" data-football-source={homeFootballSource()}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <a href={`/${loc}`} className="mb-6 inline-block text-[13px] text-gray-500 hover:text-gray-700">
            ← {isKo ? "경기 목록으로" : "Back to matches"}
          </a>
          <div
            role="alert"
            data-match-state={isError ? "error" : "unavailable"}
            className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm"
          >
            <span className="text-4xl" aria-hidden="true">⚠️</span>
            <h1 className="text-base font-bold text-gray-900">
              {isError
                ? (isKo ? "경기 정보를 불러오지 못했습니다" : "Couldn't load this match")
                : (isKo ? "지금은 경기 정보를 제공할 수 없습니다" : "Match data is not available right now")}
            </h1>
            {isError && (
              <>
                <p className="text-sm text-gray-500">{isKo ? "잠시 후 다시 시도해 주세요." : "Please try again in a moment."}</p>
                <HomeRetryButton locale={loc} retryAfterSec={result.retryAfterSec} />
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  const match = result.match;
  const homeName = isKo ? (match.homeTeam.nameKo ?? match.homeTeam.name) : match.homeTeam.name;
  const awayName = isKo ? (match.awayTeam.nameKo ?? match.awayTeam.name) : match.awayTeam.name;
  const league = LEAGUE_BY_SLUG[match.leagueSlug];
  const leagueName = league ? (isKo ? league.nameKo : league.name) : (isKo ? "대회 정보 없음" : "Competition unavailable");
  const status = matchStatusInfo(match.statusRaw, match.status, match.minute, match.date, loc);
  const kickoffKST = formatKickoffKST(match.date, loc);
  // Predictions are open only for a scheduled match; any other non-live,
  // non-finished status (TBD, suspended, unknown …) is treated as closed.
  const predictionClosed = status.isInactive || (!status.isLive && !status.isFinished && status.kind !== "scheduled");

  // Prediction card data (pause flags are enforced on the server as before)
  const supabaseUser = await getServerUser();
  const [userProfileR, predictionStatsR, userPredictionR] = await Promise.allSettled([
    supabaseUser ? getServerProfile(supabaseUser.id) : Promise.resolve(null),
    getPredictionStats(fixtureId),
    supabaseUser ? getUserPrediction(supabaseUser.id, fixtureId) : Promise.resolve(null),
  ]);
  const userProfile     = userProfileR.status     === "fulfilled" ? userProfileR.value     : null;
  const predictionStats = predictionStatsR.status === "fulfilled" ? predictionStatsR.value : { HOME_WIN: 0, DRAW: 0, AWAY_WIN: 0, total: 0 };
  const userPrediction  = userPredictionR.status  === "fulfilled" ? userPredictionR.value  : null;

  // Tab panels, all from the same fixture response (match.core) — switching tabs makes no request.
  const core = match.core ?? { events: null, lineups: null, statistics: null };
  const phase: MatchPhase = status.isInactive ? "inactive"
    : status.kind === "scheduled" || status.kind === "tbd" ? "upcoming"
    : status.isLive ? "live" : "played";
  const panelFor = (tabId: string) => {
    switch (tabId) {
      case "events":
        return <MatchEventsPanel locale={loc} events={core.events} phase={phase} homeName={homeName} awayName={awayName} />;
      case "lineups":
        return <MatchLineupsPanel locale={loc} lineups={core.lineups} phase={phase} homeName={homeName} awayName={awayName} />;
      case "statistics":
        return <MatchStatsPanel locale={loc} statistics={core.statistics} phase={phase} homeName={homeName} awayName={awayName} />;
      default:
        return <MatchFactsPanel locale={loc} leagueName={leagueName} round={match.round} kickoffKST={kickoffKST} venue={match.venue} status={status} />;
    }
  };

  // The JSON-LD description says "Final score", so pass the score only for a finished match.
  const jsonLd = sportsEventJsonLd(status.isFinished ? match : { ...match, homeScore: undefined, awayScore: undefined }, loc);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-gray-50" data-match-id={fixtureId} data-football-source={homeFootballSource()}>
        <MatchScoreHeader
          locale={loc}
          homeTeamName={homeName}
          awayTeamName={awayName}
          homeLogo={match.homeTeam.logo}
          awayLogo={match.awayTeam.logo}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homeScoreHT={match.homeScoreHT}
          awayScoreHT={match.awayScoreHT}
          leagueName={leagueName}
          round={match.round}
          venue={match.venue}
          status={status}
        />

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <AdSlot slotId={`match-${id}-top`} size="leaderboard" />
        </div>

        <MatchDetailTabs
          locale={loc}
          matchId={String(fixtureId)}
          initialTab={activeTab}
          panels={enabledMatchTabs().map((tab) => ({ id: tab.id, label: isKo ? tab.ko : tab.en, content: panelFor(tab.id) }))}
          sidebar={
            <>
              <PredictionCard
                matchId={fixtureId}
                homeTeamName={homeName}
                awayTeamName={awayName}
                isLive={status.isLive}
                isFinished={status.isFinished}
                isInactive={predictionClosed}
                userPoints={userProfile ? userProfile.total_points : null}
                initialPrediction={userPrediction}
                initialStats={predictionStats}
                locale={loc}
                loginUrl={`/${loc}/auth/login`}
                placementPaused={PREDICTION_PLACEMENT_PAUSED}
                settlementPaused={PREDICTION_SETTLEMENT_PAUSED}
              />
              <AdSlot slotId={`match-${id}-sidebar`} size="rectangle" />
            </>
          }
        />
      </main>
    </>
  );
}
