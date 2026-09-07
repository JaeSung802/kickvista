import { notFound } from "next/navigation";
import Image from "next/image";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { sportsEventJsonLd } from "@/lib/seo/jsonld";
import { queryMatchDetail, queryFixturePlayers } from "@/lib/football/query";
import { getAnalysesByFixture } from "@/lib/analysis/db";
import { isMockMode } from "@/lib/football-api";
import AdSlot from "@/components/ads/AdSlot";
import MatchTabNav from "@/components/match/MatchTabNav";
import RecapCTACard from "@/components/match/RecapCTACard";
import PredictionCard from "@/components/match/PredictionCard";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { getUserPrediction, getPredictionStats } from "@/lib/predictions";
import type { Fixture, MatchDetail, LineupPlayer } from "@/lib/football/types";

export const revalidate = 300; // 5분 ISR

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
  lineupHome: LineupPlayer[];
  lineupAway: LineupPlayer[];
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
      { name: "David Raya",              number: 22, pos: "G" },
      { name: "Ben White",               number: 4,  pos: "D" },
      { name: "William Saliba",          number: 12, pos: "D" },
      { name: "Gabriel Magalhães",       number: 6,  pos: "D" },
      { name: "Oleksandr Zinchenko",     number: 35, pos: "D" },
      { name: "Thomas Partey",           number: 5,  pos: "M" },
      { name: "Martin Ødegaard",         number: 8,  pos: "M" },
      { name: "Declan Rice",             number: 41, pos: "M" },
      { name: "Bukayo Saka",             number: 7,  pos: "F" },
      { name: "Gabriel Jesus",           number: 9,  pos: "F" },
      { name: "Leandro Trossard",        number: 19, pos: "F" },
    ],
    lineupAway: [
      { name: "Ederson",                 number: 31, pos: "G" },
      { name: "Kyle Walker",             number: 2,  pos: "D" },
      { name: "Rúben Dias",              number: 3,  pos: "D" },
      { name: "Manuel Akanji",           number: 25, pos: "D" },
      { name: "Josko Gvardiol",          number: 24, pos: "D" },
      { name: "Rodri",                   number: 16, pos: "M" },
      { name: "Kevin De Bruyne",         number: 17, pos: "M" },
      { name: "Bernardo Silva",          number: 20, pos: "M" },
      { name: "Phil Foden",              number: 47, pos: "F" },
      { name: "Jack Grealish",           number: 10, pos: "F" },
      { name: "Erling Haaland",          number: 9,  pos: "F" },
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
      { name: "Thibaut Courtois",        number: 1,  pos: "G" },
      { name: "Dani Carvajal",           number: 2,  pos: "D" },
      { name: "Éder Militão",            number: 3,  pos: "D" },
      { name: "Antonio Rüdiger",         number: 22, pos: "D" },
      { name: "Ferland Mendy",           number: 23, pos: "D" },
      { name: "Aurélien Tchouaméni",     number: 18, pos: "M" },
      { name: "Eduardo Camavinga",       number: 12, pos: "M" },
      { name: "Jude Bellingham",         number: 5,  pos: "M" },
      { name: "Federico Valverde",       number: 8,  pos: "F" },
      { name: "Rodrygo",                 number: 11, pos: "F" },
      { name: "Vinícius Jr.",            number: 7,  pos: "F" },
    ],
    lineupAway: [
      { name: "Marc-André ter Stegen",   number: 1,  pos: "G" },
      { name: "Jules Koundé",            number: 23, pos: "D" },
      { name: "Ronald Araújo",           number: 4,  pos: "D" },
      { name: "Andreas Christensen",     number: 15, pos: "D" },
      { name: "Alejandro Balde",         number: 3,  pos: "D" },
      { name: "Pedri",                   number: 8,  pos: "M" },
      { name: "Frenkie de Jong",         number: 21, pos: "M" },
      { name: "Gavi",                    number: 6,  pos: "M" },
      { name: "Lamine Yamal",            number: 27, pos: "F" },
      { name: "Raphinha",                number: 11, pos: "F" },
      { name: "Robert Lewandowski",      number: 9,  pos: "F" },
    ],
  },
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    tabs: ["Summary", "Statistics", "Lineup", "AI Analysis", "Recap"],
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
    tabs: ["요약", "통계", "라인업", "AI 분석", "리캡"],
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

// Normalise a raw event from either mock format or real API format into a flat shape.
function normaliseEvent(
  e: unknown,
  homeId: number
): { minute: number; type: string; team: "home" | "away"; player: string; assist: string | undefined } | null {
  if (!e || typeof e !== "object") return null;
  const ev = e as Record<string, unknown>;

  const minute: number =
    typeof ev.minute === "number"
      ? ev.minute
      : ((ev.time as Record<string, unknown> | undefined)?.elapsed as number | undefined) ?? 0;

  // Normalise type: real API uses "Goal", "Card", "subst"; mock uses "goal", "yellow-card" etc.
  const rawType = String(ev.type ?? "").toLowerCase();
  const detail  = String(ev.detail ?? "").toLowerCase();
  let type: string;
  if (rawType === "goal")         type = "goal";
  else if (rawType === "card")    type = detail.includes("red") ? "red-card" : "yellow-card";
  else if (rawType === "subst")   type = "substitution";
  else                             type = rawType; // already normalised (mock)

  // Normalise team: mock = "home"|"away", real API = { id: number }
  let team: "home" | "away";
  if (typeof ev.team === "string") {
    team = ev.team === "home" ? "home" : "away";
  } else {
    const teamId = (ev.team as Record<string, unknown> | undefined)?.id as number | undefined;
    team = teamId === homeId ? "home" : "away";
  }

  // Normalise player name: mock = ev.player (string), real API = { id, name }
  const player: string =
    typeof ev.player === "string"
      ? ev.player
      : typeof ev.playerName === "string"
      ? ev.playerName
      : (ev.player as Record<string, unknown> | undefined)?.name as string | undefined
      ?? "Unknown";

  // Normalise assist: mock = ev.assist (string), real API = { id, name } | null
  const rawAssist = ev.assist ?? ev.assistName;
  const assist: string | undefined =
    typeof rawAssist === "string"
      ? rawAssist || undefined
      : (rawAssist as Record<string, unknown> | undefined)?.name as string | undefined || undefined;

  return { minute, type, team, player, assist };
}

// KO → EN stat type mapping for real API "Shots on Goal" etc.
const STAT_LABEL_MAP: Record<string, { en: string; ko: string }> = {
  "ball possession":    { en: "Possession",       ko: "점유율"      },
  "shots on goal":      { en: "Shots on Target",   ko: "유효슈팅"    },
  "total shots":        { en: "Shots",             ko: "슈팅"        },
  "corner kicks":       { en: "Corners",           ko: "코너킥"      },
  "total passes":       { en: "Passes",            ko: "패스"        },
  "passes %":           { en: "Pass Accuracy",     ko: "패스 성공률" },
  "yellow cards":       { en: "Yellow Cards",      ko: "경고"        },
  "red cards":          { en: "Red Cards",         ko: "퇴장"        },
  "fouls":              { en: "Fouls",             ko: "반칙"        },
  "offsides":           { en: "Offsides",          ko: "오프사이드"  },
};

// Flatten real API statistics `[{team, statistics:[{type,value}]}]` → flat {label,labelKo,home,away}[]
function flattenApiStats(
  raw: unknown,
  homeId: number
): Array<{ label: string; labelKo: string; home: string | number; away: string | number }> {
  if (!Array.isArray(raw)) return [];
  // Detect real API format: each element has a "statistics" sub-array
  const isApiFormat = (raw[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  if (!isApiFormat) return []; // already flat (mock) — caller uses its own format

  const homeTeamEntry = raw.find((entry) => {
    const t = (entry as Record<string, unknown>).team as Record<string, unknown> | undefined;
    return t?.id === homeId;
  }) as Record<string, unknown> | undefined;
  const awayTeamEntry = raw.find((entry) => {
    const t = (entry as Record<string, unknown>).team as Record<string, unknown> | undefined;
    return t?.id !== homeId;
  }) as Record<string, unknown> | undefined;

  if (!homeTeamEntry || !awayTeamEntry) return [];

  const homeStats = homeTeamEntry.statistics as Array<{ type: string; value: unknown }> ?? [];
  const awayStats = awayTeamEntry.statistics as Array<{ type: string; value: unknown }> ?? [];

  return homeStats
    .map((hs) => {
      const as_ = awayStats.find((a) => a.type === hs.type);
      const key = hs.type.toLowerCase();
      const meta = STAT_LABEL_MAP[key];
      if (!meta) return null;
      return {
        label:   meta.en,
        labelKo: meta.ko,
        home: hs.value ?? 0,
        away: as_?.value ?? 0,
      } as { label: string; labelKo: string; home: string | number; away: string | number };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
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

  // Normalise events array (handles both mock and real API formats)
  const rawEvents: unknown[] = Array.isArray(match.events) ? match.events : [];
  const events = rawEvents
    .map((e) => normaliseEvent(e, homeId))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  // Normalise statistics (handle both mock flat array and real API nested array)
  const rawStats: unknown[] = Array.isArray(match.statistics) ? match.statistics : [];
  const isApiFormat = (rawStats[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  const flatStats: Array<{ label: string; labelKo: string; home: string | number; away: string | number }> =
    isApiFormat
      ? flattenApiStats(rawStats, homeId)
      : rawStats as Array<{ label: string; labelKo: string; home: string | number; away: string | number }>;

  // MOM: first scorer, fallback to winner team name
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

  // Highlights
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
    // Fallback for no event data
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

  // Narrative
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

  // Key stats (from normalised flat stats)
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
  const match = providerMatch ?? (isMockMode ? (MOCK_MATCHES[id] ?? null) : null);
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

  // Real mode: providerMatch only. Mock mode: MOCK_MATCHES fallback when absent.
  const providerMatch = await queryMatchDetail(Number(id));
  type MatchData = MatchDetail | (typeof MOCK_MATCHES)[string];
  const match: MatchData | null =
    providerMatch ??
    (isMockMode ? (MOCK_MATCHES[id] ?? null) : null);
  // Match not found — render a graceful error page instead of a hard 404.
  // This prevents 404s caused by API rate-limits or temporary outages;
  // the ISR cache will retry after `revalidate` seconds.
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

  // Safe arrays — API returns undefined for postponed/cancelled matches
  const rawEvents     = Array.isArray(match.events)     ? match.events     : [];
  const rawStatistics = Array.isArray(match.statistics) ? match.statistics : [];

  const safeLineupHome: LineupPlayer[] = Array.isArray(match.lineupHome) ? match.lineupHome : [];
  const safeLineupAway: LineupPlayer[] = Array.isArray(match.lineupAway) ? match.lineupAway : [];


  // Normalise events: handles both mock format {player,team:"home"|"away"} and
  // real API format {player:{id,name}, team:{id,name}, time:{elapsed}} so
  // React never receives an object where it expects a string.
  const safeEvents = rawEvents
    .map((e) => normaliseEvent(e, match.homeTeam.id))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  // Normalise statistics: real API returns [{team,statistics:[]}] nested format;
  // mock returns flat [{label,labelKo,home,away}].  flattenApiStats handles both.
  const isApiStatsFormat = (rawStatistics[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  const safeStatistics: Array<{ label: string; labelKo: string; home: string | number; away: string | number }> =
    isApiStatsFormat
      ? flattenApiStats(rawStatistics, match.homeTeam.id)
      : rawStatistics as Array<{ label: string; labelKo: string; home: string | number; away: string | number }>;

  // CDN logo URLs — use API value if present, otherwise construct from team ID
  const homeLogo = match.homeTeam.logo ?? `https://media.api-sports.io/football/teams/${match.homeTeam.id}.png`;
  const awayLogo = match.awayTeam.logo ?? `https://media.api-sports.io/football/teams/${match.awayTeam.id}.png`;

  // Fetch live player ratings for finished matches (MOM selection)
  const fixturePlayers = (isFinished && !isInactive)
    ? await queryFixturePlayers(Number(id))
    : [];

  // MOM: highest-rated player with ≥ 45 minutes played
  const momPlayer = fixturePlayers.length > 0
    ? fixturePlayers
        .filter((p) => p.minutesPlayed >= 45 && (p.rating ?? 0) > 0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.goals - a.goals || b.assists - a.assists)[0] ?? null
    : null;

  // ── Prediction data ──────────────────────────────────────────────────────────
  const supabaseUser = await getServerUser();

  // Fetch profile, prediction stats, user prediction, and AI analyses in parallel
  const [userProfileR, predictionStatsR, userPredictionR, dbAnalysesR] = await Promise.allSettled([
    supabaseUser ? getServerProfile(supabaseUser.id) : Promise.resolve(null),
    getPredictionStats(Number(id)),
    supabaseUser ? getUserPrediction(supabaseUser.id, Number(id)) : Promise.resolve(null),
    getAnalysesByFixture(Number(id), loc).catch(() => ({ preview: null, recap: null })),
  ]);
  const userProfile     = userProfileR.status     === "fulfilled" ? userProfileR.value     : null;
  const predictionStats = predictionStatsR.status === "fulfilled" ? predictionStatsR.value : { HOME_WIN: 0, DRAW: 0, AWAY_WIN: 0, total: 0 };
  const userPrediction  = userPredictionR.status  === "fulfilled" ? userPredictionR.value  : null;
  const dbAnalyses      = dbAnalysesR.status      === "fulfilled" ? dbAnalysesR.value      : { preview: null, recap: null };
  const userPoints = userProfile ? userProfile.total_points : null;
  const dbPreview = dbAnalyses.preview;
  const dbRecap   = dbAnalyses.recap;

  // AI Recap (local fallback using match events — used when DB recap not yet ready)
  const recap = generateRecap(match);

  // For inactive (postponed/cancelled) matches hide AI Analysis (idx 3) and Recap (idx 4) tabs
  const visibleTabs = isInactive
    ? t.tabs.slice(0, 3).map((label, idx) => ({ label, idx }))
    : t.tabs.map((label, idx) => ({ label, idx }));

  // Always start at Summary (idx 0) — scroll spy takes over as user scrolls
  const defaultTabIdx = 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="bg-gray-50 min-h-screen">
        {/* Match header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Back link */}
            <a
              href={`/${loc}`}
              style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 }}
            >
              {t.backToMatches}
            </a>

            {/* League + Round badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span style={{ color: "#6b7280", fontSize: 13 }}>
                {match.leagueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span style={{ color: "#d1d5db" }}>·</span>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{match.round}</span>
            </div>

            {/* Score board */}
            <div className="flex items-start justify-between gap-2">
              {/* Home team */}
              <div className="flex flex-col items-center" style={{ flex: "0 0 120px", width: 120 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md flex items-center justify-center p-2 mb-3" style={{ width: 72, height: 72 }}>
                  <Image src={homeLogo} alt={homeName} width={52} height={52} className="object-contain" unoptimized />
                </div>
                <h2 className="text-sm font-bold text-gray-800 text-center leading-tight" style={{ wordBreak: "break-word", width: "100%" }}>
                  {homeName}
                </h2>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-2 shrink-0">
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
                        backgroundColor: "#059669",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        color: "#059669",
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
                    gap: 6,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 20px",
                  }}
                >
                  <span style={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
                    {match.homeScore ?? "–"}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: 24, fontWeight: 400 }}>:</span>
                  <span style={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
                    {match.awayScore ?? "–"}
                  </span>
                </div>

                {!isLive && (
                  <span
                    style={{
                      color: isFinished ? "#059669" : "#6b7280",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {statusLabel}
                  </span>
                )}

                {match.homeScoreHT !== undefined && (
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    {t.halfTime}: {match.homeScoreHT}–{match.awayScoreHT}
                  </span>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center" style={{ flex: "0 0 120px", width: 120 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md flex items-center justify-center p-2 mb-3" style={{ width: 72, height: 72 }}>
                  <Image src={awayLogo} alt={awayName} width={52} height={52} className="object-contain" unoptimized />
                </div>
                <h2 className="text-sm font-bold text-gray-800 text-center leading-tight" style={{ wordBreak: "break-word", width: "100%" }}>
                  {awayName}
                </h2>
              </div>
            </div>

            {/* Venue */}
            {match.venue && (
              <p
                style={{
                  color: "#9ca3af",
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
        <MatchTabNav tabs={visibleTabs} defaultTabIdx={defaultTabIdx} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* ── Postponed / Cancelled notice ─────────────────────────── */}
              {isInactive && (
                <div
                  style={{
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 12,
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 44 }}>📅</span>
                  <p style={{ color: "#92400e", fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {isCancelled
                      ? (loc === "ko" ? "이 경기는 취소되었습니다" : "This match has been cancelled")
                      : (loc === "ko" ? "이 경기는 연기되었습니다" : "This match has been postponed")}
                  </p>
                  <p style={{ color: "#b45309", fontSize: 13, margin: 0, maxWidth: 400, lineHeight: 1.7 }}>
                    {isCancelled
                      ? (loc === "ko"
                          ? "경기가 취소되어 더 이상 진행되지 않습니다."
                          : "This fixture has been cancelled and will not take place.")
                      : (loc === "ko"
                          ? "이 경기는 일정에 따라 연기되었습니다. 새로운 일정이 확정되면 업데이트됩니다."
                          : "This match has been postponed. The page will be updated once a new date is confirmed.")}
                  </p>
                </div>
              )}

              {/* Summary / Timeline */}
              <section id="tab-0">
                <h3
                  style={{
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[0]}
                </h3>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {safeEvents.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 20px", margin: 0, textAlign: "center" }}>
                      {loc === "ko" ? "경기 이벤트 데이터가 없습니다." : "No match events available."}
                    </p>
                  ) : null}
                  {safeEvents.map((event, idx) => {
                    const isHome = event.team === "home";
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 20px",
                          borderBottom: idx < safeEvents.length - 1 ? "1px solid #f3f4f6" : "none",
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
                          <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>
                            {event.player}
                          </span>
                          {event.assist && event.type === "goal" && (
                            <span style={{ color: "#6b7280", fontSize: 11, display: "block" }}>
                              {t.assist}: {event.assist}
                            </span>
                          )}
                        </div>

                        {/* Event icon + minute */}
                        <div className="flex flex-col items-center gap-1" style={{ minWidth: 64 }}>
                          <span style={{ fontSize: 18 }}>{EVENT_ICONS[event.type]}</span>
                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: "#f9fafb",
                              borderRadius: 4,
                              padding: "1px 7px",
                              border: "1px solid #e5e7eb",
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
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[1]}
                </h3>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "4px 0",
                  }}
                >
                  {safeStatistics.map((stat, idx) => {
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
                          borderBottom: idx < safeStatistics.length - 1 ? "1px solid #f3f4f6" : "none",
                        }}
                      >
                        {/* Labels row */}
                        <div
                          className="flex items-center justify-between"
                          style={{ marginBottom: 8 }}
                        >
                          <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                            {stat.home}
                          </span>
                          <span style={{ color: "#6b7280", fontSize: 12 }}>
                            {isKo ? stat.labelKo : stat.label}
                          </span>
                          <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                            {stat.away}
                          </span>
                        </div>
                        {/* Bar */}
                        <div
                          style={{
                            height: 6,
                            backgroundColor: "#f3f4f6",
                            borderRadius: 999,
                            overflow: "hidden",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${homePercent}%`,
                              background: "linear-gradient(90deg, #059669, #059669)",
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
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[2]}
                </h3>
                {/* Helper: infer rough position from index in an 11-player list */}
                {(() => {
                  function posLabel(i: number, total: number): string {
                    if (i === 0) return "GK";
                    // Rough 4-4-2 / 4-3-3 groupings
                    if (total >= 11) {
                      if (i <= 4) return "DF";
                      if (i <= 7) return "MF";
                      return "FW";
                    }
                    return String(i + 1);
                  }

                  const POS_MAP: Record<string, string> = { G: "GK", D: "DF", M: "MF", F: "FW" };

                  function LineupCard({
                    players,
                    teamName,
                    teamFlag,
                    accent,
                    bg,
                  }: {
                    players: LineupPlayer[];
                    teamName: string;
                    teamFlag: string;
                    accent: string;      // e.g. "#059669"
                    bg: string;          // e.g. "rgba(22,163,74,0.08)"
                  }) {
                    return (
                      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                        {/* Card header */}
                        <div style={{
                          padding: "11px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          backgroundColor: "#f9fafb",
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{ fontSize: 20 }}>{teamFlag}</span>
                          <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{teamName}</span>
                          <span style={{
                            marginLeft: "auto",
                            fontSize: 10, fontWeight: 700, color: "#9ca3af",
                            backgroundColor: "#f3f4f6", borderRadius: 4, padding: "2px 6px",
                          }}>
                            {players.length === 11 ? "XI" : `${players.length}명`}
                          </span>
                        </div>
                        {/* Players */}
                        {players.map((player, i) => {
                          const pos = player.pos ? (POS_MAP[player.pos] ?? player.pos) : posLabel(i, players.length);
                          const isGK = pos === "GK";
                          const jerseyNum = player.number ?? i + 1;
                          return (
                            <div
                              key={i}
                              style={{
                                padding: "9px 16px",
                                borderBottom: i < players.length - 1 ? "1px solid #f9fafb" : "none",
                                display: "flex", alignItems: "center", gap: 10,
                                backgroundColor: isGK ? `${bg}` : "transparent",
                              }}
                            >
                              {/* Number badge */}
                              <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 26, height: 26, borderRadius: "50%",
                                backgroundColor: isGK ? accent : bg,
                                border: `1.5px solid ${accent}`,
                                color: isGK ? "#fff" : accent,
                                fontSize: 10, fontWeight: 800, flexShrink: 0,
                                boxShadow: `0 1px 4px ${accent}40`,
                              }}>
                                {jerseyNum}
                              </span>
                              {/* Position tag */}
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: accent,
                                backgroundColor: bg,
                                borderRadius: 3, padding: "1px 4px",
                                flexShrink: 0, lineHeight: 1.5,
                                border: `1px solid ${accent}30`,
                              }}>
                                {pos}
                              </span>
                              {/* Player name */}
                              <span style={{
                                color: "#1f2937", fontSize: 13,
                                fontWeight: isGK ? 700 : 400,
                                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {player.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  const hasLineup = safeLineupHome.length > 0 || safeLineupAway.length > 0;

                  if (!hasLineup) {
                    return (
                      <div style={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: "40px 24px",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 12, textAlign: "center",
                      }}>
                        <span style={{ fontSize: 36 }}>📋</span>
                        <p style={{ color: "#374151", fontSize: 14, fontWeight: 700, margin: 0 }}>
                          {isKo ? "라인업 정보 없음" : "Lineup Unavailable"}
                        </p>
                        <p style={{ color: "#9ca3af", fontSize: 13, margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
                          {isKo
                            ? "이 경기의 선발 라인업이 아직 공개되지 않았습니다."
                            : "The starting lineup for this match has not been announced yet."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <LineupCard
                        players={safeLineupHome}
                        teamName={homeName}
                        teamFlag={match.homeTeam.flag}
                        accent="#059669"
                        bg="rgba(22,163,74,0.08)"
                      />
                      <LineupCard
                        players={safeLineupAway}
                        teamName={awayName}
                        teamFlag={match.awayTeam.flag}
                        accent="#2563eb"
                        bg="rgba(37,99,235,0.07)"
                      />
                    </div>
                  );
                })()}
              </section>

              {/* AI Analysis tab */}
              <section id="tab-3">
                <h3
                  style={{
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                    margin: "0 0 16px",
                  }}
                >
                  {t.tabs[3]}
                </h3>

                {dbPreview ? (
                  <>
                    {/* AI disclaimer */}
                    <div
                      style={{
                        backgroundColor: "rgba(59,130,246,0.06)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>🤖</span>
                      <p style={{ color: "#1d4ed8", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                        {dbPreview.disclaimer ?? t.aiDisclaimer}
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {/* Prediction */}
                      {dbPreview.prediction && (
                        <div>
                          <p
                            style={{
                              color: "#6b7280",
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
                                color: "#059669",
                                fontSize: 16,
                                fontWeight: 800,
                                backgroundColor: "rgba(34,197,94,0.1)",
                                border: "1px solid rgba(34,197,94,0.25)",
                                borderRadius: 8,
                                padding: "6px 14px",
                              }}
                            >
                              {dbPreview.prediction.label}
                            </span>
                          </div>

                          {/* Confidence */}
                          <div style={{ marginTop: 12 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                              <span style={{ color: "#6b7280", fontSize: 12 }}>{t.aiConfidence}</span>
                              <span style={{ color: "#059669", fontSize: 13, fontWeight: 700 }}>
                                {dbPreview.prediction.confidence}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: 8,
                                backgroundColor: "#f3f4f6",
                                borderRadius: 999,
                                overflow: "hidden",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${dbPreview.prediction.confidence}%`,
                                  background: "linear-gradient(90deg, #059669, #059669)",
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Key insight */}
                      <div
                        style={{
                          borderTop: "1px solid #f3f4f6",
                          paddingTop: 16,
                        }}
                      >
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.06em",
                            margin: "0 0 8px",
                          }}
                        >
                          {t.keyInsight}
                        </p>
                        <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                          {dbPreview.insight}
                        </p>
                      </div>

                      {/* Tips */}
                      {dbPreview.tips && dbPreview.tips.length > 0 && (
                        <div>
                          <p
                            style={{
                              color: "#6b7280",
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
                            {dbPreview.tips.map((tip, i) => (
                              <span
                                key={i}
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
                                {isKo ? tip.labelKo : tip.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (isFinished && (dbRecap || recap)) ? (
                  /* Condition A: Finished + recap exists — premium CTA (self-contained client component) */
                  <RecapCTACard locale={isKo ? "ko" : "en"} recapTabIdx={4} />
                ) : isFinished ? (
                  /* Condition B-2: Finished but no recap yet — skeleton */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-base shrink-0">🤖</span>
                      <p className="text-xs font-medium text-blue-700">
                        {isKo
                          ? "AI가 경기를 분석하고 있습니다. 곧 리캡이 완성됩니다."
                          : "AI is analysing the match. The recap will be ready shortly."}
                      </p>
                    </div>
                    {/* Skeleton cards */}
                    {[80, 48, 64].map((w, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                        <div className="h-3 bg-gray-200 rounded-full mb-3" style={{ width: `${w}%` }} />
                        <div className="h-2.5 bg-gray-100 rounded-full mb-2 w-full" />
                        <div className="h-2.5 bg-gray-100 rounded-full" style={{ width: "60%" }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Condition B-1: Match not yet finished */
                  <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">
                      ⚽
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-base mb-2">
                        {isKo ? "경기 종료 후 AI 분석 시작" : "AI Analysis After Final Whistle"}
                      </p>
                      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                        {isKo
                          ? "경기가 끝나는 순간 AI가 즉시 분석을 시작합니다. 승리 요인, 핵심 장면, 선수 평점까지 자동으로 생성됩니다."
                          : "The moment the final whistle blows, AI begins its analysis — win factors, key moments, and player ratings."}
                      </p>
                    </div>
                    {/* Skeleton preview */}
                    <div className="w-full flex flex-col gap-2 mt-2 opacity-40">
                      {[90, 70, 55].map((w, i) => (
                        <div key={i} className="h-2.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ─── Recap tab ──────────────────────────────────────── */}
              <section id="tab-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h3 className="text-base font-bold text-gray-900">{t.tabs[4]}</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    ✨ AI-Generated
                  </span>
                </div>

                {/* AI 배지 */}
                {recap && (
                  <div className="flex items-center gap-2 px-4 py-2.5 mb-5 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-base shrink-0">🤖</span>
                    <p className="text-xs font-medium text-blue-700">
                      {isKo
                        ? "AI가 분석한 경기 요약입니다. 통계 데이터를 바탕으로 자동 생성됩니다."
                        : "AI-analysed match summary, auto-generated from match statistics."}
                    </p>
                  </div>
                )}

                {!recap && !dbRecap ? (
                  /* Empty state — match not finished */
                  <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl">
                      ⏱️
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm mb-1">
                        {isKo ? "리캡 준비 중" : "Recap Pending"}
                      </p>
                      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                        {isKo
                          ? "경기 종료 후 AI가 분석한 리캡 데이터가 업데이트될 예정입니다."
                          : "The AI-powered recap will be available after the match has concluded."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">

                    {/* MOM Card */}
                    <div className="bg-linear-to-br from-emerald-600 to-emerald-900 rounded-2xl p-5 text-white">
                      <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-3">
                        {isKo ? "🏅 오늘의 선수 (MOM)" : "🏅 Man of the Match"}
                      </p>
                      <div className="flex items-center gap-4">
                        {/* Player photo or fallback star */}
                        <div className="relative shrink-0">
                          {momPlayer ? (
                            <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden border-2 border-white/30">
                              <Image
                                src={`https://media.api-sports.io/football/players/${momPlayer.playerId}.png`}
                                alt={momPlayer.playerName}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                              ⭐
                            </div>
                          )}
                          {momPlayer && (
                            <span className="absolute -bottom-1.5 -right-1.5 bg-white text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                              {(momPlayer.rating ?? 0).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xl font-black leading-tight truncate">
                            {momPlayer ? momPlayer.playerName : (recap?.mom.name ?? "–")}
                          </p>
                          {momPlayer ? (
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {momPlayer.goals > 0 && (
                                <span className="flex items-center gap-1 text-sm text-emerald-100">
                                  ⚽ {momPlayer.goals}{isKo ? "골" : "G"}
                                </span>
                              )}
                              {momPlayer.assists > 0 && (
                                <span className="flex items-center gap-1 text-sm text-emerald-100">
                                  🎯 {momPlayer.assists}{isKo ? "어시스트" : "A"}
                                </span>
                              )}
                              {momPlayer.shotsTotal > 0 && (
                                <span className="flex items-center gap-1 text-sm text-emerald-100">
                                  🎯 {momPlayer.shotsOnTarget}/{momPlayer.shotsTotal} {isKo ? "유효슈팅" : "SOT"}
                                </span>
                              )}
                              <span className="text-sm text-amber-200">
                                {momPlayer.minutesPlayed}{isKo ? "분 출전" : "min"}
                              </span>
                            </div>
                          ) : recap ? (
                            <p className="text-emerald-100 text-sm mt-1 leading-relaxed">
                              {isKo ? recap.mom.reasonKo : recap.mom.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Key Highlights — prefer dbRecap.tips, fallback to local recap */}
                    {(dbRecap?.tips && dbRecap.tips.length > 0) ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                          {isKo ? "핵심 하이라이트" : "Key Highlights"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dbRecap.tips.map((tip, i) => (
                            <span
                              key={i}
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
                              {isKo ? tip.labelKo : tip.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : recap?.highlights && recap.highlights.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                          {isKo ? "핵심 하이라이트" : "Key Highlights"}
                        </p>
                        <div className="flex flex-col gap-3">
                          {recap.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="text-xl shrink-0 mt-0.5">{h.icon}</span>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {isKo ? h.textKo : h.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Match Narrative — prefer dbRecap.insight, fallback to local recap */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {isKo ? "경기 흐름 분석" : "Match Narrative"}
                      </p>
                      {dbRecap ? (
                        <p className="text-sm text-gray-700 leading-relaxed">{dbRecap.insight}</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {recap!.narrative.map((para, i) => (
                            <p key={i} className="text-sm text-gray-700 leading-relaxed">
                              {isKo ? para.ko : para.en}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
                        <span>🤖</span>
                        {isKo
                          ? "이 리캡은 KickVista AI가 경기 데이터를 분석하여 자동 생성했습니다."
                          : "This recap was auto-generated by KickVista AI based on match data."}
                      </p>
                    </div>

                    {/* Key Stats Comparison */}
                    {recap && recap.keyStats.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                          {isKo ? "승부를 가른 통계" : "Decisive Stats"}
                        </p>
                        <div className="flex flex-col gap-4">
                          {recap.keyStats.map((stat) => {
                            const hv = typeof stat.home === "string" ? parseFloat(stat.home) : stat.home;
                            const av = typeof stat.away === "string" ? parseFloat(stat.away) : stat.away;
                            const total = hv + av || 1;
                            const homePct = Math.round((hv / total) * 100);

                            return (
                              <div key={stat.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: stat.winner === "home" ? "#059669" : "#374151" }}
                                  >
                                    {stat.home}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {isKo ? stat.labelKo : stat.label}
                                  </span>
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: stat.winner === "away" ? "#2563eb" : "#374151" }}
                                  >
                                    {stat.away}
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                  <div
                                    style={{
                                      width: `${homePct}%`,
                                      background: stat.winner === "home"
                                        ? "linear-gradient(90deg,#059669,#059669)"
                                        : "linear-gradient(90deg,#d1d5db,#9ca3af)",
                                      borderRadius: "999px 0 0 999px",
                                    }}
                                  />
                                  <div
                                    style={{
                                      width: `${100 - homePct}%`,
                                      background: stat.winner === "away"
                                        ? "linear-gradient(90deg,#60a5fa,#2563eb)"
                                        : "linear-gradient(90deg,#d1d5db,#9ca3af)",
                                      borderRadius: "0 999px 999px 0",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Team color legend */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="inline-block w-3 h-2 rounded-full bg-emerald-500" />
                            {homeName}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            {awayName}
                            <span className="inline-block w-3 h-2 rounded-full bg-blue-500" />
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Timeline Key Moments */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {isKo ? "결정적 순간" : "Key Moments"}
                      </p>
                      <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                        <div className="flex flex-col gap-4">
                          {safeEvents
                            .filter((e) => e.type !== "substitution")
                            .map((event, i) => {
                              const isHome = event.team === "home";
                              const icon = EVENT_ICONS[event.type];
                              const color =
                                event.type === "goal" ? "#059669"
                                : event.type === "red-card" ? "#dc2626"
                                : "#ca8a04";
                              return (
                                <div key={i} className="relative flex items-start gap-3">
                                  {/* Timeline dot */}
                                  <div
                                    className="absolute -left-4 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px]"
                                    style={{ backgroundColor: color, top: 2 }}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: color + "18", color }}
                                      >
                                        {event.minute}&apos;
                                      </span>
                                      <span className="text-base leading-none">{icon}</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {event.player}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        — {isHome ? homeName : awayName}
                                      </span>
                                    </div>
                                    {event.assist && event.type === "goal" && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {isKo ? "어시스트" : "Assist"}: {event.assist}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">

              {/* ── Prediction Card ────────────────────────────────────── */}
              <PredictionCard
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
              />

              <AdSlot slotId={`match-${id}-sidebar`} size="rectangle" />

              {/* Match info card */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <h4 style={{ color: "#111827", fontSize: 13, fontWeight: 700, margin: 0 }}>
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
                    <span style={{ color: "#9ca3af", fontSize: 11, display: "block", marginBottom: 2 }}>
                      {label}
                    </span>
                    <span style={{ color: "#374151", fontSize: 13 }}>{value}</span>
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
