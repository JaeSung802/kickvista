import type { Post, PostCategory, PostAuthor } from "./types";

// ---------------------------------------------------------------------------
// Author helpers
// ---------------------------------------------------------------------------

const AUTHORS: PostAuthor[] = [
  { id: "u001", nickname: "GoalMachine", rankBadge: "👑", rankTier: "Legend" },
  { id: "u002", nickname: "TikiTaka_Fan", rankBadge: "💎", rankTier: "Diamond" },
  { id: "u003", nickname: "PressurePressing", rankBadge: "🥇", rankTier: "Gold" },
  { id: "u004", nickname: "KickVistaAdmin", rankBadge: "👑", rankTier: "Legend", avatarUrl: undefined },
  { id: "u005", nickname: "MatchDayVibes", rankBadge: "🥈", rankTier: "Silver" },
  { id: "u006", nickname: "TransferSpy", rankBadge: "💎", rankTier: "Diamond" },
  { id: "u007", nickname: "NinetyPlus", rankBadge: "🥇", rankTier: "Gold" },
  { id: "u008", nickname: "BacklineBreaker", rankBadge: "🥉", rankTier: "Bronze" },
  { id: "u009", nickname: "xGWatcher", rankBadge: "🥈", rankTier: "Silver" },
  { id: "u010", nickname: "DeepBlock", rankBadge: "🥉", rankTier: "Bronze" },
];

/** Return a date string offset by `daysAgo` days and `hoursAgo` hours from now */
function ago(daysAgo: number, hoursAgo = 0): string {
  return new Date(Date.now() - daysAgo * 86400_000 - hoursAgo * 3600_000).toISOString();
}

// ---------------------------------------------------------------------------
// MOCK_POSTS
// ---------------------------------------------------------------------------

export const MOCK_POSTS: Post[] = [
  // 1 ── PINNED ANNOUNCEMENT
  {
    id: "post-001",
    slug: "welcome-to-kickvista-community",
    title: "Welcome to KickVista Community!",
    titleKo: "킥비스타 커뮤니티에 오신 것을 환영합니다!",
    excerpt: "Introduce yourself and join the conversation about world football.",
    excerptKo: "자기소개를 하고 세계 축구에 대한 대화에 참여해 보세요.",
    content:
      "Welcome to the KickVista Community — the place for football fans from around the world. Share match reactions, tactical breakdowns, transfer gossip, and more. Be respectful, stay on topic, and enjoy the beautiful game together!",
    contentKo:
      "킥비스타 커뮤니티에 오신 것을 환영합니다. 전 세계 축구 팬이 모이는 공간입니다. 경기 반응, 전술 분석, 이적 소식 등 무엇이든 공유하세요. 서로 존중하고, 주제에 맞게, 아름다운 스포츠를 함께 즐겨봐요!",
    category: "general",
    tags: ["announcement", "community", "welcome"],
    author: AUTHORS[3],
    viewCount: 8420,
    likeCount: 312,
    commentCount: 87,
    isPinned: true,
    isAnnouncement: true,
    createdAt: ago(7),
  },

  // 2 ── MATCH DISCUSSION – Arsenal vs Man City (fixture 1001)
  {
    id: "post-002",
    slug: "arsenal-vs-man-city-matchday-28-preview",
    title: "Arsenal vs Man City – Matchday 28 Preview & Predictions",
    titleKo: "아스널 vs 맨체스터 시티 – 28라운드 프리뷰 & 예측",
    excerpt: "Title clash at the Emirates. Can Arsenal hold their nerve at home?",
    excerptKo: "에미레이츠에서의 타이틀 대결. 아스널이 홈에서 버텨낼 수 있을까?",
    content:
      "This is the match everyone has been waiting for. Arsenal sit top of the table on 64 points, just three clear of City. Expect a high press from both sides in the opening twenty minutes. Key battle: Saka vs Gvardiol on the right flank. My prediction: 1-1, both teams cancelling each other out.",
    contentKo:
      "모두가 기다려온 경기입니다. 아스널이 64점으로 선두, 시티와 3점 차. 초반 20분 양 팀의 강한 압박이 예상됩니다. 핵심 대결: 오른쪽 측면에서 사카 vs 흐바르디올. 예측: 1-1 무승부.",
    category: "match-discussion",
    tags: ["premier-league", "arsenal", "man-city", "preview"],
    author: AUTHORS[0],
    viewCount: 5230,
    likeCount: 198,
    commentCount: 64,
    isHot: true,
    relatedLeague: "premier-league",
    relatedFixtureId: 1001,
    createdAt: ago(0, 3),
  },

  // 3 ── MATCH DISCUSSION – El Clásico (fixture 2001)
  {
    id: "post-003",
    slug: "el-clasico-real-madrid-vs-barcelona-preview",
    title: "El Clásico Preview – Real Madrid vs Barcelona",
    titleKo: "엘 클라시코 프리뷰 – 레알 마드리드 vs 바르셀로나",
    excerpt: "The biggest club fixture in world football returns. Bernabéu is ready.",
    excerptKo: "세계 최대의 클럽 경기가 돌아왔습니다. 베르나베우가 준비됐습니다.",
    content:
      "Real Madrid hold a 6-point cushion at the top but Barca have been in blistering form with five consecutive wins. Bellingham is expected to start after recovering from a knock. Tactical note: Barca's high defensive line could be vulnerable to Vinicius' pace on the counter.",
    contentKo:
      "레알 마드리드가 선두에서 6점을 앞서고 있지만 바르셀로나는 5연승으로 맹폭 중입니다. 벨링엄은 부상에서 회복해 선발 출전이 예상됩니다. 전술적 포인트: 바르사의 높은 수비 라인이 비니시우스의 역습에 취약할 수 있습니다.",
    category: "match-discussion",
    tags: ["la-liga", "real-madrid", "barcelona", "el-clasico"],
    author: AUTHORS[1],
    viewCount: 9870,
    likeCount: 441,
    commentCount: 132,
    isHot: true,
    relatedLeague: "la-liga",
    relatedFixtureId: 2001,
    createdAt: ago(0, 5),
  },

  // 4 ── TRANSFER NEWS
  {
    id: "post-004",
    slug: "transfer-rumor-bundesliga-star-premier-league",
    title: "RUMOR: Top Bundesliga Midfielder Linked with Premier League Move",
    titleKo: "루머: 분데스리가 미드필더, 프리미어리그 이적 관심",
    excerpt: "Multiple clubs reportedly monitoring the 23-year-old German international.",
    excerptKo: "여러 클럽이 23세 독일 국가대표 선수를 주시 중인 것으로 알려졌습니다.",
    content:
      "According to sources in Germany, a leading Premier League side has opened talks with the agent of a highly-rated Bundesliga midfielder. The player, 23, has registered 12 goals and 9 assists this season. His current contract expires in 2026, giving clubs leverage in negotiations. A summer move is considered likely if his form continues.",
    contentKo:
      "독일 소식통에 따르면 한 유수의 프리미어리그 클럽이 분데스리가의 주목받는 미드필더의 에이전트와 접촉을 시작했습니다. 이 23세 선수는 이번 시즌 12골 9어시스트를 기록했습니다. 현재 계약은 2026년에 만료됩니다. 폼이 지속된다면 여름 이적이 유력합니다.",
    category: "transfer-news",
    tags: ["transfer", "bundesliga", "premier-league", "rumor"],
    author: AUTHORS[5],
    viewCount: 3410,
    likeCount: 105,
    commentCount: 39,
    isHot: true,
    relatedLeague: "bundesliga",
    createdAt: ago(1, 2),
  },

  // 5 ── TACTICS
  {
    id: "post-005",
    slug: "leverkusen-3-4-3-breakdown",
    title: "How Leverkusen's 3-4-3 Press is Dominating the Bundesliga",
    titleKo: "레버쿠젠의 3-4-3 압박이 분데스리가를 지배하는 방법",
    excerpt: "A deep dive into the defensive and offensive mechanics that have kept them unbeaten.",
    excerptKo: "무패 행진을 이어가게 한 수비 및 공격 메커니즘을 심층 분석합니다.",
    content:
      "Leverkusen's 3-4-3 under their current manager relies on two key principles: positional superiority in buildup and immediate counter-press after losing the ball. The wing-backs operate in half-spaces, creating overloads. The false nine drops to link play while the inside forwards provide late runs into the box. Opposition managers have yet to find a reliable counter.",
    contentKo:
      "현 감독 체제에서 레버쿠젠의 3-4-3은 두 가지 핵심 원칙에 의존합니다: 빌드업에서의 위치적 우위와 볼 손실 직후의 즉각적인 역압박. 윙백은 하프스페이스에서 활동하며 수적 우위를 만듭니다. 페이크 나인은 연결 플레이를 위해 내려오고 인사이드 포워드는 늦은 박스 침투를 제공합니다.",
    category: "tactics",
    tags: ["bundesliga", "leverkusen", "tactics", "press", "3-4-3"],
    author: AUTHORS[2],
    viewCount: 2780,
    likeCount: 167,
    commentCount: 28,
    relatedLeague: "bundesliga",
    createdAt: ago(2),
  },

  // 6 ── HIGHLIGHTS
  {
    id: "post-006",
    slug: "psg-vs-monaco-4-2-highlights",
    title: "PSG 4-2 Monaco – Goals, Skills & Match Highlights",
    titleKo: "PSG 4-2 모나코 – 골, 개인기 & 하이라이트",
    excerpt: "PSG ran riot against Monaco in a Ligue 1 classic. Watch all the goals.",
    excerptKo: "PSG가 리그 1 클래식에서 모나코를 상대로 맹활약. 모든 골 영상.",
    content:
      "What a game at the Parc des Princes! PSG took control early with a double before half-time. Monaco pulled one back after the break but PSG answered immediately. The fourth goal was an absolute screamer from outside the box. Monaco's two goals came from set pieces — their primary attacking threat all night.",
    contentKo:
      "파르크 데 프랭스에서 대단한 경기였습니다! PSG가 전반에 2골을 넣으며 주도권을 잡았습니다. 모나코가 후반에 한 골을 만회했지만 PSG가 즉시 대답했습니다. 네 번째 골은 박스 밖에서의 환상적인 슈팅이었습니다. 모나코의 두 골은 세트피스에서 나왔습니다.",
    category: "highlights",
    tags: ["ligue-1", "psg", "monaco", "highlights"],
    author: AUTHORS[6],
    viewCount: 6100,
    likeCount: 234,
    commentCount: 51,
    isHot: true,
    relatedLeague: "ligue-1",
    relatedFixtureId: 5001,
    createdAt: ago(1),
  },

  // 7 ── PREDICTIONS
  {
    id: "post-007",
    slug: "champions-league-r16-predictions",
    title: "Champions League Round of 16 Predictions – Who Advances?",
    titleKo: "챔피언스리그 16강 예측 – 누가 진출할까?",
    excerpt: "My bracket predictions for all eight second-leg ties this week.",
    excerptKo: "이번 주 8개 2차전 모두의 브래킷 예측입니다.",
    content:
      "Real Madrid vs Man City is the tie of the round. Madrid have the home advantage but City looked threatening in the first leg. I'm going with Madrid on penalties. Arsenal should dispatch Benfica comfortably given their away goal from the first leg. Inter and Bayern are both favourites at home. Full bracket: Madrid, Arsenal, Inter, Dortmund, Bayern, PSG, Liverpool, Atletico.",
    contentKo:
      "레알 마드리드 vs 맨체스터 시티가 이번 라운드의 최고 대결입니다. 마드리드가 홈 어드밴티지를 갖고 있지만 시티도 1차전에서 위협적이었습니다. 마드리드가 승부차기로 승리할 것으로 예상합니다. 아스널은 1차전 원정 골을 바탕으로 벤피카를 편안하게 제압할 것입니다.",
    category: "predictions",
    tags: ["champions-league", "predictions", "round-of-16"],
    author: AUTHORS[8],
    viewCount: 4455,
    likeCount: 189,
    commentCount: 73,
    isHot: true,
    relatedLeague: "champions-league",
    relatedFixtureId: 6001,
    createdAt: ago(1, 6),
  },

  // 8 ── MATCH DISCUSSION – Bayern vs Dortmund (fixture 3001)
  {
    id: "post-008",
    slug: "der-klassiker-reaction-bayern-3-1-dortmund",
    title: "Der Klassiker Reaction: Bayern 3-1 Dortmund",
    titleKo: "데어 클라시커 반응: 바이에른 3-1 도르트문트",
    excerpt: "Bayern showed their class in the second half after a competitive opening.",
    excerptKo: "바이에른이 치열한 전반 이후 후반에 클래스를 보여줬습니다.",
    content:
      "Dortmund were excellent for the first 45 minutes and deservedly went into half-time level at 1-1. But Bayern turned on the style after the break. Two quick goals in a ten-minute spell killed the game. Dortmund will be disappointed — they had the quality to take something from this fixture but their defending in transition was poor.",
    contentKo:
      "도르트문트는 전반 45분 동안 훌륭했고 1-1 동점으로 하프타임을 맞이할 자격이 있었습니다. 하지만 바이에른이 후반에 스타일을 발휘했습니다. 10분 안에 두 골이 추가되며 경기가 결정됐습니다. 도르트문트는 실망했을 것입니다 — 무언가를 가져갈 품질이 있었지만 역습 수비가 좋지 않았습니다.",
    category: "match-discussion",
    tags: ["bundesliga", "bayern", "dortmund", "der-klassiker"],
    author: AUTHORS[4],
    viewCount: 3890,
    likeCount: 143,
    commentCount: 47,
    relatedLeague: "bundesliga",
    relatedFixtureId: 3001,
    createdAt: ago(3),
  },

  // 9 ── TACTICS – Inter Milan
  {
    id: "post-009",
    slug: "inter-milan-defensive-solidity-serie-a",
    title: "Why Inter Milan's Defense is the Best in Europe Right Now",
    titleKo: "왜 인터 밀란의 수비가 지금 유럽 최고인가",
    excerpt: "Only 22 goals conceded in 28 Serie A matches. The numbers are extraordinary.",
    excerptKo: "세리에 A 28경기에서 단 22실점. 놀라운 수치입니다.",
    content:
      "Inter's 3-5-2 shape creates an impenetrable mid-block that forces opponents wide. The two holding midfielders screen the back three effectively, limiting opposition shots to low-quality attempts from distance. Their pressing triggers are also well-drilled: they invite pressure then spring the trap with a coordinated press. No team has scored more than 2 goals against them this season.",
    contentKo:
      "인터의 3-5-2 포메이션은 상대를 측면으로 몰아내는 철벽 미드블록을 형성합니다. 두 명의 수비형 미드필더가 백3을 효과적으로 차단하며 원거리 저품질 슈팅만을 허용합니다. 압박 트리거도 잘 훈련되어 있습니다: 압박을 유도한 후 조직적인 압박으로 덫을 놓습니다.",
    category: "tactics",
    tags: ["serie-a", "inter-milan", "tactics", "defense"],
    author: AUTHORS[9],
    viewCount: 1950,
    likeCount: 98,
    commentCount: 19,
    relatedLeague: "serie-a",
    createdAt: ago(3, 4),
  },

  // 10 ── GENERAL
  {
    id: "post-010",
    slug: "best-stadiums-to-visit-europe",
    title: "Top 5 European Stadiums Every Football Fan Should Visit",
    titleKo: "모든 축구 팬이 방문해야 할 유럽 5대 스타디움",
    excerpt: "From the Bernabéu to Anfield — bucket list venues ranked and reviewed.",
    excerptKo: "베르나베우부터 안필드까지 — 버킷리스트 경기장 순위 및 리뷰.",
    content:
      "1. Santiago Bernabéu – the atmosphere on Champions League nights is unmatched. 2. Anfield – You'll Never Walk Alone still gives me goosebumps. 3. Allianz Arena – incredible sight at night with the illuminated exterior. 4. San Siro – history drips from every corner. 5. Parc des Princes – intimate and electric. Have you visited any of these?",
    contentKo:
      "1. 산티아고 베르나베우 – 챔피언스리그 밤 분위기는 비교불가. 2. 안필드 – 유럽 최고의 구장 분위기. 3. 알리안츠 아레나 – 야간에 조명이 켜진 외관은 믿을 수 없을 정도. 4. 산 시로 – 구석구석 역사가 녹아있음. 5. 파르크 데 프랭스 – 아늑하고 전기적인 분위기. 방문해보셨나요?",
    category: "general",
    tags: ["travel", "stadiums", "europe", "bucket-list"],
    author: AUTHORS[7],
    viewCount: 2340,
    likeCount: 76,
    commentCount: 22,
    createdAt: ago(4),
  },

  // 11 ── TRANSFER NEWS
  {
    id: "post-011",
    slug: "serie-a-star-chelsea-arsenal-interest",
    title: "Chelsea & Arsenal Both Interested in Serie A Star",
    titleKo: "첼시 & 아스널, 세리에 A 스타에 공동 관심",
    excerpt: "London rivals set for a bidding war over the Italian international striker.",
    excerptKo: "런던 라이벌이 이탈리아 국가대표 스트라이커를 두고 경쟁 입찰을 벌일 전망입니다.",
    content:
      "A Serie A striker with 18 league goals this season has attracted bids from both Chelsea and Arsenal, according to sources close to the player. The clubs are reportedly prepared to spend up to €70m. Inter Milan are reluctant to sell mid-season and would prefer to negotiate in the summer window. The player himself is believed to favour a Premier League move.",
    contentKo:
      "이번 시즌 리그 18골을 기록한 세리에 A 스트라이커가 첼시와 아스널 양측의 관심을 받고 있다는 소식입니다. 두 클럽은 7천만 유로까지 지출할 준비가 된 것으로 알려졌습니다. 인터 밀란은 시즌 중 매각에 부정적이며 여름 이적 시장 협상을 선호합니다.",
    category: "transfer-news",
    tags: ["transfer", "serie-a", "chelsea", "arsenal", "premier-league"],
    author: AUTHORS[5],
    viewCount: 4120,
    likeCount: 152,
    commentCount: 58,
    isHot: true,
    relatedLeague: "serie-a",
    createdAt: ago(2, 8),
  },

  // 12 ── PREDICTIONS – weekend fixtures
  {
    id: "post-012",
    slug: "weekend-predictions-matchday-28",
    title: "Weekend Score Predictions – Matchday 28 Across Europe",
    titleKo: "주말 스코어 예측 – 유럽 28라운드",
    excerpt: "I'm calling the scores for all the big games this weekend. Come back Monday to check my record!",
    excerptKo: "이번 주말 모든 빅 게임 스코어를 예측합니다. 월요일에 결과를 확인해 보세요!",
    content:
      "Premier League: Arsenal 1-1 Man City | Liverpool 2-0 Chelsea | Serie A: Inter 2-0 Juventus | La Liga: Real Madrid 2-1 Barcelona | Bundesliga: Leverkusen 2-1 Leipzig | Ligue 1: PSG 3-0 Marseille. Last weekend I went 4/6 — hoping to go 5/6 or better this time. Drop your own predictions in the comments!",
    contentKo:
      "프리미어리그: 아스널 1-1 맨시티 | 리버풀 2-0 첼시 | 세리에 A: 인터 2-0 유벤투스 | 라리가: 레알 마드리드 2-1 바르셀로나 | 분데스리가: 레버쿠젠 2-1 라이프치히 | 리그 1: PSG 3-0 마르세유. 지난 주말 6개 중 4개 맞췄는데 이번엔 5개 이상을 목표로 합니다. 댓글에 본인 예측도 남겨주세요!",
    category: "predictions",
    tags: ["predictions", "premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1"],
    author: AUTHORS[8],
    viewCount: 3670,
    likeCount: 121,
    commentCount: 44,
    createdAt: ago(0, 1),
  },
];

// ---------------------------------------------------------------------------
// Helper selectors
// ---------------------------------------------------------------------------

export function getMockPost(id: string): Post | undefined {
  return MOCK_POSTS.find((p) => p.id === id);
}

export function getMockPostsByCategory(category: PostCategory): Post[] {
  return MOCK_POSTS.filter((p) => p.category === category);
}
