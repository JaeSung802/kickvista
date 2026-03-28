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
  groupId:   "A",
  groupName: "A조",
  standings: [
    { teamKo: "멕시코",            teamEn: "Mexico",          flag: "🇲🇽", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { teamKo: "남아프리카공화국",   teamEn: "South Africa",    flag: "🇿🇦", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { teamKo: "대한민국",          teamEn: "Korea Republic",  flag: "🇰🇷", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
    { teamKo: "유럽 PO D",         teamEn: "UEFA Playoff D",  flag: "🇪🇺", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
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

// ─── 전체 조편성 ──────────────────────────────────────────────────────────────
// ⚠️ 대진 확정 후 각 조 teams 배열을 실제 데이터로 업데이트하세요.

export interface WCGroupTeam {
  nameKo: string;
  nameEn: string;
  flag:   string;
  isKorea?: boolean;
}

export interface WCGroup {
  id:    string; // "A" ~ "L"
  teams: WCGroupTeam[];
}

export const WC_GROUPS: WCGroup[] = [
  {
    id: "A",
    teams: [
      { nameKo: "멕시코",          nameEn: "Mexico",          flag: "🇲🇽" },
      { nameKo: "남아프리카공화국", nameEn: "South Africa",    flag: "🇿🇦" },
      { nameKo: "대한민국",        nameEn: "Korea Republic",  flag: "🇰🇷", isKorea: true },
      { nameKo: "유럽 PO D",       nameEn: "UEFA Playoff D",  flag: "🇪🇺" },
    ],
  },
  {
    id: "B",
    teams: [
      { nameKo: "캐나다",    nameEn: "Canada",          flag: "🇨🇦" },
      { nameKo: "유럽 PO A", nameEn: "UEFA Playoff A",  flag: "🇪🇺" },
      { nameKo: "카타르",    nameEn: "Qatar",            flag: "🇶🇦" },
      { nameKo: "스위스",    nameEn: "Switzerland",      flag: "🇨🇭" },
    ],
  },
  {
    id: "C",
    teams: [
      { nameKo: "브라질",    nameEn: "Brazil",      flag: "🇧🇷" },
      { nameKo: "모로코",    nameEn: "Morocco",     flag: "🇲🇦" },
      { nameKo: "아이티",    nameEn: "Haiti",       flag: "🇭🇹" },
      { nameKo: "스코틀랜드", nameEn: "Scotland",   flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    ],
  },
  {
    id: "D",
    teams: [
      { nameKo: "미국",      nameEn: "USA",             flag: "🇺🇸" },
      { nameKo: "파라과이",  nameEn: "Paraguay",        flag: "🇵🇾" },
      { nameKo: "호주",      nameEn: "Australia",       flag: "🇦🇺" },
      { nameKo: "유럽 PO C", nameEn: "UEFA Playoff C",  flag: "🇪🇺" },
    ],
  },
  {
    id: "E",
    teams: [
      { nameKo: "독일",        nameEn: "Germany",       flag: "🇩🇪" },
      { nameKo: "퀴라소",      nameEn: "Curaçao",       flag: "🇨🇼" },
      { nameKo: "코트디부아르", nameEn: "Ivory Coast",   flag: "🇨🇮" },
      { nameKo: "에콰도르",    nameEn: "Ecuador",       flag: "🇪🇨" },
    ],
  },
  {
    id: "F",
    teams: [
      { nameKo: "네덜란드",  nameEn: "Netherlands",     flag: "🇳🇱" },
      { nameKo: "일본",      nameEn: "Japan",           flag: "🇯🇵" },
      { nameKo: "유럽 PO B", nameEn: "UEFA Playoff B",  flag: "🇪🇺" },
      { nameKo: "튀니지",    nameEn: "Tunisia",         flag: "🇹🇳" },
    ],
  },
  {
    id: "G",
    teams: [
      { nameKo: "벨기에",   nameEn: "Belgium",     flag: "🇧🇪" },
      { nameKo: "이집트",   nameEn: "Egypt",       flag: "🇪🇬" },
      { nameKo: "이란",     nameEn: "Iran",        flag: "🇮🇷" },
      { nameKo: "뉴질랜드", nameEn: "New Zealand", flag: "🇳🇿" },
    ],
  },
  {
    id: "H",
    teams: [
      { nameKo: "스페인",        nameEn: "Spain",         flag: "🇪🇸" },
      { nameKo: "카보베르데",    nameEn: "Cape Verde",    flag: "🇨🇻" },
      { nameKo: "사우디아라비아", nameEn: "Saudi Arabia", flag: "🇸🇦" },
      { nameKo: "우루과이",      nameEn: "Uruguay",       flag: "🇺🇾" },
    ],
  },
  {
    id: "I",
    teams: [
      { nameKo: "프랑스",      nameEn: "France",       flag: "🇫🇷" },
      { nameKo: "세네갈",      nameEn: "Senegal",      flag: "🇸🇳" },
      { nameKo: "FIFA PO 2",   nameEn: "FIFA Playoff 2", flag: "🏳️" },
      { nameKo: "노르웨이",    nameEn: "Norway",       flag: "🇳🇴" },
    ],
  },
  {
    id: "J",
    teams: [
      { nameKo: "아르헨티나", nameEn: "Argentina", flag: "🇦🇷" },
      { nameKo: "알제리",     nameEn: "Algeria",   flag: "🇩🇿" },
      { nameKo: "오스트리아", nameEn: "Austria",   flag: "🇦🇹" },
      { nameKo: "요르단",     nameEn: "Jordan",    flag: "🇯🇴" },
    ],
  },
  {
    id: "K",
    teams: [
      { nameKo: "포르투갈",    nameEn: "Portugal",       flag: "🇵🇹" },
      { nameKo: "FIFA PO 1",   nameEn: "FIFA Playoff 1", flag: "🏳️" },
      { nameKo: "우즈베키스탄", nameEn: "Uzbekistan",    flag: "🇺🇿" },
      { nameKo: "콜롬비아",    nameEn: "Colombia",       flag: "🇨🇴" },
    ],
  },
  {
    id: "L",
    teams: [
      { nameKo: "잉글랜드",   nameEn: "England",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { nameKo: "크로아티아", nameEn: "Croatia",  flag: "🇭🇷" },
      { nameKo: "가나",       nameEn: "Ghana",    flag: "🇬🇭" },
      { nameKo: "파나마",     nameEn: "Panama",   flag: "🇵🇦" },
    ],
  },
];

// ─── 조별 경기 일정 ───────────────────────────────────────────────────────────

export interface WCScheduleMatch {
  dateLabel: string; // "6/12 (금)"
  timeKst:   string; // "04:00"
  homeKo:    string;
  homeFlag:  string;
  awayKo:    string;
  awayFlag:  string;
  venueKo:   string;
  round:     1 | 2 | 3;
}

export const WC_SCHEDULE: Record<string, WCScheduleMatch[]> = {
  A: [
    { dateLabel: "6/12 (금)", timeKst: "04:00", homeKo: "멕시코",          homeFlag: "🇲🇽", awayKo: "남아프리카공화국", awayFlag: "🇿🇦", venueKo: "멕시코시티",  round: 1 },
    { dateLabel: "6/12 (금)", timeKst: "11:00", homeKo: "대한민국",         homeFlag: "🇰🇷", awayKo: "유럽 PO D",       awayFlag: "🇪🇺", venueKo: "과달라하라",  round: 1 },
    { dateLabel: "6/19 (금)", timeKst: "01:00", homeKo: "유럽 PO D",        homeFlag: "🇪🇺", awayKo: "남아프리카공화국", awayFlag: "🇿🇦", venueKo: "애틀랜타",   round: 2 },
    { dateLabel: "6/19 (금)", timeKst: "10:00", homeKo: "멕시코",           homeFlag: "🇲🇽", awayKo: "대한민국",        awayFlag: "🇰🇷", venueKo: "과달라하라",  round: 2 },
    { dateLabel: "6/25 (목)", timeKst: "10:00", homeKo: "유럽 PO D",        homeFlag: "🇪🇺", awayKo: "멕시코",          awayFlag: "🇲🇽", venueKo: "멕시코시티",  round: 3 },
    { dateLabel: "6/25 (목)", timeKst: "10:00", homeKo: "남아프리카공화국", homeFlag: "🇿🇦", awayKo: "대한민국",        awayFlag: "🇰🇷", venueKo: "몬테레이",   round: 3 },
  ],
  B: [
    { dateLabel: "6/13 (토)", timeKst: "04:00", homeKo: "캐나다",   homeFlag: "🇨🇦", awayKo: "유럽 PO A", awayFlag: "🇪🇺", venueKo: "토론토",       round: 1 },
    { dateLabel: "6/14 (일)", timeKst: "04:00", homeKo: "카타르",   homeFlag: "🇶🇦", awayKo: "스위스",   awayFlag: "🇨🇭", venueKo: "샌프란시스코", round: 1 },
    { dateLabel: "6/19 (금)", timeKst: "04:00", homeKo: "스위스",   homeFlag: "🇨🇭", awayKo: "유럽 PO A", awayFlag: "🇪🇺", venueKo: "로스앤젤레스", round: 2 },
    { dateLabel: "6/19 (금)", timeKst: "07:00", homeKo: "캐나다",   homeFlag: "🇨🇦", awayKo: "카타르",   awayFlag: "🇶🇦", venueKo: "밴쿠버",       round: 2 },
    { dateLabel: "6/25 (목)", timeKst: "04:00", homeKo: "스위스",   homeFlag: "🇨🇭", awayKo: "캐나다",   awayFlag: "🇨🇦", venueKo: "밴쿠버",       round: 3 },
    { dateLabel: "6/25 (목)", timeKst: "04:00", homeKo: "유럽 PO A", homeFlag: "🇪🇺", awayKo: "카타르",  awayFlag: "🇶🇦", venueKo: "시애틀",       round: 3 },
  ],
  C: [
    { dateLabel: "6/14 (일)", timeKst: "07:00", homeKo: "브라질",    homeFlag: "🇧🇷", awayKo: "모로코",    awayFlag: "🇲🇦", venueKo: "뉴욕",       round: 1 },
    { dateLabel: "6/14 (일)", timeKst: "10:00", homeKo: "아이티",    homeFlag: "🇭🇹", awayKo: "스코틀랜드", awayFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", venueKo: "보스턴",     round: 1 },
    { dateLabel: "6/20 (토)", timeKst: "07:00", homeKo: "스코틀랜드", homeFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", awayKo: "모로코",    awayFlag: "🇲🇦", venueKo: "보스턴",     round: 2 },
    { dateLabel: "6/20 (토)", timeKst: "10:00", homeKo: "브라질",    homeFlag: "🇧🇷", awayKo: "아이티",    awayFlag: "🇭🇹", venueKo: "필라델피아", round: 2 },
    { dateLabel: "6/25 (목)", timeKst: "07:00", homeKo: "스코틀랜드", homeFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", awayKo: "브라질",    awayFlag: "🇧🇷", venueKo: "마이애미",   round: 3 },
    { dateLabel: "6/25 (목)", timeKst: "07:00", homeKo: "모로코",    homeFlag: "🇲🇦", awayKo: "아이티",    awayFlag: "🇭🇹", venueKo: "애틀랜타",   round: 3 },
  ],
  D: [
    { dateLabel: "6/13 (토)", timeKst: "10:00", homeKo: "미국",      homeFlag: "🇺🇸", awayKo: "파라과이",   awayFlag: "🇵🇾", venueKo: "로스앤젤레스", round: 1 },
    { dateLabel: "6/14 (일)", timeKst: "13:00", homeKo: "호주",      homeFlag: "🇦🇺", awayKo: "유럽 PO C",  awayFlag: "🇪🇺", venueKo: "밴쿠버",       round: 1 },
    { dateLabel: "6/20 (토)", timeKst: "04:00", homeKo: "미국",      homeFlag: "🇺🇸", awayKo: "호주",       awayFlag: "🇦🇺", venueKo: "시애틀",       round: 2 },
    { dateLabel: "6/20 (토)", timeKst: "13:00", homeKo: "유럽 PO C", homeFlag: "🇪🇺", awayKo: "파라과이",   awayFlag: "🇵🇾", venueKo: "샌프란시스코", round: 2 },
    { dateLabel: "6/26 (금)", timeKst: "11:00", homeKo: "유럽 PO C", homeFlag: "🇪🇺", awayKo: "미국",       awayFlag: "🇺🇸", venueKo: "로스앤젤레스", round: 3 },
    { dateLabel: "6/26 (금)", timeKst: "11:00", homeKo: "파라과이",  homeFlag: "🇵🇾", awayKo: "호주",       awayFlag: "🇦🇺", venueKo: "샌프란시스코", round: 3 },
  ],
  E: [
    { dateLabel: "6/15 (월)", timeKst: "02:00", homeKo: "독일",        homeFlag: "🇩🇪", awayKo: "퀴라소",      awayFlag: "🇨🇼", venueKo: "휴스턴",     round: 1 },
    { dateLabel: "6/15 (월)", timeKst: "08:00", homeKo: "코트디부아르", homeFlag: "🇨🇮", awayKo: "에콰도르",    awayFlag: "🇪🇨", venueKo: "필라델피아", round: 1 },
    { dateLabel: "6/21 (일)", timeKst: "05:00", homeKo: "독일",        homeFlag: "🇩🇪", awayKo: "코트디부아르", awayFlag: "🇨🇮", venueKo: "토론토",     round: 2 },
    { dateLabel: "6/21 (일)", timeKst: "09:00", homeKo: "에콰도르",    homeFlag: "🇪🇨", awayKo: "퀴라소",      awayFlag: "🇨🇼", venueKo: "캔자스시티", round: 2 },
    { dateLabel: "6/26 (금)", timeKst: "05:00", homeKo: "퀴라소",      homeFlag: "🇨🇼", awayKo: "코트디부아르", awayFlag: "🇨🇮", venueKo: "필라델피아", round: 3 },
    { dateLabel: "6/26 (금)", timeKst: "05:00", homeKo: "에콰도르",    homeFlag: "🇪🇨", awayKo: "독일",        awayFlag: "🇩🇪", venueKo: "뉴욕",       round: 3 },
  ],
  F: [
    { dateLabel: "6/15 (월)", timeKst: "05:00", homeKo: "네덜란드",  homeFlag: "🇳🇱", awayKo: "일본",      awayFlag: "🇯🇵", venueKo: "댈러스",    round: 1 },
    { dateLabel: "6/15 (월)", timeKst: "11:00", homeKo: "유럽 PO B", homeFlag: "🇪🇺", awayKo: "튀니지",    awayFlag: "🇹🇳", venueKo: "몬테레이",  round: 1 },
    { dateLabel: "6/21 (일)", timeKst: "02:00", homeKo: "네덜란드",  homeFlag: "🇳🇱", awayKo: "유럽 PO B", awayFlag: "🇪🇺", venueKo: "휴스턴",    round: 2 },
    { dateLabel: "6/21 (일)", timeKst: "13:00", homeKo: "튀니지",    homeFlag: "🇹🇳", awayKo: "일본",      awayFlag: "🇯🇵", venueKo: "몬테레이",  round: 2 },
    { dateLabel: "6/26 (금)", timeKst: "08:00", homeKo: "일본",      homeFlag: "🇯🇵", awayKo: "유럽 PO B", awayFlag: "🇪🇺", venueKo: "댈러스",    round: 3 },
    { dateLabel: "6/26 (금)", timeKst: "08:00", homeKo: "튀니지",    homeFlag: "🇹🇳", awayKo: "네덜란드",  awayFlag: "🇳🇱", venueKo: "캔자스시티", round: 3 },
  ],
  G: [
    { dateLabel: "6/16 (화)", timeKst: "04:00", homeKo: "벨기에",   homeFlag: "🇧🇪", awayKo: "이집트",   awayFlag: "🇪🇬", venueKo: "시애틀",       round: 1 },
    { dateLabel: "6/16 (화)", timeKst: "10:00", homeKo: "이란",     homeFlag: "🇮🇷", awayKo: "뉴질랜드", awayFlag: "🇳🇿", venueKo: "로스앤젤레스", round: 1 },
    { dateLabel: "6/22 (월)", timeKst: "04:00", homeKo: "벨기에",   homeFlag: "🇧🇪", awayKo: "이란",     awayFlag: "🇮🇷", venueKo: "로스앤젤레스", round: 2 },
    { dateLabel: "6/22 (월)", timeKst: "10:00", homeKo: "뉴질랜드", homeFlag: "🇳🇿", awayKo: "이집트",   awayFlag: "🇪🇬", venueKo: "밴쿠버",       round: 2 },
    { dateLabel: "6/27 (토)", timeKst: "12:00", homeKo: "이집트",   homeFlag: "🇪🇬", awayKo: "이란",     awayFlag: "🇮🇷", venueKo: "시애틀",       round: 3 },
    { dateLabel: "6/27 (토)", timeKst: "12:00", homeKo: "뉴질랜드", homeFlag: "🇳🇿", awayKo: "벨기에",   awayFlag: "🇧🇪", venueKo: "밴쿠버",       round: 3 },
  ],
  H: [
    { dateLabel: "6/16 (화)", timeKst: "01:00", homeKo: "스페인",        homeFlag: "🇪🇸", awayKo: "카보베르데",    awayFlag: "🇨🇻", venueKo: "애틀랜타",  round: 1 },
    { dateLabel: "6/16 (화)", timeKst: "07:00", homeKo: "사우디아라비아", homeFlag: "🇸🇦", awayKo: "우루과이",      awayFlag: "🇺🇾", venueKo: "마이애미",  round: 1 },
    { dateLabel: "6/22 (월)", timeKst: "01:00", homeKo: "스페인",        homeFlag: "🇪🇸", awayKo: "사우디아라비아", awayFlag: "🇸🇦", venueKo: "애틀랜타",  round: 2 },
    { dateLabel: "6/22 (월)", timeKst: "07:00", homeKo: "우루과이",      homeFlag: "🇺🇾", awayKo: "카보베르데",    awayFlag: "🇨🇻", venueKo: "마이애미",  round: 2 },
    { dateLabel: "6/27 (토)", timeKst: "09:00", homeKo: "카보베르데",    homeFlag: "🇨🇻", awayKo: "사우디아라비아", awayFlag: "🇸🇦", venueKo: "휴스턴",    round: 3 },
    { dateLabel: "6/27 (토)", timeKst: "09:00", homeKo: "우루과이",      homeFlag: "🇺🇾", awayKo: "스페인",        awayFlag: "🇪🇸", venueKo: "과달라하라", round: 3 },
  ],
  I: [
    { dateLabel: "6/17 (수)", timeKst: "04:00", homeKo: "프랑스",    homeFlag: "🇫🇷", awayKo: "세네갈",    awayFlag: "🇸🇳", venueKo: "뉴욕",       round: 1 },
    { dateLabel: "6/17 (수)", timeKst: "07:00", homeKo: "FIFA PO 2", homeFlag: "🏳️", awayKo: "노르웨이",  awayFlag: "🇳🇴", venueKo: "보스턴",     round: 1 },
    { dateLabel: "6/23 (화)", timeKst: "06:00", homeKo: "프랑스",    homeFlag: "🇫🇷", awayKo: "FIFA PO 2", awayFlag: "🏳️", venueKo: "필라델피아", round: 2 },
    { dateLabel: "6/23 (화)", timeKst: "09:00", homeKo: "노르웨이",  homeFlag: "🇳🇴", awayKo: "세네갈",    awayFlag: "🇸🇳", venueKo: "뉴욕",       round: 2 },
    { dateLabel: "6/27 (토)", timeKst: "04:00", homeKo: "노르웨이",  homeFlag: "🇳🇴", awayKo: "프랑스",    awayFlag: "🇫🇷", venueKo: "보스턴",     round: 3 },
    { dateLabel: "6/27 (토)", timeKst: "04:00", homeKo: "세네갈",    homeFlag: "🇸🇳", awayKo: "FIFA PO 2", awayFlag: "🏳️", venueKo: "토론토",     round: 3 },
  ],
  J: [
    { dateLabel: "6/17 (수)", timeKst: "10:00", homeKo: "아르헨티나", homeFlag: "🇦🇷", awayKo: "알제리",   awayFlag: "🇩🇿", venueKo: "캔자스시티", round: 1 },
    { dateLabel: "6/17 (수)", timeKst: "13:00", homeKo: "오스트리아", homeFlag: "🇦🇹", awayKo: "요르단",   awayFlag: "🇯🇴", venueKo: "샌프란시스코", round: 1 },
    { dateLabel: "6/23 (화)", timeKst: "02:00", homeKo: "아르헨티나", homeFlag: "🇦🇷", awayKo: "오스트리아", awayFlag: "🇦🇹", venueKo: "댈러스",   round: 2 },
    { dateLabel: "6/23 (화)", timeKst: "12:00", homeKo: "요르단",    homeFlag: "🇯🇴", awayKo: "알제리",   awayFlag: "🇩🇿", venueKo: "샌프란시스코", round: 2 },
    { dateLabel: "6/28 (일)", timeKst: "11:00", homeKo: "알제리",    homeFlag: "🇩🇿", awayKo: "오스트리아", awayFlag: "🇦🇹", venueKo: "캔자스시티", round: 3 },
    { dateLabel: "6/28 (일)", timeKst: "11:00", homeKo: "요르단",    homeFlag: "🇯🇴", awayKo: "아르헨티나", awayFlag: "🇦🇷", venueKo: "댈러스",   round: 3 },
  ],
  K: [
    { dateLabel: "6/18 (목)", timeKst: "02:00", homeKo: "포르투갈",    homeFlag: "🇵🇹", awayKo: "FIFA PO 1",  awayFlag: "🏳️", venueKo: "휴스턴",    round: 1 },
    { dateLabel: "6/18 (목)", timeKst: "11:00", homeKo: "우즈베키스탄", homeFlag: "🇺🇿", awayKo: "콜롬비아",   awayFlag: "🇨🇴", venueKo: "멕시코시티", round: 1 },
    { dateLabel: "6/24 (수)", timeKst: "02:00", homeKo: "포르투갈",    homeFlag: "🇵🇹", awayKo: "우즈베키스탄", awayFlag: "🇺🇿", venueKo: "휴스턴",    round: 2 },
    { dateLabel: "6/24 (수)", timeKst: "11:00", homeKo: "콜롬비아",    homeFlag: "🇨🇴", awayKo: "FIFA PO 1",  awayFlag: "🏳️", venueKo: "과달라하라", round: 2 },
    { dateLabel: "6/28 (일)", timeKst: "08:30", homeKo: "콜롬비아",    homeFlag: "🇨🇴", awayKo: "포르투갈",   awayFlag: "🇵🇹", venueKo: "마이애미",  round: 3 },
    { dateLabel: "6/28 (일)", timeKst: "08:30", homeKo: "FIFA PO 1",   homeFlag: "🏳️", awayKo: "우즈베키스탄", awayFlag: "🇺🇿", venueKo: "애틀랜타",  round: 3 },
  ],
  L: [
    { dateLabel: "6/18 (목)", timeKst: "05:00", homeKo: "잉글랜드",   homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayKo: "크로아티아", awayFlag: "🇭🇷", venueKo: "댈러스",    round: 1 },
    { dateLabel: "6/18 (목)", timeKst: "08:00", homeKo: "가나",       homeFlag: "🇬🇭", awayKo: "파나마",    awayFlag: "🇵🇦", venueKo: "토론토",    round: 1 },
    { dateLabel: "6/24 (수)", timeKst: "05:00", homeKo: "잉글랜드",   homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayKo: "가나",      awayFlag: "🇬🇭", venueKo: "보스턴",    round: 2 },
    { dateLabel: "6/24 (수)", timeKst: "08:00", homeKo: "파나마",     homeFlag: "🇵🇦", awayKo: "크로아티아", awayFlag: "🇭🇷", venueKo: "토론토",    round: 2 },
    { dateLabel: "6/28 (일)", timeKst: "06:00", homeKo: "파나마",     homeFlag: "🇵🇦", awayKo: "잉글랜드",  awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", venueKo: "뉴욕",      round: 3 },
    { dateLabel: "6/28 (일)", timeKst: "06:00", homeKo: "크로아티아", homeFlag: "🇭🇷", awayKo: "가나",      awayFlag: "🇬🇭", venueKo: "필라델피아", round: 3 },
  ],
};

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
