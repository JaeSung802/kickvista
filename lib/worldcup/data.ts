/**
 * 2026 FIFA 북중미 월드컵 정적 데이터
 *
 * ⚠️  실제 대진표/일정 확정 후 이 파일을 수동 업데이트하세요.
 *     대진표: KOREA_GROUP.standings → 실제 팀명/국가로 교체
 *     일정:   KOREA_MATCHES → 실제 날짜/상대/경기장으로 교체
 */

// ─── 대회 기본 정보 ───────────────────────────────────────────────────────────

export const WORLDCUP_2026 = {
  nameKo:      "2026 FIFA 북중미 월드컵",
  nameEn:      "2026 FIFA World Cup",
  openingDate: "2026-06-11", // 개막일 (멕시코시티)
  finalDate:   "2026-07-19", // 결승전
  totalTeams:  48,
  hostsKo:     ["미국", "캐나다", "멕시코"],
} as const;

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface WCTeamStanding {
  teamKo:  string;
  teamEn:  string;
  flag:    string; // 국기 이모지
  played:  number;
  won:     number;
  drawn:   number;
  lost:    number;
  gf:      number; // 득점
  ga:      number; // 실점
  points:  number;
}

export interface WCMatch {
  id:           string;
  date:         string;   // "2026-06-15"
  timeKst:      string;   // "09:00 KST"
  homeTeamKo:   string;
  homeTeamEn:   string;
  homeFlag:     string;
  awayTeamKo:   string;
  awayTeamEn:   string;
  awayFlag:     string;
  venueKo:      string;
  venueEn:      string;
  homeScore?:   number;
  awayScore?:   number;
  status:       "scheduled" | "live" | "finished";
}

// ─── 대한민국 조별 순위 ───────────────────────────────────────────────────────
// ⚠️ 2024년 12월 조 추첨 결과 확인 후 업데이트

export const KOREA_GROUP: {
  groupId:    string;
  groupName:  string;
  standings:  WCTeamStanding[];
} = {
  groupId:   "?",           // 예: "B" — 확정 후 변경
  groupName: "대한민국 조", // 예: "B조" — 확정 후 변경
  standings: [
    {
      teamKo: "대한민국", teamEn: "Korea Republic", flag: "🇰🇷",
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
    },
    {
      teamKo: "미정", teamEn: "TBD", flag: "🏳️",
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
    },
    {
      teamKo: "미정", teamEn: "TBD", flag: "🏳️",
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
    },
    {
      teamKo: "미정", teamEn: "TBD", flag: "🏳️",
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
    },
  ],
};

// ─── 대한민국 경기 일정 ───────────────────────────────────────────────────────
// ⚠️ 실제 경기 일정 발표 후 업데이트

export const KOREA_MATCHES: WCMatch[] = [
  {
    id:          "kor-g1",
    date:        "2026-06-XX",
    timeKst:     "미정 KST",
    homeTeamKo:  "대한민국", homeTeamEn: "Korea Republic", homeFlag: "🇰🇷",
    awayTeamKo:  "미정",     awayTeamEn: "TBD",             awayFlag: "🏳️",
    venueKo:     "미정",     venueEn:    "TBD",
    status:      "scheduled",
  },
  {
    id:          "kor-g2",
    date:        "2026-06-XX",
    timeKst:     "미정 KST",
    homeTeamKo:  "미정",     homeTeamEn: "TBD",             homeFlag: "🏳️",
    awayTeamKo:  "대한민국", awayTeamEn: "Korea Republic",  awayFlag: "🇰🇷",
    venueKo:     "미정",     venueEn:    "TBD",
    status:      "scheduled",
  },
  {
    id:          "kor-g3",
    date:        "2026-06-XX",
    timeKst:     "미정 KST",
    homeTeamKo:  "대한민국", homeTeamEn: "Korea Republic",  homeFlag: "🇰🇷",
    awayTeamKo:  "미정",     awayTeamEn: "TBD",             awayFlag: "🏳️",
    venueKo:     "미정",     venueEn:    "TBD",
    status:      "scheduled",
  },
];

// ─── D-Day 계산 유틸 ─────────────────────────────────────────────────────────
// 2026-06-11 00:00 KST = 2026-06-10 15:00 UTC
// 타임존 문자열 파싱 대신 UTC milliseconds 사용 (서버 환경 호환성 보장)

export function calcDDay(): { label: string; days: number } {
  try {
    const openingUtcMs = Date.UTC(2026, 5, 10, 15, 0, 0); // June 10 15:00 UTC
    const diffMs = openingUtcMs - Date.now();
    if (!isFinite(diffMs)) return { label: "D-?", days: 0 };
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days > 0)  return { label: `D-${days}`,       days };
    if (days === 0) return { label: "D-Day",           days: 0 };
    return          { label: `D+${Math.abs(days)}`,   days };
  } catch {
    return { label: "D-?", days: 0 };
  }
}
