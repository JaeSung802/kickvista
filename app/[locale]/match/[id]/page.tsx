import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import MatchScoreHeader from "@/components/match/MatchScoreHeader";
import MatchFactsPanel from "@/components/match/MatchFactsPanel";
import MatchTicker from "@/components/match/MatchTicker";
import MatchLineup from "@/components/match/MatchLineup";
import MatchStatistics from "@/components/match/MatchStatistics";
import { buildMetadata } from "@/lib/seo/metadata";
import { sportsEventJsonLd } from "@/lib/seo/jsonld";
import { queryMatchDetail, queryFixturePlayers, queryStandings, queryHeadToHead } from "@/lib/football/query";
import { standingsToRows } from "@/lib/football/adapters";
import { getAnalysesByFixture } from "@/lib/analysis/db";
import MatchStandingsTable from "@/components/match/MatchStandingsTable";
import MatchHeadToHead from "@/components/match/MatchHeadToHead";
import MatchAIAnalysis from "@/components/match/MatchAIAnalysis";
import MatchRecap from "@/components/match/MatchRecap";
import AdSlot from "@/components/ads/AdSlot";
import MatchTabNav from "@/components/match/MatchTabNav";
import MatchSidebar from "@/components/match/MatchSidebar";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { getUserPrediction, getPredictionStats } from "@/lib/predictions";
import type { MatchDetail, LineupPlayer } from "@/lib/football/types";
import { MOCK_MATCHES } from "@/lib/football/mock-matches";
import { flattenApiStats, formatMatchTime, normaliseEvent } from "@/lib/match/helpers";

export const revalidate = 300; // 5분 ISR

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    tabs: {
      facts:      "Facts",
      ticker:     "Ticker",
      lineup:     "Lineup",
      standings:  "Standings",
      statistics: "Statistics",
      h2h:        "H2H",
    },
    halfTime: "Half-Time",
    fullTime: "Full Time",
    live: "LIVE",
    backToMatches: "← Back to matches",
    assist: "Assist",
  },
  ko: {
    tabs: {
      facts:      "팩트",
      ticker:     "티커",
      lineup:     "라인업",
      standings:  "순위",
      statistics: "통계",
      h2h:        "역대 전적",
    },
    halfTime: "전반전",
    fullTime: "경기 종료",
    live: "라이브",
    backToMatches: "← 경기 목록으로",
    assist: "어시스트",
  },
};

// ─── AI Recap generator ───────────────────────────────────────────────────────

interface RecapData {
  mom: { name: string; reason: string; reasonKo: string };
  highlights: Array<{ icon: string; text: string; textKo: string }>;
  narrative: Array<{ en: string; ko: string }>;
  keyStats: Array<{
    label: string; labelKo: string;
    home: string | number; away: string | number;
    winner: "home" | "away" | "draw";
  }>;
}

function generateRecap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any
): RecapData | null {
  const isFinished = ["FT", "AET", "PEN"].includes(match.status as string);
  if (!isFinished) return null;

  const homeId: number  = match.homeTeam?.id ?? 0;
  const home  = String(match.homeTeam?.name  ?? "Home");
  const homeKo = String(match.homeTeam?.nameKo ?? home);
  const away  = String(match.awayTeam?.name  ?? "Away");
  const awayKo = String(match.awayTeam?.nameKo ?? away);
  const hs = match.homeScore ?? 0;
  const as_ = match.awayScore ?? 0;

  const winner = hs > as_ ? "home" : hs < as_ ? "away" : "draw";
  const winnerName = winner === "home" ? home : winner === "away" ? away : null;
  const winnerKo   = winner === "home" ? homeKo : winner === "away" ? awayKo : null;
  const resultEn = winner === "draw" ? "draw" : `${winnerName} win`;
  const resultKo = winner === "draw" ? "무승부" : `${winnerKo} 승리`;

  const rawEvents: unknown[] = Array.isArray(match.events) ? match.events : [];
  const events = rawEvents
    .map((e) => normaliseEvent(e, homeId))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const rawStats: unknown[] = Array.isArray(match.statistics) ? match.statistics : [];
  const isApiFormat = (rawStats[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  const flatStats: Array<{ label: string; labelKo: string; home: string | number; away: string | number }> =
    isApiFormat
      ? flattenApiStats(rawStats, homeId)
      : rawStats as Array<{ label: string; labelKo: string; home: string | number; away: string | number }>;

  const firstGoal = events.find((e) => e.type === "goal");
  const redCard   = events.find((e) => e.type === "red-card");
  const mom = firstGoal
    ? {
        name: firstGoal.player,
        reason:   `Scored the opening goal in the ${firstGoal.minute}' and set the tone for a ${hs}–${as_} ${resultEn}.`,
        reasonKo: `${firstGoal.minute}분 선제골을 기록하며 ${hs}–${as_} ${resultKo}의 흐름을 만들었습니다.`,
      }
    : {
        name: winner !== "draw" ? (winnerName ?? home) : home,
        reason:   `Outstanding collective performance in a ${hs}–${as_} ${resultEn}.`,
        reasonKo: `${hs}–${as_} ${resultKo}을 이끈 뛰어난 팀 퍼포먼스.`,
      };

  const goals = events.filter((e) => e.type === "goal");
  const highlights: RecapData["highlights"] = [];

  if (goals.length > 0) {
    const gs   = goals.map((g) => `${g.player} (${g.minute}')`).join(", ");
    const gsKo = goals.map((g) => `${g.player} (${g.minute}분)`).join(", ");
    highlights.push({
      icon: "⚽",
      text:   `${hs + as_} goal${hs + as_ > 1 ? "s" : ""} — ${gs}`,
      textKo: `총 ${hs + as_}골 — ${gsKo}`,
    });
  } else {
    highlights.push({
      icon: "⚽",
      text:   `Final score: ${home} ${hs}–${as_} ${away}`,
      textKo: `최종 스코어: ${homeKo} ${hs}–${as_} ${awayKo}`,
    });
  }

  if (redCard) {
    const rdTeam   = redCard.team === "home" ? home   : away;
    const rdTeamKo = redCard.team === "home" ? homeKo : awayKo;
    highlights.push({
      icon: "🟥",
      text:   `${redCard.player} (${rdTeam}) sent off in the ${redCard.minute}' — a turning point`,
      textKo: `${redCard.minute}분 ${rdTeamKo}의 ${redCard.player} 퇴장 — 경기 분수령`,
    });
  }

  const possStat = flatStats.find((s) => s.label === "Possession");
  if (possStat) {
    const homeVal = parseFloat(String(possStat.home));
    const awayVal = parseFloat(String(possStat.away));
    const domTeam = homeVal >= awayVal ? home   : away;
    const domKo   = homeVal >= awayVal ? homeKo : awayKo;
    const domVal  = homeVal >= awayVal ? possStat.home : possStat.away;
    highlights.push({
      icon: "📊",
      text:   `${domTeam} dominated possession (${domVal})`,
      textKo: `${domKo}가 점유율(${domVal}) 주도`,
    });
  } else if (highlights.length < 3) {
    const yellowCount = events.filter((e) => e.type === "yellow-card").length;
    highlights.push({
      icon: yellowCount > 0 ? "🟨" : "📋",
      text:   yellowCount > 0
        ? `${yellowCount} yellow card${yellowCount > 1 ? "s" : ""} — a fiercely contested match`
        : `A well-organised ${resultEn} — ${winner !== "draw" ? winnerName : home} controlled the tempo`,
      textKo: yellowCount > 0
        ? `경고 ${yellowCount}개 — 치열한 접전`
        : `잘 정돈된 ${resultKo} — ${winner !== "draw" ? winnerKo : homeKo}가 경기 흐름 주도`,
    });
  }

  const period1Goals = goals.filter((g) => g.minute <= 45);
  const period2Goals = goals.filter((g) => g.minute > 45);

  const para1: { en: string; ko: string } = {
    en: winner === "draw"
      ? `${home} and ${away} shared the spoils in a hard-fought ${hs}–${as_} draw. Neither side was able to find the winning goal despite both creating decent chances throughout the ninety minutes.`
      : `${winnerName} claimed a ${hs}–${as_} victory over ${winner === "home" ? away : home} in what proved to be a gripping encounter. The winning side showed composure and clinical finishing when it mattered most.`,
    ko: winner === "draw"
      ? `${homeKo}와 ${awayKo}는 치열한 접전 끝에 ${hs}–${as_} 무승부를 기록했습니다.`
      : `${winnerKo}가 ${winner === "home" ? awayKo : homeKo}를 상대로 ${hs}–${as_} 승리를 거뒀습니다. 승리팀은 결정적인 순간에 냉정함과 골 결정력을 발휘했습니다.`,
  };

  const para2: { en: string; ko: string } = period1Goals.length > 0
    ? {
        en: `The opening goal came from ${period1Goals[0].player} in the ${period1Goals[0].minute}th minute${period1Goals[0].assist ? `, assisted by ${period1Goals[0].assist}` : ""}. ${period2Goals.length > 0 ? `The second half continued with further drama, with ${period2Goals[0].player} adding to the scoresheet in the ${period2Goals[0].minute}th minute.` : "The lead was defended comfortably through the second half."}`,
        ko: `선제골은 ${period1Goals[0].minute}분 ${period1Goals[0].player}${period1Goals[0].assist ? `(도움: ${period1Goals[0].assist})` : ""}의 발에서 나왔습니다. ${period2Goals.length > 0 ? `후반전에도 드라마는 계속됐고, ${period2Goals[0].minute}분 ${period2Goals[0].player}가 추가 득점에 성공했습니다.` : "이후 리드를 안정적으로 유지하며 경기를 마쳤습니다."}`,
      }
    : {
        en: `Both sides created opportunities but clinical finishing was the key differentiator. The game was defined by disciplined defensive structures and a battle for midfield control.`,
        ko: `양 팀 모두 기회를 만들었지만, 결정력 차이가 승부를 갈랐습니다. 탄탄한 수비 조직력과 미드필드 주도권 싸움으로 결정된 경기였습니다.`,
      };

  const shotsStat = flatStats.find((s) => s.label === "Shots on Target");
  const para3: { en: string; ko: string } = {
    en: `${redCard ? `The red card for ${redCard.player} in the ${redCard.minute}' was pivotal, leaving ${redCard.team === "home" ? home : away} to defend with ten men for the remainder. ` : ""}${shotsStat ? `${home} registered ${shotsStat.home} shots on target versus ${shotsStat.away} for ${away}, reflecting how ${hs > as_ ? home : hs < as_ ? away : "both sides"} controlled the game's key moments.` : `Overall a memorable match that showcased the quality of both sides.`}`,
    ko: `${redCard ? `${redCard.minute}분 ${redCard.player}의 퇴장으로 ${redCard.team === "home" ? homeKo : awayKo}는 이후 10명으로 수비에 나서야 했습니다. ` : ""}${shotsStat ? `${homeKo}의 유효슈팅 ${shotsStat.home}개, ${awayKo}의 유효슈팅 ${shotsStat.away}개가 이번 경기의 흐름을 잘 보여줍니다.` : `양 팀의 수준을 잘 드러낸 기억에 남을 명승부였습니다.`}`,
  };

  const statLabels = ["Possession", "Shots", "Shots on Target", "Corners", "Pass Accuracy"];
  const labelKoMap: Record<string, string> = {
    Possession: "점유율", Shots: "슈팅", "Shots on Target": "유효슈팅",
    Corners: "코너킥", "Pass Accuracy": "패스 성공률",
  };
  const keyStats: RecapData["keyStats"] = flatStats
    .filter((s) => statLabels.includes(s.label))
    .map((s) => {
      const hv = typeof s.home === "string" ? parseFloat(s.home) : s.home;
      const av = typeof s.away === "string" ? parseFloat(s.away) : s.away;
      return {
        label:   s.label,
        labelKo: (s as Record<string, unknown>).labelKo as string ?? labelKoMap[s.label] ?? s.label,
        home:    s.home,
        away:    s.away,
        winner:  hv > av ? "home" : hv < av ? "away" : "draw",
      };
    });

  return {
    mom,
    highlights: highlights.slice(0, 3),
    narrative: [para1, para2, para3],
    keyStats,
  };
}

// ─── Valid tab IDs ─────────────────────────────────────────────────────────────

const VALID_TABS = new Set(["facts", "ticker", "lineup", "standings", "statistics", "h2h"]);

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return {};
  const providerMatch = await queryMatchDetail(Number(id));
  const match = providerMatch ?? (MOCK_MATCHES[id] ?? null);
  if (!match) return buildMetadata({ locale: locale as Locale });

  const loc = locale as Locale;
  const isKo = loc === "ko";
  const home = isKo ? (match.homeTeam.nameKo ?? match.homeTeam.name) : match.homeTeam.name;
  const away = isKo ? (match.awayTeam.nameKo ?? match.awayTeam.name) : match.awayTeam.name;
  const score =
    match.homeScore !== undefined ? ` ${match.homeScore}–${match.awayScore}` : " vs ";

  return buildMetadata({
    locale: loc,
    title: isKo
      ? `${home}${score}${away} 경기 분석`
      : `${home}${score}${away} Match Analysis`,
    description: isKo
      ? `${home} vs ${away} 라이브 스코어, 통계, 라인업, AI 분석.`
      : `${home} vs ${away} live score, stats, lineups and AI match analysis.`,
    path: `/match/${id}`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();

  const loc = locale as Locale;

  // Derive and validate activeTab (invalid values fall back to "facts")
  const rawTab = (await searchParams).tab;
  const activeTab = VALID_TABS.has(rawTab ?? "") ? rawTab! : "facts";

  const providerMatch = await queryMatchDetail(Number(id));
  type MatchData = MatchDetail | (typeof MOCK_MATCHES)[string];
  const match: MatchData | null =
    providerMatch ??
    (MOCK_MATCHES[id] ?? null);

  if (!match) {
    const isKoFallback = loc === "ko";
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <span className="text-5xl mb-4 block">⚽</span>
          <h1 className="text-lg font-black text-gray-900 mb-2">
            {isKoFallback ? "경기 정보를 불러올 수 없습니다" : "Match data unavailable"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isKoFallback
              ? "일시적인 오류로 경기 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요."
              : "We couldn't load this match right now. Please try again in a moment."}
          </p>
          <a
            href={`/${loc}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            ← {isKoFallback ? "홈으로 돌아가기" : "Back to home"}
          </a>
        </div>
      </main>
    );
  }

  const t = labels[loc];
  const isKo = loc === "ko";

  const homeName = isKo ? (match.homeTeam.nameKo ?? match.homeTeam.name) : match.homeTeam.name;
  const awayName = isKo ? (match.awayTeam.nameKo ?? match.awayTeam.name) : match.awayTeam.name;
  const isLive      = ["1H", "HT", "2H", "ET", "P"].includes(match.status);
  const isFinished  = ["FT", "AET", "PEN"].includes(match.status);
  const isPostponed = match.status === "PST";
  const isCancelled = ["CANC", "ABD"].includes(match.status);
  const isInactive  = isPostponed || isCancelled;

  const jsonLd = sportsEventJsonLd(match, loc);

  const statusLabel = isLive
    ? `${t.live} ${match.minute ?? ""}'`
    : isFinished
    ? t.fullTime
    : isPostponed
    ? (loc === "ko" ? "연기됨" : "Postponed")
    : isCancelled
    ? (loc === "ko" ? "취소됨" : "Cancelled")
    : formatMatchTime(match.date, loc);

  const rawEvents     = Array.isArray(match.events)     ? match.events     : [];
  const rawStatistics = Array.isArray(match.statistics) ? match.statistics : [];

  const safeLineupHome: LineupPlayer[] = Array.isArray(match.lineupHome) ? match.lineupHome : [];
  const safeLineupAway: LineupPlayer[] = Array.isArray(match.lineupAway) ? match.lineupAway : [];

  const safeEvents = rawEvents
    .map((e) => normaliseEvent(e, match.homeTeam.id))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const isApiStatsFormat = (rawStatistics[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  const safeStatistics: Array<{ label: string; labelKo: string; home: string | number; away: string | number }> =
    isApiStatsFormat
      ? flattenApiStats(rawStatistics, match.homeTeam.id)
      : rawStatistics as Array<{ label: string; labelKo: string; home: string | number; away: string | number }>;

  const homeLogo = match.homeTeam.logo ?? `https://media.api-sports.io/football/teams/${match.homeTeam.id}.png`;
  const awayLogo = match.awayTeam.logo ?? `https://media.api-sports.io/football/teams/${match.awayTeam.id}.png`;

  // ── Lazy queries: only fetch when the Facts tab is active ──────────────────

  // Player stats for MOM — only Facts tab, finished matches
  const fixturePlayers = (activeTab === "facts" && isFinished && !isInactive)
    ? await queryFixturePlayers(Number(id))
    : [];

  const momPlayer = fixturePlayers.length > 0
    ? fixturePlayers
        .filter((p) => p.minutesPlayed >= 45 && (p.rating ?? 0) > 0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.goals - a.goals || b.assists - a.assists)[0] ?? null
    : null;

  // Standings — only fetched when Standings tab is active
  const standings = activeTab === "standings"
    ? await queryStandings(match.leagueSlug)
    : null;
  const standingRows = standings ? standingsToRows(standings, loc) : [];

  // H2H — only fetched when H2H tab is active
  const h2hData = activeTab === "h2h"
    ? await queryHeadToHead(match.homeTeam.id, match.awayTeam.id, Number(id))
    : null;

  // Supabase user + prediction data (PredictionCard is always in sidebar)
  const supabaseUser = await getServerUser();

  const [userProfileR, predictionStatsR, userPredictionR, dbAnalysesR] = await Promise.allSettled([
    supabaseUser ? getServerProfile(supabaseUser.id) : Promise.resolve(null),
    getPredictionStats(Number(id)),
    supabaseUser ? getUserPrediction(supabaseUser.id, Number(id)) : Promise.resolve(null),
    // AI Analysis DB fetch — only needed on Facts tab
    activeTab === "facts"
      ? getAnalysesByFixture(Number(id), loc).catch(() => ({ preview: null, recap: null }))
      : Promise.resolve({ preview: null, recap: null }),
  ]);

  const userProfile     = userProfileR.status     === "fulfilled" ? userProfileR.value     : null;
  const predictionStats = predictionStatsR.status === "fulfilled" ? predictionStatsR.value : { HOME_WIN: 0, DRAW: 0, AWAY_WIN: 0, total: 0 };
  const userPrediction  = userPredictionR.status  === "fulfilled" ? userPredictionR.value  : null;
  const dbAnalyses      = dbAnalysesR.status      === "fulfilled" ? dbAnalysesR.value      : { preview: null, recap: null };
  const userPoints = userProfile ? userProfile.total_points : null;
  const dbPreview = dbAnalyses.preview;
  const dbRecap   = dbAnalyses.recap;

  // Local AI recap (pure computation — no API call)
  const recap = isFinished ? generateRecap(match) : null;

  // ── Nav tabs ───────────────────────────────────────────────────────────────

  const navTabs = [
    { id: "facts",      label: t.tabs.facts      },
    { id: "ticker",     label: t.tabs.ticker     },
    { id: "lineup",     label: t.tabs.lineup     },
    { id: "standings",  label: t.tabs.standings  },
    { id: "statistics", label: t.tabs.statistics },
    { id: "h2h",        label: t.tabs.h2h        },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="bg-gray-50 min-h-screen">
        {/* Match header */}
        <MatchScoreHeader
          locale={loc}
          homeTeamName={homeName}
          awayTeamName={awayName}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homeScoreHT={match.homeScoreHT}
          awayScoreHT={match.awayScoreHT}
          leagueSlug={match.leagueSlug}
          round={match.round}
          venue={match.venue}
          statusLabel={statusLabel}
          isLive={isLive}
          isFinished={isFinished}
          backToMatchesLabel={t.backToMatches}
          halfTimeLabel={t.halfTime}
        />

        {/* Top ad */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdSlot slotId={`match-${id}-top`} size="leaderboard" />
        </div>

        {/* Tab navigation */}
        <MatchTabNav tabs={navTabs} activeTab={activeTab} matchId={id} locale={loc} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Main content: one tab at a time ─────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* ═══════════════════════════════════════════════════════════
                  FACTS TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "facts" && (
                <>
                  <MatchFactsPanel
                    locale={loc}
                    leagueSlug={match.leagueSlug}
                    round={match.round}
                    formattedDate={formatMatchTime(match.date, loc)}
                    venue={match.venue}
                    isInactive={isInactive}
                    isCancelled={isCancelled}
                  />

                  {/* AI Analysis — hidden for PST/CANC */}
                  {!isInactive && (
                    <MatchAIAnalysis
                      isFinished={isFinished}
                      isLive={isLive}
                      dbPreview={dbPreview}
                      hasRecap={Boolean(dbRecap || recap)}
                      locale={loc}
                    />
                  )}

                  {/* MOM + Highlights + Narrative — finished matches only */}
                  {isFinished && !isInactive && (recap || dbRecap) && (
                    <MatchRecap
                      locale={loc}
                      dbRecap={dbRecap}
                      recap={recap}
                      momPlayer={momPlayer}
                    />
                  )}
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  TICKER TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "ticker" && (
                <MatchTicker
                  events={safeEvents}
                  isFinished={isFinished}
                  locale={loc}
                  tickerTitle={t.tabs.ticker}
                  assistLabel={t.assist}
                />
              )}

              {/* ═══════════════════════════════════════════════════════════
                  LINEUP TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "lineup" && (
                <MatchLineup
                  lineupHome={safeLineupHome}
                  lineupAway={safeLineupAway}
                  homeTeamName={homeName}
                  awayTeamName={awayName}
                  homeTeamFlag={match.homeTeam.flag}
                  awayTeamFlag={match.awayTeam.flag}
                  locale={loc}
                  lineupTitle={t.tabs.lineup}
                />
              )}

              {/* ═══════════════════════════════════════════════════════════
                  STANDINGS TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "standings" && (
                <section>
                  <h3 style={{ color: "#111827", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
                    {t.tabs.standings}
                  </h3>
                  {standings === null ? (
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "40px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: 32 }}>📊</span>
                      <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                        {isKo
                          ? "순위표를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."
                          : "Standings are currently unavailable. Please try again later."}
                      </p>
                    </div>
                  ) : (
                    <MatchStandingsTable
                      rows={standingRows}
                      homeTeamId={match.homeTeam.id}
                      awayTeamId={match.awayTeam.id}
                      locale={loc}
                      leagueSlug={match.leagueSlug}
                    />
                  )}
                </section>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  STATISTICS TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "statistics" && (
                <MatchStatistics
                  statistics={safeStatistics}
                  keyStats={recap?.keyStats ?? null}
                  isFinished={isFinished}
                  locale={loc}
                  homeTeamName={homeName}
                  awayTeamName={awayName}
                  statisticsTitle={t.tabs.statistics}
                />
              )}

              {/* ═══════════════════════════════════════════════════════════
                  H2H TAB
              ══════════════════════════════════════════════════════════════ */}
              {activeTab === "h2h" && h2hData && (
                <section className="max-w-4xl mx-auto">
                  <MatchHeadToHead
                    data={h2hData}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    locale={loc}
                  />
                </section>
              )}

            </div>

            {/* ── Sidebar (always visible) ─────────────────────────────────── */}
            <MatchSidebar
              matchId={Number(id)}
              homeTeamName={homeName}
              awayTeamName={awayName}
              isLive={isLive}
              isFinished={isFinished}
              isInactive={isInactive}
              userPoints={userPoints}
              initialPrediction={userPrediction}
              initialStats={predictionStats}
              locale={loc}
              loginUrl={`/${loc}/auth/login`}
              sidebarAdSlotId={`match-${id}-sidebar`}
              leagueSlug={match.leagueSlug}
              round={match.round}
              date={match.date}
              venue={match.venue}
            />

          </div>
        </div>
      </main>
    </>
  );
}
