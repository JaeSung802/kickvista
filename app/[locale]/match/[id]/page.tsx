import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { sportsEventJsonLd } from "@/lib/seo/jsonld";
import { queryMatchDetail } from "@/lib/football/query";
import AdSlot from "@/components/ads/AdSlot";
import type { Fixture } from "@/lib/football/types";

// ─── Mock match data ──────────────────────────────────────────────────────────

const MOCK_MATCHES: Record<string, Fixture & {
  events: Array<{
    minute: number;
    type: "goal" | "yellow-card" | "red-card" | "substitution";
    team: "home" | "away";
    player: string;
    assist?: string;
  }>;
  statistics: Array<{ label: string; labelKo: string; home: string | number; away: string | number }>;
  lineupHome: string[];
  lineupAway: string[];
}> = {
  "1": {
    id: 1,
    leagueId: 39,
    leagueSlug: "premier-league",
    season: 2025,
    round: "Round 28",
    date: "2026-03-14T16:00:00Z",
    venue: "Emirates Stadium, London",
    status: "FT",
    homeTeam: { id: 42, name: "Arsenal", nameKo: "아스날", shortName: "ARS", flag: "🔴" },
    awayTeam: { id: 50, name: "Man City", nameKo: "맨시티", shortName: "MCI", flag: "🔵" },
    homeScore: 2,
    awayScore: 1,
    homeScoreHT: 1,
    awayScoreHT: 0,
    events: [
      { minute: 22, type: "goal",        team: "home", player: "Bukayo Saka",      assist: "Martin Ødegaard" },
      { minute: 45, type: "yellow-card", team: "away", player: "Rodri" },
      { minute: 58, type: "goal",        team: "away", player: "Erling Haaland",   assist: "Kevin De Bruyne" },
      { minute: 71, type: "goal",        team: "home", player: "Kai Havertz",      assist: "Bukayo Saka" },
      { minute: 82, type: "red-card",    team: "away", player: "Kyle Walker" },
      { minute: 89, type: "substitution", team: "home", player: "Gabriel Martinelli", assist: "Leandro Trossard" },
    ],
    statistics: [
      { label: "Possession",     labelKo: "점유율",       home: "58%",  away: "42%" },
      { label: "Shots",          labelKo: "슈팅",         home: 14,     away: 9   },
      { label: "Shots on Target",labelKo: "유효슈팅",     home: 7,      away: 4   },
      { label: "Corners",        labelKo: "코너킥",       home: 7,      away: 3   },
      { label: "Fouls",          labelKo: "반칙",         home: 10,     away: 14  },
      { label: "Yellow Cards",   labelKo: "경고",         home: 1,      away: 2   },
      { label: "Red Cards",      labelKo: "퇴장",         home: 0,      away: 1   },
      { label: "Offsides",       labelKo: "오프사이드",   home: 2,      away: 4   },
      { label: "Passes",         labelKo: "패스",         home: 542,    away: 391 },
      { label: "Pass Accuracy",  labelKo: "패스 성공률",  home: "87%",  away: "83%" },
    ],
    lineupHome: [
      "David Raya", "Ben White", "William Saliba", "Gabriel Magalhães", "Oleksandr Zinchenko",
      "Thomas Partey", "Martin Ødegaard", "Declan Rice", "Bukayo Saka", "Gabriel Jesus", "Leandro Trossard",
    ],
    lineupAway: [
      "Ederson", "Kyle Walker", "Rúben Dias", "Manuel Akanji", "Josko Gvardiol",
      "Rodri", "Kevin De Bruyne", "Bernardo Silva", "Phil Foden", "Jack Grealish", "Erling Haaland",
    ],
  },
  "2": {
    id: 2,
    leagueId: 140,
    leagueSlug: "la-liga",
    season: 2025,
    round: "Round 28",
    date: "2026-03-14T19:00:00Z",
    venue: "Santiago Bernabéu, Madrid",
    status: "2H",
    minute: 67,
    homeTeam: { id: 541, name: "Real Madrid", nameKo: "레알 마드리드", shortName: "RMA", flag: "⚪" },
    awayTeam: { id: 529, name: "Barcelona",   nameKo: "FC 바르셀로나",  shortName: "BAR", flag: "🔵" },
    homeScore: 1,
    awayScore: 1,
    homeScoreHT: 1,
    awayScoreHT: 0,
    events: [
      { minute: 34, type: "goal",        team: "home", player: "Vinícius Jr.",   assist: "Jude Bellingham" },
      { minute: 52, type: "goal",        team: "away", player: "Robert Lewandowski", assist: "Pedri" },
      { minute: 60, type: "yellow-card", team: "home", player: "Aurélien Tchouaméni" },
    ],
    statistics: [
      { label: "Possession",     labelKo: "점유율",       home: "47%",  away: "53%" },
      { label: "Shots",          labelKo: "슈팅",         home: 8,      away: 10  },
      { label: "Shots on Target",labelKo: "유효슈팅",     home: 4,      away: 5   },
      { label: "Corners",        labelKo: "코너킥",       home: 4,      away: 6   },
      { label: "Fouls",          labelKo: "반칙",         home: 12,     away: 9   },
      { label: "Yellow Cards",   labelKo: "경고",         home: 1,      away: 0   },
      { label: "Passes",         labelKo: "패스",         home: 380,    away: 440 },
      { label: "Pass Accuracy",  labelKo: "패스 성공률",  home: "81%",  away: "89%" },
    ],
    lineupHome: [
      "Thibaut Courtois", "Dani Carvajal", "Éder Militão", "Antonio Rüdiger", "Ferland Mendy",
      "Aurélien Tchouaméni", "Eduardo Camavinga", "Jude Bellingham", "Federico Valverde", "Rodrygo", "Vinícius Jr.",
    ],
    lineupAway: [
      "Marc-André ter Stegen", "Jules Koundé", "Ronald Araújo", "Andreas Christensen", "Alejandro Balde",
      "Pedri", "Frenkie de Jong", "Gavi", "Lamine Yamal", "Raphinha", "Robert Lewandowski",
    ],
  },
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    tabs: ["Summary", "Statistics", "Lineup", "AI Analysis"],
    kickoff: "Kick-off",
    halfTime: "Half-Time",
    fullTime: "Full Time",
    live: "LIVE",
    venue: "Venue",
    round: "Round",
    goals: "Goals",
    cards: "Cards",
    substitutions: "Subs",
    homeLineup: "Home Starting XI",
    awayLineup: "Away Starting XI",
    aiDisclaimer:
      "AI analysis is generated for entertainment purposes only and should not be used for betting.",
    aiConfidence: "AI Confidence",
    aiPrediction: "Pre-match Prediction",
    keyInsight: "Key Insight",
    notFound: "Match not found.",
    backToMatches: "← Back to matches",
    goal: "Goal",
    yellowCard: "Yellow Card",
    redCard: "Red Card",
    substitution: "Substitution",
    assist: "Assist",
  },
  ko: {
    tabs: ["요약", "통계", "라인업", "AI 분석"],
    kickoff: "킥오프",
    halfTime: "전반전",
    fullTime: "경기 종료",
    live: "라이브",
    venue: "경기장",
    round: "라운드",
    goals: "득점",
    cards: "카드",
    substitutions: "교체",
    homeLineup: "홈 선발 11명",
    awayLineup: "원정 선발 11명",
    aiDisclaimer: "AI 분석은 오락 목적으로만 제공되며 베팅에 사용되어서는 안 됩니다.",
    aiConfidence: "AI 신뢰도",
    aiPrediction: "경기 전 예측",
    keyInsight: "핵심 인사이트",
    notFound: "경기를 찾을 수 없습니다.",
    backToMatches: "← 경기 목록으로",
    goal: "골",
    yellowCard: "경고",
    redCard: "퇴장",
    substitution: "교체",
    assist: "어시스트",
  },
};

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  "yellow-card": "🟨",
  "red-card": "🟥",
  substitution: "🔄",
};

function formatMatchTime(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleString(locale === "ko" ? "ko-KR" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return {};
  const providerMatch = await queryMatchDetail(Number(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = (providerMatch as any) ?? MOCK_MATCHES[id] ?? null;
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

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();

  const loc = locale as Locale;

  // Provider-first: real API returns full MatchDetail; mock returns basic fixture.
  // Fall back to the rich local MOCK_MATCHES for demo IDs "1" and "2".
  const providerMatch = await queryMatchDetail(Number(id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: (typeof MOCK_MATCHES)[string] | null = (providerMatch as any) ?? MOCK_MATCHES[id] ?? null;
  if (!match) notFound();

  const t = labels[loc];
  const isKo = loc === "ko";

  const homeName = isKo ? (match.homeTeam.nameKo ?? match.homeTeam.name) : match.homeTeam.name;
  const awayName = isKo ? (match.awayTeam.nameKo ?? match.awayTeam.name) : match.awayTeam.name;
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(match.status);
  const isFinished = ["FT", "AET", "PEN"].includes(match.status);

  const jsonLd = sportsEventJsonLd(match, loc);

  const statusLabel = isLive
    ? `${t.live} ${match.minute ?? ""}'`
    : isFinished
    ? t.fullTime
    : formatMatchTime(match.date, loc);

  // Split events by team
  const homeEvents = match.events.filter((e) => e.team === "home");
  const awayEvents = match.events.filter((e) => e.team === "away");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ background: "#0d1117", minHeight: "100vh" }}>
        {/* Match header */}
        <div
          style={{
            background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Back link */}
            <a
              href={`/${loc}`}
              style={{ color: "#8b949e", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 }}
            >
              {t.backToMatches}
            </a>

            {/* League + Round badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span style={{ color: "#8b949e", fontSize: 13 }}>
                {match.leagueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span style={{ color: "#30363d" }}>·</span>
              <span style={{ color: "#8b949e", fontSize: 13 }}>{match.round}</span>
            </div>

            {/* Score board */}
            <div className="flex items-center justify-between gap-4">
              {/* Home team */}
              <div
                className="flex flex-col items-center gap-3"
                style={{ flex: 1, textAlign: "center" as const }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                  }}
                >
                  {match.homeTeam.flag}
                </div>
                <h2
                  style={{
                    color: "#e6edf3",
                    fontSize: 18,
                    fontWeight: 800,
                    margin: 0,
                    textAlign: "center" as const,
                  }}
                >
                  {homeName}
                </h2>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-2">
                {isLive && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 999,
                      padding: "4px 12px",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 16,
                    padding: "16px 28px",
                  }}
                >
                  <span
                    style={{
                      color: "#e6edf3",
                      fontSize: 48,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {match.homeScore ?? "–"}
                  </span>
                  <span style={{ color: "#484f58", fontSize: 28, fontWeight: 400 }}>:</span>
                  <span
                    style={{
                      color: "#e6edf3",
                      fontSize: 48,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {match.awayScore ?? "–"}
                  </span>
                </div>

                {!isLive && (
                  <span
                    style={{
                      color: isFinished ? "#22c55e" : "#8b949e",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {statusLabel}
                  </span>
                )}

                {match.homeScoreHT !== undefined && (
                  <span style={{ color: "#484f58", fontSize: 12 }}>
                    {t.halfTime}: {match.homeScoreHT}–{match.awayScoreHT}
                  </span>
                )}
              </div>

              {/* Away team */}
              <div
                className="flex flex-col items-center gap-3"
                style={{ flex: 1, textAlign: "center" as const }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                  }}
                >
                  {match.awayTeam.flag}
                </div>
                <h2
                  style={{
                    color: "#e6edf3",
                    fontSize: 18,
                    fontWeight: 800,
                    margin: 0,
                    textAlign: "center" as const,
                  }}
                >
                  {awayName}
                </h2>
              </div>
            </div>

            {/* Venue */}
            {match.venue && (
              <p
                style={{
                  color: "#484f58",
                  fontSize: 12,
                  textAlign: "center" as const,
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                📍 {match.venue}
              </p>
            )}
          </div>
        </div>

        {/* Top ad */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdSlot slotId={`match-${id}-top`} size="leaderboard" />
        </div>

        {/* Tab navigation */}
        <div
          style={{ borderBottom: "1px solid #30363d" }}
          className="sticky top-16 z-40"
        >
          <div
            style={{ background: "#0d1117" }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="flex items-center gap-0 overflow-x-auto">
              {t.tabs.map((tab, idx) => (
                <a
                  key={tab}
                  href={`#tab-${idx}`}
                  style={{
                    display: "inline-block",
                    padding: "14px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: idx === 0 ? "#22c55e" : "#8b949e",
                    textDecoration: "none",
                    borderBottom: idx === 0 ? "2px solid #22c55e" : "2px solid transparent",
                    whiteSpace: "nowrap" as const,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {tab}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Summary / Timeline */}
              <section id="tab-0">
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[0]}
                </h3>
                <div
                  style={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {match.events.map((event, idx) => {
                    const isHome = event.team === "home";
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 20px",
                          borderBottom: idx < match.events.length - 1 ? "1px solid #21262d" : "none",
                          gap: 12,
                          flexDirection: isHome ? ("row" as const) : ("row-reverse" as const),
                        }}
                      >
                        {/* Team side player */}
                        <div
                          style={{
                            flex: 1,
                            textAlign: isHome ? ("left" as const) : ("right" as const),
                          }}
                        >
                          <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                            {event.player}
                          </span>
                          {event.assist && event.type === "goal" && (
                            <span style={{ color: "#8b949e", fontSize: 11, display: "block" }}>
                              {t.assist}: {event.assist}
                            </span>
                          )}
                        </div>

                        {/* Event icon + minute */}
                        <div className="flex flex-col items-center gap-1" style={{ minWidth: 64 }}>
                          <span style={{ fontSize: 18 }}>{EVENT_ICONS[event.type]}</span>
                          <span
                            style={{
                              color: "#8b949e",
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: "#0d1117",
                              borderRadius: 4,
                              padding: "1px 7px",
                              border: "1px solid #30363d",
                            }}
                          >
                            {event.minute}&apos;
                          </span>
                        </div>

                        {/* Spacer for opposite side */}
                        <div style={{ flex: 1 }} />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Statistics */}
              <section id="tab-1">
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[1]}
                </h3>
                <div
                  style={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                    padding: "4px 0",
                  }}
                >
                  {match.statistics.map((stat, idx) => {
                    const homeNum = typeof stat.home === "string"
                      ? parseInt(stat.home)
                      : stat.home;
                    const awayNum = typeof stat.away === "string"
                      ? parseInt(stat.away)
                      : stat.away;
                    const total = homeNum + awayNum || 1;
                    const homePercent = Math.round((homeNum / total) * 100);

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 20px",
                          borderBottom: idx < match.statistics.length - 1 ? "1px solid #21262d" : "none",
                        }}
                      >
                        {/* Labels row */}
                        <div
                          className="flex items-center justify-between"
                          style={{ marginBottom: 8 }}
                        >
                          <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>
                            {stat.home}
                          </span>
                          <span style={{ color: "#8b949e", fontSize: 12 }}>
                            {isKo ? stat.labelKo : stat.label}
                          </span>
                          <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>
                            {stat.away}
                          </span>
                        </div>
                        {/* Bar */}
                        <div
                          style={{
                            height: 6,
                            backgroundColor: "#21262d",
                            borderRadius: 999,
                            overflow: "hidden",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${homePercent}%`,
                              background: "linear-gradient(90deg, #22c55e, #16a34a)",
                              borderRadius: "999px 0 0 999px",
                              transition: "width 0.6s ease",
                            }}
                          />
                          <div
                            style={{
                              height: "100%",
                              width: `${100 - homePercent}%`,
                              background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                              borderRadius: "0 999px 999px 0",
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Lineup */}
              <section id="tab-2">
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[2]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home lineup */}
                  <div
                    style={{
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #21262d",
                        backgroundColor: "#0d1117",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{match.homeTeam.flag}</span>
                      <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>
                        {homeName}
                      </span>
                    </div>
                    {match.lineupHome.map((player, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 16px",
                          borderBottom: i < match.lineupHome.length - 1 ? "1px solid #21262d" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            color: "#484f58",
                            fontSize: 11,
                            fontWeight: 700,
                            minWidth: 20,
                            textAlign: "right" as const,
                          }}
                        >
                          {i === 0 ? "GK" : i <= 4 ? "DEF" : i <= 7 ? "MID" : "FWD"}
                        </span>
                        <span style={{ color: "#e6edf3", fontSize: 13 }}>{player}</span>
                      </div>
                    ))}
                  </div>

                  {/* Away lineup */}
                  <div
                    style={{
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #21262d",
                        backgroundColor: "#0d1117",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{match.awayTeam.flag}</span>
                      <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>
                        {awayName}
                      </span>
                    </div>
                    {match.lineupAway.map((player, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 16px",
                          borderBottom: i < match.lineupAway.length - 1 ? "1px solid #21262d" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            color: "#484f58",
                            fontSize: 11,
                            fontWeight: 700,
                            minWidth: 20,
                            textAlign: "right" as const,
                          }}
                        >
                          {i === 0 ? "GK" : i <= 4 ? "DEF" : i <= 7 ? "MID" : "FWD"}
                        </span>
                        <span style={{ color: "#e6edf3", fontSize: 13 }}>{player}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* AI Analysis tab */}
              <section id="tab-3">
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[3]}
                </h3>
                {/* AI disclaimer */}
                <div
                  style={{
                    backgroundColor: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                  <p style={{ color: "#f59e0b", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    {t.aiDisclaimer}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 12,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {/* Prediction */}
                  <div>
                    <p
                      style={{
                        color: "#8b949e",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        margin: "0 0 8px",
                      }}
                    >
                      {t.aiPrediction}
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          color: "#22c55e",
                          fontSize: 16,
                          fontWeight: 800,
                          backgroundColor: "rgba(34,197,94,0.1)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 8,
                          padding: "6px 14px",
                        }}
                      >
                        {homeName} {isKo ? "승리" : "Win"}
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ color: "#8b949e", fontSize: 12 }}>{t.aiConfidence}</span>
                      <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>72%</span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        backgroundColor: "#0d1117",
                        borderRadius: 999,
                        overflow: "hidden",
                        border: "1px solid #21262d",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: "72%",
                          background: "linear-gradient(90deg, #16a34a, #22c55e)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>

                  {/* Key insight */}
                  <div
                    style={{
                      borderTop: "1px solid #21262d",
                      paddingTop: 16,
                    }}
                  >
                    <p
                      style={{
                        color: "#8b949e",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        margin: "0 0 8px",
                      }}
                    >
                      {t.keyInsight}
                    </p>
                    <p style={{ color: "#e6edf3", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {isKo
                        ? `${homeName}은 최근 5경기에서 4승을 거두며 홈에서 강력한 모습을 보이고 있습니다. ${awayName}은 수비 라인이 높아 카운터 어택에 취약할 수 있습니다. 아스날의 측면 공격수들이 오늘 경기의 핵심 변수가 될 것으로 예상됩니다.`
                        : `${homeName} has been in dominant home form, winning 4 of their last 5 matches at this ground. ${awayName}'s high defensive line leaves them vulnerable to well-timed runs in behind. Expect the wide forwards to be the key differentiators in this contest.`}
                    </p>
                  </div>

                  {/* Tips */}
                  <div>
                    <p
                      style={{
                        color: "#8b949e",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        margin: "0 0 8px",
                      }}
                    >
                      {isKo ? "분석 포인트" : "Key Tips"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(isKo
                        ? ["홈팀 우세", "두 팀 모두 득점", "양측 코너킥 5개 이상", "전반전 득점"]
                        : ["Home Advantage", "Both Teams to Score", "Over 5 Corners", "Goal in First Half"]
                      ).map((tip) => (
                        <span
                          key={tip}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#a78bfa",
                            backgroundColor: "rgba(139,92,246,0.12)",
                            border: "1px solid rgba(139,92,246,0.25)",
                            borderRadius: 5,
                            padding: "4px 10px",
                          }}
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              <AdSlot slotId={`match-${id}-sidebar`} size="rectangle" />

              {/* Match info card */}
              <div
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <h4 style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {isKo ? "경기 정보" : "Match Info"}
                </h4>
                {[
                  {
                    label: isKo ? "대회" : "Competition",
                    value: match.leagueSlug
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                  },
                  { label: isKo ? "라운드" : "Round", value: match.round },
                  { label: isKo ? "날짜" : "Date", value: match.date.split("T")[0] },
                  { label: isKo ? "경기장" : "Venue", value: match.venue ?? "–" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span style={{ color: "#484f58", fontSize: 11, display: "block", marginBottom: 2 }}>
                      {label}
                    </span>
                    <span style={{ color: "#e6edf3", fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
