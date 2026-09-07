/**
 * KickVista Community Seed Script — v2 (고도화)
 *
 * resetAndSeed(): 기존 시드 데이터 삭제 후 재생성
 *   - 가상 유저 15명 (고유 이메일로 중복 없이)
 *   - 사용자당 2~8개 게시글, 현실적 조회수/좋아요
 *   - 게시글 70% 확률로 1~4개 댓글 자동 생성
 *   - comment_count는 trigger가 자동 관리 (불일치 없음)
 *   - 댓글 created_at = 게시글 시간 + 5분~24시간
 *   - 게시글 40%에 썸네일 이미지
 *
 * 실행 방법:
 *   npm install -D tsx dotenv
 *   npx tsx scripts/seed-community.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// .env.local 로드
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ 환경변수 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** days일 이내 랜덤 ISO 날짜 */
function randomDate(days: number): string {
  return new Date(Date.now() - ri(0, days * 86_400_000)).toISOString();
}

/** base 시간으로부터 minMin~maxMin분 뒤 ISO 날짜 */
function dateAfter(base: string, minMin: number, maxMin: number): string {
  return new Date(new Date(base).getTime() + ri(minMin, maxMin) * 60_000).toISOString();
}

// ─── 가상 사용자 (15명) ───────────────────────────────────────────────────────

const USERS = [
  { nickname: "손흥민12번",   league: "premier-league", avatar: 10 },
  { nickname: "리버풀광팬",   league: "premier-league", avatar: 20 },
  { nickname: "레알사랑해",   league: "la-liga",        avatar: 30 },
  { nickname: "바르셀로나12", league: "la-liga",        avatar: 40 },
  { nickname: "맨시티팬",     league: "premier-league", avatar: 50 },
  { nickname: "아스날건너",   league: "premier-league", avatar: 60 },
  { nickname: "뮌헨충성단",   league: "bundesliga",     avatar: 70 },
  { nickname: "PSG파리지앵",  league: "ligue-1",        avatar: 80 },
  { nickname: "인터밀라노",   league: "serie-a",        avatar: 91 },
  { nickname: "유벤투스팬",   league: "serie-a",        avatar: 11 },
  { nickname: "첼시블루스",   league: "premier-league", avatar: 21 },
  { nickname: "BVB도르트",    league: "bundesliga",     avatar: 31 },
  { nickname: "월드컵광팬",   league: "premier-league", avatar: 41 },
  { nickname: "전술분석가",   league: "la-liga",        avatar: 51 },
  { nickname: "축구천재K",    league: "premier-league", avatar: 61 },
];

// ─── 댓글 풀 (카테고리별) ─────────────────────────────────────────────────────

const COMMENTS: Record<string, string[]> = {
  "match-discussion": [
    "ㅋㅋ 진짜 오늘 경기 미쳤다 역대급",
    "저도 봤는데 분위기 장난 아니었어요",
    "수비진이 좀 불안했지만 그래도 승리!",
    "다음 경기가 더 기대되네요 ㄷㄷ",
    "ㄹㅇ 이번 시즌 최고 퍼포먼스 아닌가요?",
    "골키퍼 실수가 좀 아쉬웠지만 결과는 OK",
    "후반 전술 교체 타이밍이 너무 좋았어요",
    "저도 직관했는데 현장 분위기 최고였음",
    "오늘 MVP는 누가 봐도 그 선수죠 ㄱㄱ",
    "상대팀 수비 라인이 너무 높았던 게 패인",
  ],
  "transfer-news": [
    "이 정도 이적료면 진짜 빅딜이네요 ㄷㄷ",
    "개인적으론 이적 안 했으면 좋겠는데...",
    "연봉 조건이 저 정도면 거절하기 힘들겠다",
    "아쉽지만 선수 입장에서는 좋은 기회겠죠",
    "사실 이미 예견된 수순 같긴 했어요",
    "그 팀 가면 주전 자리 보장은 되나요?",
    "이적료 진짜 후하게 줬네 그 정도 값어치 하나",
    "에이전트가 잘 한 것 같아요 협상력 대박",
    "팬 입장에서는 너무 아쉬운 소식이에요 ㅠ",
  ],
  "tactics": [
    "분석 진짜 꼼꼼하게 해주셨네요 👍",
    "저는 이 포메이션에 좀 회의적이긴 한데...",
    "데이터로 보니까 확실히 이해가 돼요!",
    "이런 심층 분석 좋아요 더 올려주세요",
    "현장에서 보면 또 다르게 보이더라고요",
    "미드필드 밀도 문제는 저도 항상 느꼈어요",
    "감독이 이 부분을 인지하고 있을지 모르겠네요",
    "압박 타이밍이 핵심이겠죠 역시",
  ],
  "highlights": [
    "이 골 몇 번 봐도 소름 돋음 ㄷㄷ",
    "편집 퀄리티 대박이에요 잘 봤습니다",
    "2번째 골이 진짜 최고였어요 개인적으로",
    "배경 음악 선곡도 너무 잘 맞네요 ㅋㅋ",
    "저도 직관했는데 현장에서 보면 더 짜릿함",
    "이런 거 보면 축구가 진짜 예술이다 싶어요",
  ],
  "predictions": [
    "저도 비슷하게 예측했어요 공감합니다",
    "과연 현실이 될지 두고 봐야겠네요 ㅋ",
    "홀란드 30골은 좀 과한 것 같은데... 25골?",
    "변수가 너무 많아서 예측이 쉽지 않죠",
    "작년 이맘때도 이런 예측이 많았는데 다 빗나갔잖아요",
    "그래도 근거 있는 분석이라 설득력 있네요",
    "부상 변수가 가장 크죠 솔직히",
  ],
  "worldcup-2026": [
    "한국 이번엔 진짜 해볼만 하다고 봐요!",
    "포르투갈전만 잘 버티면 16강 충분히 가능",
    "현지 가고 싶은데 비용이 만만치 않네요 ㅠ",
    "손흥민이 건강하게만 뛰어줘도 충분해요",
    "가나전 3점이 절대적으로 필요하죠",
    "북중미 대륙이라 시차 적응도 변수겠네요",
    "이번엔 조별리그 탈락하면 안 됩니다 제발 ㅠㅠ",
    "음... 생각보다 쉽지 않은 조 같은데요",
  ],
  "general": [
    "정보 감사합니다 많이 도움됐어요!",
    "저도 비슷한 고민 했었는데 공감 가네요",
    "저도 그 경기 직관했어요! 진짜 좋았죠 ㄱㄱ",
    "다음엔 같이 직관 가요 ㅋㅋ",
    "EPL 현지 경험 진짜 강추예요 꼭 가보세요",
    "오 이런 정보 처음 알았어요 감사합니다",
    "킥비스타에서 이런 정보도 얻을 수 있군요 👍",
  ],
};

// ─── 게시글 풀 ────────────────────────────────────────────────────────────────

interface PostDraft {
  category: string;
  title: string;
  content: string;
  tags: string[];
  maxViews: number;
  maxLikes: number;
  withImage?: boolean;
  teamSlug?: string;
}

const POST_POOL: PostDraft[] = [
  // worldcup-2026
  {
    category: "worldcup-2026",
    title: "2026 월드컵 조편성 최종 확정! 한국 조 분석",
    content: "드디어 2026 북중미 월드컵 조편성이 확정됐습니다. 한국은 우루과이, 포르투갈, 가나와 같은 조에 편성됐는데요. 포르투갈전이 사실상 16강 진출의 분수령이 될 것 같습니다. 다들 어떻게 보시나요? 개인적으로는 가나전 승리 + 포르투갈전 무승부면 16강 가능하다고 봅니다.",
    tags: ["월드컵2026", "조편성", "한국축구"],
    maxViews: 48, maxLikes: 9, withImage: true,
  },
  {
    category: "worldcup-2026",
    title: "한국 16강 가능성 현실적으로 분석해봤습니다",
    content: "2026 월드컵 기준 FIFA 랭킹과 최근 5경기 성적을 바탕으로 한국의 조별리그 통과 확률을 계산해봤습니다. 포르투갈 상대 승점 획득이 핵심 변수입니다. 손흥민의 컨디션과 김민재의 수비 안정감이 관건이 될 것 같네요. 여러분의 예측은 어떤가요?",
    tags: ["월드컵2026", "한국축구", "16강"],
    maxViews: 42, maxLikes: 8,
  },
  {
    category: "worldcup-2026",
    title: "북중미 월드컵 현지 관람 여행 계획 세우는 중",
    content: "처음으로 월드컵 현지 관람을 계획 중입니다. 미국 LA와 뉴욕 경기를 보고 싶은데 티켓팅 노하우나 숙소 정보 아시는 분 계신가요? 한국 경기가 어디서 열릴지 아직 모르지만 일단 미국 비자부터 준비하고 있어요.",
    tags: ["월드컵2026", "현지관람", "여행"],
    maxViews: 35, maxLikes: 6,
  },
  {
    category: "worldcup-2026",
    title: "2026 월드컵 우승 후보 TOP 5 분석",
    content: "프랑스, 잉글랜드, 브라질, 아르헨티나, 포르투갈. 개인적으로 이 다섯 팀이 2026 우승 후보라고 봅니다. 현 시점에서 프랑스 스쿼드 깊이가 압도적이고, 음바페가 다음 월드컵에서 주전으로 완전히 자리 잡으면 진짜 무서울 것 같습니다. 여러분 생각은?",
    tags: ["월드컵2026", "우승후보", "분석"],
    maxViews: 45, maxLikes: 9, withImage: true,
  },

  // match-discussion
  {
    category: "match-discussion",
    title: "손흥민 해트트릭! 토트넘 vs 첼시 북런던 라이벌전 총평",
    content: "어제 경기 정말 미쳤죠. 손흥민이 전반 2골 후반 1골로 해트트릭을 완성했고, 토트넘이 3-1로 승리했습니다. 특히 두 번째 골은 왼발 중거리인데 골키퍼가 손도 못 댔네요. 포스테코글루 감독 체제에서 드디어 안정을 찾아가는 것 같습니다.",
    tags: ["손흥민", "토트넘", "EPL"],
    maxViews: 50, maxLikes: 10, withImage: true, teamSlug: "tottenham",
  },
  {
    category: "match-discussion",
    title: "엘클라시코 5-2 결과 분석 — 레알의 완승",
    content: "레알 마드리드가 홈에서 바르셀로나를 5-2로 대파했습니다. 비니시우스 2골, 음바페 2골, 벨링엄 1골. 바르사는 야말이 1골 1도움으로 체면치레했지만 수비 라인이 너무 불안정했어요. 안첼로티가 전술적으로 바르사의 높은 수비라인을 정확히 공략했습니다.",
    tags: ["엘클라시코", "레알마드리드", "라리가"],
    maxViews: 50, maxLikes: 10, withImage: true, teamSlug: "real-madrid",
  },
  {
    category: "match-discussion",
    title: "챔피언스리그 8강 맨시티 vs 레알 1차전 리뷰",
    content: "맨시티 홈에서 2-2 무승부. 홀란드 2골로 선제 공격했지만 레알이 후반에 음바페 골로 동점을 만들었습니다. 2차전이 진짜 관건이 될 것 같아요. 과르디올라가 수비 조직을 어떻게 정비하느냐가 포인트인데, 2차전 레알 홈은 분위기 면에서 레알이 유리해 보입니다.",
    tags: ["챔피언스리그", "맨시티", "레알마드리드"],
    maxViews: 46, maxLikes: 9, teamSlug: "real-madrid",
  },
  {
    category: "match-discussion",
    title: "아스날 AS로마에게 충격패, 유로파 탈락 위기",
    content: "아스날이 홈에서 로마에게 0-1로 졌습니다. 아르테타의 로테이션 실험이 오히려 독이 됐네요. 2차전에서 아웨이에서 무조건 2골은 넣어야 하는데 로마 수비가 워낙 탄탄해서 쉽지 않아 보입니다.",
    tags: ["아스날", "유로파리그", "아르테타"],
    maxViews: 38, maxLikes: 7, teamSlug: "arsenal",
  },
  {
    category: "match-discussion",
    title: "김민재 풀타임 활약! 바이에른 클린시트 달성",
    content: "드디어 김민재가 꾸준히 선발 출전하고 있네요. 어제 도르트문트전에서 풀타임으로 뛰면서 클린시트를 기록했습니다. 특히 1대1 대결에서 높은 승률을 기록했고, 공중볼 경합도 압도적이었습니다. 분데스리가 베스트 수비수 후보로 손색없어 보여요.",
    tags: ["김민재", "바이에른뮌헨", "분데스리가"],
    maxViews: 44, maxLikes: 8, withImage: true, teamSlug: "bayern-munich",
  },

  // transfer-news
  {
    category: "transfer-news",
    title: "음바페 레알 마드리드 적응 실패? 여름 이적 가능성",
    content: "각종 유럽 매체에서 음바페의 레알 마드리드 적응 문제론이 나오고 있습니다. 골 기록 자체는 나쁘지 않지만 팀 내 케미스트리 문제와 부상 빈도가 걱정입니다. 프리미어리그 이적설도 나오고 있는데, 솔직히 레알에 남는 게 최선이라고 봅니다.",
    tags: ["음바페", "레알마드리드", "이적설"],
    maxViews: 50, maxLikes: 10, teamSlug: "real-madrid",
  },
  {
    category: "transfer-news",
    title: "손흥민 사우디 이적설 최신 업데이트",
    content: "알힐랄과 알나스르에서 손흥민 영입에 관심을 보이고 있다는 보도가 나왔습니다. 연봉 조건은 엄청나지만 손흥민 본인은 유럽 무대를 더 뛰고 싶다고 밝혔습니다. 개인적으로는 2년 더 토트넘에서 뛴 뒤 K리그로 마무리하는 게 최고의 시나리오라고 봐요.",
    tags: ["손흥민", "사우디", "이적시장"],
    maxViews: 48, maxLikes: 9, teamSlug: "tottenham",
  },
  {
    category: "transfer-news",
    title: "비르츠 여름 이적 확정? 리버풀이 유력",
    content: "플로리안 비르츠의 레버쿠젠 계약이 내년 여름 만료됩니다. 리버풀, 맨시티, 레알 마드리드가 삼파전을 벌이고 있는데 현지 보도에 따르면 리버풀이 가장 적극적이라고 합니다. 이적료는 약 1억 5천만 유로 수준으로 예상됩니다.",
    tags: ["비르츠", "리버풀", "이적시장"],
    maxViews: 43, maxLikes: 8, teamSlug: "liverpool",
  },
  {
    category: "transfer-news",
    title: "황희찬 울버햄튼 계약 만료, 빅클럽 이적 가능성",
    content: "황희찬의 울버햄튼 계약이 이번 시즌 종료와 함께 만료됩니다. 에버튼, 풀럼, 셀틱에서 관심을 보이고 있다는 보도가 있는데요. 이번 시즌 11골 7어시스트로 좋은 활약을 펼쳐온 만큼 더 좋은 팀으로 이적할 자격이 충분합니다.",
    tags: ["황희찬", "울버햄튼", "이적시장"],
    maxViews: 40, maxLikes: 7,
  },

  // tactics
  {
    category: "tactics",
    title: "과르디올라의 4-3-3 변형 압박 전술 완전 분석",
    content: "맨시티가 이번 시즌 사용하는 수정된 4-3-3 전술을 분석해봤습니다. 핵심은 홀란드가 압박의 출발점이 되는 것입니다. 기존 포제션 중심 플레이와 달리, 상대 빌드업 시 즉각적인 고압박으로 공 탈취 후 빠른 전환이 특징입니다.",
    tags: ["맨시티", "과르디올라", "전술분석"],
    maxViews: 32, maxLikes: 6, teamSlug: "man-city",
  },
  {
    category: "tactics",
    title: "아르테타의 가짜 9번 전술: 하버츠 기용의 비밀",
    content: "아르테타가 올 시즌 하버츠를 최전방에 두는 전술을 자주 사용하고 있습니다. 전통적인 센터포워드가 아닌 공간을 만들어주는 역할로 기용하면서, 양 날개가 비어있는 공간으로 파고드는 구조입니다.",
    tags: ["아스날", "아르테타", "전술분석"],
    maxViews: 28, maxLikes: 5, teamSlug: "arsenal",
  },
  {
    category: "tactics",
    title: "한국 대표팀 홍명보 감독 4-4-2 전술 검토",
    content: "홍명보 감독이 최근 4-4-2를 기본 포메이션으로 가져가고 있습니다. 손흥민과 황희찬을 투톱으로 세우는 구성인데, 문제는 미드필드 밀도가 너무 낮다는 점입니다. 여러분은 어떤 포메이션이 맞다고 보시나요?",
    tags: ["한국축구", "홍명보", "전술"],
    maxViews: 36, maxLikes: 7,
  },

  // highlights
  {
    category: "highlights",
    title: "손흥민 시즌 최고 골 TOP 10 모음 (2025-26)",
    content: "이번 시즌 손흥민의 골 중 개인적으로 뽑은 베스트 10입니다. 1위는 단연 11월 맨유전 왼발 중거리! 40미터 밖에서 때린 공이 포스트를 맞고 들어가는 그 골은 정말 압도적이었죠. 여러분의 베스트 골은 어떤 건가요?",
    tags: ["손흥민", "하이라이트", "EPL"],
    maxViews: 50, maxLikes: 10, withImage: true, teamSlug: "tottenham",
  },
  {
    category: "highlights",
    title: "2026 월드컵 예선 최고의 골 모음",
    content: "북중미 월드컵 예선에서 나온 명장면들을 정리했습니다. 브라질의 비시클킥, 아르헨티나 메시의 프리킥, 그리고 한국의 손흥민 중거리슛까지. 예선이지만 퀄리티가 본선 못지않네요.",
    tags: ["월드컵2026", "하이라이트", "골모음"],
    maxViews: 46, maxLikes: 9, withImage: true,
  },

  // predictions
  {
    category: "predictions",
    title: "챔피언스리그 우승팀 예측 — 레알 4강에서 멈출 것",
    content: "올 시즌 챔피언스리그는 맨시티가 우승할 것으로 예측합니다. 레알은 음바페의 부상 위험이 있고, 리버풀은 안타깝지만 수비가 너무 헐겁습니다. 맨시티는 홀란드를 앞세워 결승에서 바르셀로나를 꺾을 것으로 봅니다.",
    tags: ["챔피언스리그", "예측", "맨시티"],
    maxViews: 39, maxLikes: 7,
  },
  {
    category: "predictions",
    title: "이번 시즌 EPL 득점왕 예측 — 홀란드 vs 살라",
    content: "현재 시점에서 홀란드 22골, 살라 19골로 홀란드가 앞서고 있습니다. 시즌 남은 경기 수를 고려하면 홀란드의 우위가 계속될 것으로 봅니다만, 살라의 집중력은 언제나 무섭죠. 홀란드 30골-살라 28골로 예측합니다.",
    tags: ["EPL", "득점왕", "홀란드"],
    maxViews: 35, maxLikes: 6,
  },
  {
    category: "predictions",
    title: "한국 2026 월드컵 16강 확률은 몇 %일까?",
    content: "FIFA 랭킹과 최근 전적 등을 종합 분석한 결과 한국의 16강 진출 확률을 약 42%로 예측합니다. 포르투갈, 가나, 우루과이와 같은 조에서 최소 2위를 해야 하는데, 가나전 3점이 필수이고 우루과이전은 무승부도 나쁘지 않습니다.",
    tags: ["한국축구", "월드컵2026", "예측"],
    maxViews: 44, maxLikes: 8,
  },

  // general
  {
    category: "general",
    title: "해외 원정 경험 공유 — 올드 트래퍼드 직관 후기",
    content: "지난달 맨유 홈경기를 직관하고 왔습니다. 올드 트래퍼드는 생각보다 작고 오래됐지만 분위기는 정말 남달랐어요. 경기 3시간 전부터 펍에 자리 잡고 현지 팬들과 어울렸는데 정말 좋은 경험이었습니다.",
    tags: ["직관후기", "맨유", "해외원정"],
    maxViews: 30, maxLikes: 5,
  },
  {
    category: "general",
    title: "KickVista 어떻게 알게 됐나요? 사용 소감 공유",
    content: "축구 커뮤니티 찾다가 KickVista 발견했는데 생각보다 데이터가 잘 정리돼있어서 놀랐습니다. AI 경기 분석 기능이 특히 마음에 들어요. 다른 분들은 KickVista 어떻게 사용하고 계신가요?",
    tags: ["KickVista", "사이트소감", "커뮤니티"],
    maxViews: 22, maxLikes: 4,
  },
  {
    category: "general",
    title: "축구 직관 입문하려는데 추천 팀/리그 있나요?",
    content: "해외 축구를 TV로만 보다가 올해 처음으로 현지 직관을 계획하고 있습니다. 예산은 300만원 정도인데 EPL, 라리가, 분데스리가 중 어디가 제일 가성비가 좋을까요? 분위기나 접근성 모두 고려해주시면 감사합니다!",
    tags: ["직관입문", "해외여행", "추천"],
    maxViews: 25, maxLikes: 5,
  },
];

// ─── 메인: resetAndSeed ───────────────────────────────────────────────────────

async function resetAndSeed() {
  console.log("🔄 기존 시드 데이터 초기화 중...\n");

  // 1. 기존 시드 유저 조회 (seed_user_XX 패턴)
  const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const seedEmails = USERS.map((_, i) =>
    `seed_user_${String(i + 1).padStart(2, "0")}@kickvista-seed.local`
  );

  const existingEmailMap = new Map<string, string>(
    (allUsers?.users ?? [])
      .filter((u) => u.email && seedEmails.includes(u.email))
      .map((u) => [u.email!, u.id])
  );

  const existingSeedIds = [...existingEmailMap.values()];

  // 2. 기존 시드 데이터 삭제 (CASCADE → 댓글도 함께 삭제)
  if (existingSeedIds.length > 0) {
    const { error: delPostErr } = await admin
      .from("community_posts")
      .delete()
      .in("author_id", existingSeedIds);
    if (delPostErr) console.warn("  ⚠ 게시글 삭제 오류:", delPostErr.message);
    else console.log(`  🗑  기존 시드 게시글/댓글 삭제 완료`);

    const { error: delAttErr } = await admin
      .from("attendance_logs")
      .delete()
      .in("user_id", existingSeedIds);
    if (delAttErr) console.warn("  ⚠ 출석 기록 삭제 오류:", delAttErr.message);
    else console.log(`  🗑  기존 출석 기록 삭제 완료`);
  }

  console.log("\n👥 유저 생성/업데이트 중...\n");

  // 3. 유저 생성 및 프로필 업서트
  const userIds: string[] = [];

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const email = `seed_user_${String(i + 1).padStart(2, "0")}@kickvista-seed.local`;

    let userId = existingEmailMap.get(email);

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "Kickvista_seed_2026!",
        email_confirm: true,
      });
      if (error || !data.user) {
        console.error(`  ❌ ${u.nickname} 생성 실패:`, error?.message);
        continue;
      }
      userId = data.user.id;
      console.log(`  ✅ ${u.nickname} 생성 (${email})`);
    } else {
      console.log(`  ↩  ${u.nickname} 재사용 (${email})`);
    }

    userIds.push(userId);

    // 출석 일수 결정 (3~5일) — 포인트는 출석 후 합산
    const attendanceDays = ri(3, 5);
    const attendancePoints = attendanceDays * 10; // 하루 10pt

    // 프로필: BRONZE 등급 유지 (<300pt), total_points = 출석 포인트
    await admin.from("profiles").upsert(
      {
        id: userId,
        nickname: u.nickname,
        avatar_url: `https://picsum.photos/seed/kv${u.avatar}/80/80`,
        total_points: attendancePoints,   // 출석 포인트만 (브론즈 유지)
        current_streak: attendanceDays,   // 연속 출석 일수
        favorite_league: u.league,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // 출석 기록 삽입 (오늘부터 거꾸로 attendanceDays일)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 0; d < attendanceDays; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

      // 출석 시각: 해당 날짜 오전 8~11시 사이 랜덤
      const checkinTime = new Date(date);
      checkinTime.setHours(ri(8, 11), ri(0, 59), ri(0, 59));

      await admin.from("attendance_logs").upsert(
        {
          user_id:        userId,
          attendance_date: dateStr,
          points_earned:  10,
          streak_day:     d + 1,        // 오늘=1, 어제=2, ...
          created_at:     checkinTime.toISOString(),
        },
        { onConflict: "user_id,attendance_date" }
      );
    }

    console.log(`     📅 출석 ${attendanceDays}일 기록 완료 (${attendancePoints}pt / 브론즈)`);
  }

  console.log(`\n📝 게시글 및 댓글 생성 중...\n`);

  // 4. 게시글 + 댓글 삽입
  // POST_POOL을 섞어서 유저에게 2~8개씩 배분
  const shuffled = [...POST_POOL].sort(() => Math.random() - 0.5);
  let poolIdx = 0;
  let totalPosts = 0;
  let totalComments = 0;

  for (const userId of userIds) {
    const count = ri(2, 5); // 유저당 2~5개 (총 28개 풀이므로 적절히)
    const userPosts = shuffled.slice(poolIdx, poolIdx + count);
    poolIdx += count;
    if (userPosts.length === 0) break;

    for (const draft of userPosts) {
      const createdAt = randomDate(28);
      const viewCount = ri(5, draft.maxViews);
      const likeCount = ri(0, Math.min(draft.maxLikes, Math.floor(viewCount * 0.2)));
      const isHot = likeCount >= 7 && viewCount >= 35;

      // picsum 이미지 (40% 확률, 또는 withImage 플래그)
      const useImage = draft.withImage || Math.random() < 0.4;
      const imageUrl = useImage
        ? `https://picsum.photos/seed/kv${ri(100, 999)}/800/450`
        : null;

      const { data: postRow, error: postErr } = await admin
        .from("community_posts")
        .insert({
          author_id:    userId,
          category:     draft.category,
          title:        draft.title,
          content:      draft.content,
          tags:         draft.tags,
          team_slug:    draft.teamSlug ?? null,
          view_count:   viewCount,
          like_count:   likeCount,
          comment_count: 0,        // trigger가 댓글 INSERT 시 자동 관리
          is_hot:       isHot,
          is_pinned:    false,
          is_hidden:    false,
          image_url:    imageUrl,
          created_at:   createdAt,
          updated_at:   createdAt,
        })
        .select("id")
        .single();

      if (postErr || !postRow) {
        console.error(`  ❌ [${draft.category}] ${draft.title.slice(0, 25)}... 실패:`, postErr?.message);
        continue;
      }

      totalPosts++;
      console.log(`  📝 [${draft.category}] ${draft.title.slice(0, 30)}...`);

      // 5. 댓글 생성 (70% 확률로 1~4개)
      if (Math.random() < 0.7) {
        const commentCount = ri(1, 4);
        const commentPool = COMMENTS[draft.category] ?? COMMENTS["general"];
        const shuffledComments = [...commentPool].sort(() => Math.random() - 0.5);

        for (let c = 0; c < Math.min(commentCount, shuffledComments.length); c++) {
          // 댓글 작성자 = 게시글 작성자가 아닌 랜덤 다른 유저
          const otherUserIds = userIds.filter((id) => id !== userId);
          if (otherUserIds.length === 0) continue;

          const commentAuthorId = pick(otherUserIds);
          // 댓글 시간: 게시글 작성 후 5분~24시간 뒤
          const commentAt = dateAfter(createdAt, 5, 1440);

          const { error: cErr } = await admin
            .from("community_comments")
            .insert({
              post_id:    postRow.id,
              author_id:  commentAuthorId,
              content:    shuffledComments[c],
              like_count: ri(0, 3),
              is_deleted: false,
              is_hidden:  false,
              created_at: commentAt,
              updated_at: commentAt,
            });

          if (cErr) {
            console.warn(`    ⚠ 댓글 삽입 실패:`, cErr.message);
          } else {
            totalComments++;
          }
        }
      }
    }
  }

  console.log(`\n✅ 시드 완료!`);
  console.log(`   게시글 ${totalPosts}개 / 댓글 ${totalComments}개 생성`);
  console.log(`   comment_count는 trigger가 자동 동기화 완료`);
  console.log(`\n💡 Supabase Dashboard → Table Editor → community_posts 에서 확인하세요.\n`);
}

resetAndSeed().catch((e) => {
  console.error("❌ 시드 실패:", e);
  process.exit(1);
});
