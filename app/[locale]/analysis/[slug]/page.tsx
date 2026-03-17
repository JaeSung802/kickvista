import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/jsonld";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import AdSlot from "@/components/ads/AdSlot";

// ─── Mock article database ────────────────────────────────────────────────────

const ARTICLES: Record<
  string,
  {
    titleEn: string;
    titleKo: string;
    descriptionEn: string;
    descriptionKo: string;
    publishedAt: string;
    type: "preview" | "recap";
    league: string;
    leagueKo: string;
    leagueFlag: string;
    homeTeam: string;
    homeTeamKo: string;
    homeFlag: string;
    awayTeam: string;
    awayTeamKo: string;
    awayFlag: string;
    matchDate: string;
    prediction: { outcome: string; outcomeKo: string; confidence: number };
    keyFactorsEn: string[];
    keyFactorsKo: string[];
    bodyEn: string[];
    bodyKo: string[];
    tips: { label: string; labelKo: string }[];
    aiModel: string;
  }
> = {
  "arsenal-man-city-preview": {
    titleEn: "Arsenal vs Man City: Title Six-Pointer — Full AI Preview",
    titleKo: "아스날 vs 맨시티: 우승 직결 빅매치 — AI 완전 프리뷰",
    descriptionEn:
      "Full AI-powered preview of the Emirates title six-pointer between Arsenal and Manchester City in the Premier League.",
    descriptionKo:
      "에미레이츠에서 펼쳐지는 아스날 vs 맨시티 프리미어리그 우승 직결 빅매치 AI 프리뷰.",
    publishedAt: "2026-03-14T09:00:00Z",
    type: "preview",
    league: "Premier League",
    leagueKo: "프리미어리그",
    leagueFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    homeTeam: "Arsenal",
    homeTeamKo: "아스날",
    homeFlag: "🔴",
    awayTeam: "Man City",
    awayTeamKo: "맨체스터 시티",
    awayFlag: "🔵",
    matchDate: "2026-03-16T16:30:00Z",
    prediction: { outcome: "Arsenal Win", outcomeKo: "아스날 승리", confidence: 68 },
    keyFactorsEn: [
      "Arsenal have won 7 of their last 8 home league games",
      "Man City concede an average of 0.9 goals per away game in 2026",
      "Saka has 6 goal contributions in his last 4 home matches",
      "City's press intensity drops by 18% in the second half",
      "Head-to-head at Emirates: Arsenal W4 D2 L2 in last 8",
    ],
    keyFactorsKo: [
      "아스날, 최근 8경기 홈 리그에서 7승",
      "맨시티, 2026년 원정 경기 평균 0.9실점",
      "사카, 최근 4경기 홈 매치에서 6개 공격 포인트",
      "시티의 압박 강도, 후반전 18% 감소",
      "에미레이츠 맞대결: 아스날 4승 2무 2패 (최근 8경기)",
    ],
    bodyEn: [
      "Arsenal enter this must-win clash on a seven-game Premier League winning streak, powered by Bukayo Saka's extraordinary 2026 campaign — 14 goals and 11 assists across all competitions. Mikel Arteta has evolved his side into one of the most complete teams in European football, capable of playing with the ball and without it at the highest level.",
      "Manchester City arrive at the Emirates sitting just one point behind in the table, with Pep Guardiola's trademark tactical flexibility on full display. City have adjusted their high-press structure to a more conservative 4-2-3-1 shape in recent away matches, conceding fewer counter-attacks but sacrificing some of the vertical momentum that makes them so dangerous.",
      "The key individual battle will be decided in midfield. Declan Rice, who has evolved into the complete box-to-box midfielder this season, faces Rodri in what promises to be a fascinating tactical chess match. Rice's ability to win second balls and immediately progress play will be tested by Rodri's metronomic control and ability to dictate tempo.",
      "Defensively, Arsenal have been exceptional at home. Gabriel and Ben White have formed a cohesive partnership that has kept six clean sheets in eight home league starts. City will look to exploit the wide areas with Bernardo Silva drifting inside to create numerical advantages in the half-spaces — a pattern Arteta's coaching team will have spent the week planning to neutralise.",
      "Our AI model processed 412 structured data points including xG history across 40 matches, squad fatigue indices, pressing metrics and set-piece threat analysis. The model returns a 68% confidence rating for an Arsenal home win — the highest probability outcome, though City's quality ensures this remains a genuinely open contest. Saka carries a 38% probability of scoring, the highest of any individual player in the match.",
    ],
    bodyKo: [
      "아스날은 부카요 사카의 2026년 눈부신 활약(전체 대회 14골 11어시스트)을 앞세워 7연승으로 이번 필승 경기에 임합니다. 미켈 아르테타 감독은 팀을 볼 소유와 비소유 양면에서 유럽 최고 수준의 완성형 팀으로 끌어올렸습니다.",
      "맨체스터 시티는 선두와 단 1점 차로 에미레이츠를 찾습니다. 펩 과르디올라는 최근 원정 경기에서 고전적인 하이프레스 대신 보다 보수적인 4-2-3-1 포메이션으로 전환, 역습은 줄였지만 수직적 추진력도 다소 낮아졌습니다.",
      "핵심 개인 대결은 중원에서 펼쳐집니다. 이 시즌 완성형 박스투박스 미드필더로 성장한 데클란 라이스와 로드리의 전술 체스 매치가 경기의 향방을 결정할 것입니다. 로드리의 메트로놈 같은 템포 장악에 맞서 라이스가 세컨볼 다툼과 빠른 전개를 얼마나 이어가느냐가 관건입니다.",
      "수비 면에서 아스날의 홈 성적은 탁월합니다. 가브리엘과 벤 화이트 조합은 8번의 홈 리그 선발 중 6번의 클린시트를 기록했습니다. 시티는 베르나르도 실바를 안쪽으로 침투시켜 하프스페이스에서 수적 우위를 만들려 할 것이며, 아르테타 코칭 스태프는 이 패턴을 차단하기 위한 한 주를 보냈을 것입니다.",
      "AI 모델은 40경기의 xG 이력, 선수단 피로 지수, 압박 지표, 세트피스 위협 분석 등 412개 구조화 데이터 포인트를 처리했습니다. 아스날 홈 승리에 68% 신뢰도를 부여하며, 사카가 38%의 득점 확률로 가장 유력한 득점자로 지목됐습니다.",
    ],
    tips: [
      { label: "Arsenal Win", labelKo: "아스날 승리" },
      { label: "Both Teams to Score", labelKo: "양팀 득점" },
      { label: "Over 2.5 Goals", labelKo: "2.5골 오버" },
      { label: "Saka Anytime Scorer", labelKo: "사카 득점" },
      { label: "Over 9 Corners", labelKo: "코너킥 9개 이상" },
    ],
    aiModel: "KickVista AI v2",
  },

  "el-clasico-preview": {
    titleEn: "El Clásico 2026: Tactical Deep-Dive — Real Madrid vs Barcelona",
    titleKo: "엘 클라시코 2026 전술 심층 분석 — 레알 마드리드 vs 바르셀로나",
    descriptionEn:
      "Full tactical breakdown of El Clásico 2026 featuring AI match prediction, key player battles and set-piece analysis.",
    descriptionKo:
      "2026 엘 클라시코 전술 완전 분석 — AI 경기 예측, 핵심 선수 매치업 및 세트피스 분석.",
    publishedAt: "2026-03-13T14:00:00Z",
    type: "preview",
    league: "La Liga",
    leagueKo: "라리가",
    leagueFlag: "🇪🇸",
    homeTeam: "Real Madrid",
    homeTeamKo: "레알 마드리드",
    homeFlag: "⚪",
    awayTeam: "Barcelona",
    awayTeamKo: "FC 바르셀로나",
    awayFlag: "🔵",
    matchDate: "2026-03-15T19:00:00Z",
    prediction: { outcome: "Draw", outcomeKo: "무승부", confidence: 48 },
    keyFactorsEn: [
      "Vinícius Jr. has scored in 4 of last 5 Clásicos",
      "Lamine Yamal: 9 La Liga goals and 8 assists this season",
      "Real Madrid score 31% of their goals from set pieces (La Liga high)",
      "Barcelona concede 24% of goals from dead-ball situations",
      "Last 6 Clásicos at the Bernabéu: 2W 3D 1L for Madrid",
    ],
    keyFactorsKo: [
      "비니시우스, 최근 5경기 클라시코 중 4경기 득점",
      "라민 야말: 이 시즌 라리가 9골 8어시스트",
      "레알 마드리드, 세트피스 득점률 31% (라리가 최고)",
      "바르셀로나, 데드볼 실점률 24%",
      "베르나베우에서 열린 최근 6 클라시코: 마드리드 2승 3무 1패",
    ],
    bodyEn: [
      "The 297th edition of El Clásico arrives at a moment of maximum tension. Separated by just two points at the top of La Liga — Barcelona edging ahead on goal difference — the psychological stakes could not be higher. A Madrid win would put them level; a Barcelona win would open a five-point gap with just eight games remaining.",
      "Carlo Ancelotti's Real Madrid are battle-hardened but have shown vulnerabilities on the counter-attack against high-energy pressing sides. Barcelona under Hansi Flick have embraced a more structured 4-2-3-1 shape, with Pedri pulling strings from a deeper position than in recent seasons, allowing Lamine Yamal and Raphinha to express themselves in wider areas.",
      "The Vinícius Jr. vs Lamine Yamal duel is the marquee individual contest. Yamal, at just 18, has already posted nine La Liga goals and eight assists, making him statistically the most impactful teenage player in the competition's history for this stage of a season. Vinícius has been directly involved in 22 goals from the left flank and will back himself to exploit whatever space the Barcelona right-back leaves.",
      "Set-piece danger is a key variable that could prove decisive. Real Madrid score 31% of their La Liga goals from set pieces — the highest rate in the division — while Barcelona concede at a worryingly high 24% rate from dead-ball situations. Luka Modric's delivery and Jude Bellingham's movement at the near post represent a clear and present danger.",
      "Our AI assigns a 48% probability to a draw outcome — the highest of the three options — reflecting the genuine balance of quality between these sides. A Madrid win carries 29% probability and a Barcelona win 23%. However, in matches of this magnitude, the team that manages emotional intensity better tends to find a way. The model identifies a first-half goal as the single most likely match event.",
    ],
    bodyKo: [
      "297번째 엘 클라시코가 최대 긴장의 순간에 열립니다. 득실차로 앞선 바르셀로나가 2점 차 선두를 유지하는 가운데, 마드리드가 이기면 동률이 되고 바르셀로나가 이기면 8경기를 남긴 시점에서 5점 차로 벌어집니다.",
      "카를로 안첼로티의 레알 마드리드는 역전의 용사지만 고강도 프레싱 팀의 역습에 취약점을 드러낸 바 있습니다. 한지 플리크 감독 하의 바르셀로나는 더 구조화된 4-2-3-1을 구사하며, 페드리가 깊은 위치에서 경기를 조율해 라민 야말과 라피냐가 넓은 공간에서 자유를 누립니다.",
      "비니시우스 주니오르 vs 라민 야말 대결이 이번 경기의 꽃입니다. 불과 18세의 야말은 이미 라리가 9골 8어시스트를 기록하며 역대 이 시점 최고의 10대 선수 통계를 세우고 있습니다. 비니시우스는 왼쪽에서 22개의 공격 포인트를 올리며 바르셀로나 오른쪽 풀백이 남기는 공간을 노리고 있습니다.",
      "세트피스 위협은 경기를 결정지을 수 있는 핵심 변수입니다. 레알 마드리드는 라리가에서 31%의 세트피스 득점률로 리그 최고를 기록 중인 반면, 바르셀로나는 데드볼 상황에서 24%의 우려스러운 실점률을 보입니다. 루카 모드리치의 킥과 주드 벨링엄의 니어포스트 움직임이 직접적인 위협이 됩니다.",
      "AI는 무승부 확률을 48%로 산정하며 세 가지 결과 중 가장 높은 수치를 보였습니다. 마드리드 승리 29%, 바르셀로나 승리 23%입니다. 전반전 득점이 가장 가능성 높은 단일 이벤트로 지목됐습니다.",
    ],
    tips: [
      { label: "Both Teams to Score", labelKo: "양팀 득점" },
      { label: "Draw at HT", labelKo: "전반전 무승부" },
      { label: "Over 10 Corners", labelKo: "코너킥 10개 이상" },
      { label: "Yamal Anytime Scorer", labelKo: "야말 득점" },
    ],
    aiModel: "KickVista AI v2",
  },

  "bundesliga-recap": {
    titleEn: "Bundesliga Recap: Bayern Overpower Leverkusen 3-1 to Reclaim Top Spot",
    titleKo: "분데스리가 리캡: 바이에른, 레버쿠젠 3-1 격파로 선두 탈환",
    descriptionEn:
      "Bayern Munich edged past Bayer Leverkusen in a crucial Bundesliga title clash to retake first place with five games remaining.",
    descriptionKo:
      "바이에른 뮌헨이 분데스리가 5경기를 남기고 레버쿠젠을 꺾고 선두를 재탈환했습니다.",
    publishedAt: "2026-03-12T22:30:00Z",
    type: "recap",
    league: "Bundesliga",
    leagueKo: "분데스리가",
    leagueFlag: "🇩🇪",
    homeTeam: "Bayern Munich",
    homeTeamKo: "바이에른 뮌헨",
    homeFlag: "🔴",
    awayTeam: "Bayer Leverkusen",
    awayTeamKo: "바이어 레버쿠젠",
    awayFlag: "⚫",
    matchDate: "2026-03-12T18:30:00Z",
    prediction: { outcome: "Bayern Win", outcomeKo: "바이에른 승리", confidence: 91 },
    keyFactorsEn: [
      "Harry Kane scored twice to take his Bundesliga tally to 29 goals",
      "Leverkusen's Granit Xhaka was dismissed in the 61st minute",
      "Bayern xG: 2.8 vs Leverkusen 0.7",
      "Bayern press completion rate: 78% — season high",
      "Result moves Bayern one point clear at the top",
    ],
    keyFactorsKo: [
      "해리 케인 두 골로 분데스리가 시즌 29골 달성",
      "레버쿠젠 그라니트 샤카 61분 퇴장",
      "바이에른 xG 2.8 vs 레버쿠젠 0.7",
      "바이에른 프레스 완료율 78% — 시즌 최고",
      "이 결과로 바이에른 선두 1점 차 탈환",
    ],
    bodyEn: [
      "In a match billed as the Bundesliga title decider, Bayern Munich delivered a commanding performance at the Allianz Arena, defeating a 10-man Bayer Leverkusen 3-1 to move one point clear at the top of the table with five games remaining.",
      "The tone was set early. Harry Kane opened the scoring in the 14th minute with a perfectly placed low drive into the bottom corner after being played through by a clever Jamal Musiala flick. Leverkusen equalised before half-time through Florian Wirtz's trademark curler, but the game shifted irrevocably in Bayern's favour when Granit Xhaka received a second yellow card in the 61st minute for a reckless challenge on Thomas Müller.",
      "Kane grabbed his second goal of the evening on 73 minutes, converting a penalty after Müller was brought down in the box. The goal — his 29th in the Bundesliga this season — moved him to within two of the all-time single-season record. Serge Gnabry's counter-attacking finish in stoppage time sealed an emphatic victory.",
      "Tactically, Vincent Kompany's approach was flawless. Bayern's press completion rate of 78% was a season high, making it virtually impossible for Leverkusen to build from the back. The full-backs pushed extremely high, creating overloads in wide areas that Xabi Alonso's side had no answer to.",
      "From a data perspective, Bayern's xG of 2.8 completely dominated Leverkusen's 0.7, confirming that the scoreline — if anything — slightly flattered the visitors. This was a statement performance from a team that has found its best form at exactly the right time.",
    ],
    bodyKo: [
      "분데스리가 우승 직결전으로 불린 이 경기에서 바이에른 뮌헨은 알리안츠 아레나에서 10인의 레버쿠젠을 3-1로 격파하며 5경기를 남기고 선두 1점 차를 탈환했습니다.",
      "초반 분위기를 주도한 것은 바이에른이었습니다. 해리 케인이 14분에 야말 무시알라의 영리한 플릭을 받아 낮게 구석을 찌르며 선제골을 넣었습니다. 레버쿠젠은 전반 종료 전 플로리안 비르츠의 특기인 커브슈팅으로 동점을 만들었지만, 61분 그라니트 샤카가 토마스 뮐러를 향한 무모한 태클로 두 번째 경고를 받으며 퇴장당하자 경기 흐름은 완전히 바이에른 쪽으로 기울었습니다.",
      "케인은 73분 뮐러가 페널티 에어리어 내에서 파울을 얻어낸 뒤 페널티킥을 성공시키며 이날 두 번째 골이자 분데스리가 시즌 29호 골을 달성했습니다. 추가 시간에 세르게 그나브리가 역습 마무리로 3-1을 확정지었습니다.",
      "전술적으로 뱅상 콩파니 감독의 접근은 완벽했습니다. 바이에른의 프레스 완료율 78%는 시즌 최고치로, 레버쿠젠이 빌드업을 시도하는 것 자체를 불가능하게 만들었습니다. 풀백들의 높은 전진 포지셔닝이 측면에서 수적 우위를 창출했고, 샤비 알론소의 팀은 이에 대한 해법을 찾지 못했습니다.",
      "데이터 관점에서도 바이에른의 xG 2.8은 레버쿠젠의 0.7을 완전히 압도했으며, 오히려 스코어가 실제 경기력 차이를 충분히 반영하지 못했다고 볼 수 있습니다.",
    ],
    tips: [
      { label: "MOTM: Kane", labelKo: "MVP: 케인" },
      { label: "Bayern Dominant xG", labelKo: "바이에른 압도적 xG" },
      { label: "Red Card Influence", labelKo: "퇴장 경기 영향" },
    ],
    aiModel: "KickVista AI v2",
  },

  "champions-league-preview": {
    titleEn: "Champions League QF: Man City vs Bayern Munich — Full Preview",
    titleKo: "챔피언스리그 8강: 맨시티 vs 바이에른 뮌헨 — 완전 프리뷰",
    descriptionEn:
      "Full AI preview of the Champions League quarter-final rematch between Manchester City and Bayern Munich.",
    descriptionKo:
      "맨시티 vs 바이에른 챔피언스리그 8강 리매치에 대한 AI 완전 프리뷰.",
    publishedAt: "2026-03-11T10:00:00Z",
    type: "preview",
    league: "Champions League",
    leagueKo: "챔피언스리그",
    leagueFlag: "🇪🇺",
    homeTeam: "Man City",
    homeTeamKo: "맨체스터 시티",
    homeFlag: "🔵",
    awayTeam: "Bayern Munich",
    awayTeamKo: "바이에른 뮌헨",
    awayFlag: "🔴",
    matchDate: "2026-03-18T20:00:00Z",
    prediction: { outcome: "Man City Win", outcomeKo: "맨시티 승리", confidence: 62 },
    keyFactorsEn: [
      "Man City: 3 consecutive UCL QF appearances, won 2",
      "Erling Haaland: 8 goals in 7 UCL knockout matches",
      "Bayern allow 1.1 goals per game in European competition",
      "City's home record in UCL: W9 D2 L1 (last 12)",
      "Both teams average over 3 goals in European home games",
    ],
    keyFactorsKo: [
      "맨시티, UCL 8강 3년 연속 진출, 2회 우승",
      "엘링 홀란드, UCL 토너먼트 7경기 8골",
      "바이에른, 유럽 대회 경기당 1.1실점 허용",
      "맨시티 UCL 홈 전적: 9승 2무 1패 (최근 12경기)",
      "양 팀 유럽 홈 경기 평균 3골 이상",
    ],
    bodyEn: [
      "Three years after their iconic 2023 Champions League final showdown, Manchester City and Bayern Munich meet again in European competition — this time in the quarter-finals, with both sides arriving in peak condition and fully motivated for what promises to be a titanic encounter.",
      "Pep Guardiola's City have been transformed this season by the emergence of a new generation of midfielders. Phil Foden, operating as an advanced 10 behind Haaland, has been the creative hub of everything good about City's attacking play. His ability to receive between the lines and quickly transition the ball into dangerous areas has created an additional dimension that Bayern will find difficult to account for.",
      "Vincent Kompany's Bayern, fresh from their commanding win over Leverkusen, arrive in Manchester with renewed confidence and a tactical system that has evolved significantly from the Nagelsmann era. Harry Kane's 29 Bundesliga goals this season underpin a potent attack, but it is in the defensive shape — compact, aggressive, well-organised — that Bayern have found their greatest consistency.",
      "The first leg will likely be decided by whichever team imposes their pressing game more effectively. Both managers favour high-intensity counter-pressing, which means transitions — the micro-moments of the game — will be decisive. The team that wins the most duels in the middle third will likely advance.",
      "Our AI model, processing 498 structured data points including European form indexes and player performance metrics under high-pressure knockout situations, assigns Man City a 62% probability of qualifying for the semi-finals across two legs. Haaland's likelihood of scoring in at least one of the two legs is placed at 84%.",
    ],
    bodyKo: [
      "2023년 챔피언스리그 결승 맞대결로부터 3년 만에 맨시티와 바이에른이 다시 유럽 무대에서 격돌합니다. 이번에는 8강에서 두 팀 모두 최상의 컨디션으로 맞붙습니다.",
      "과르디올라의 맨시티는 신세대 미드필더들의 성장으로 이 시즌 완전히 변모했습니다. 홀란드 뒤에서 어드밴스드 10번으로 활동하는 필 포든은 맨시티 공격의 창의적 허브로 기능하며 바이에른이 대응하기 어려운 새로운 차원을 더하고 있습니다.",
      "뱅상 콩파니 감독의 바이에른은 레버쿠젠전 압승의 자신감을 안고 맨체스터에 도착합니다. 해리 케인의 분데스리가 29골이 공격을 뒷받침하지만, 콤팩트하고 공격적인 수비 조직력이 바이에른의 가장 큰 일관성의 원천입니다.",
      "1차전은 어느 팀이 프레싱 게임을 더 효과적으로 강요하느냐에 달려 있습니다. 두 감독 모두 고강도 카운터프레싱을 선호하므로, 전환 장면의 주도권을 잡는 팀이 전체 타이를 지배할 가능성이 높습니다.",
      "498개의 구조화 데이터 포인트를 처리한 AI 모델은 맨시티의 2경기 합산 4강 진출 확률을 62%로 산정했습니다. 홀란드가 두 경기 중 최소 한 경기에서 득점할 확률은 84%입니다.",
    ],
    tips: [
      { label: "Man City to Qualify", labelKo: "맨시티 진출" },
      { label: "Haaland Anytime Scorer", labelKo: "홀란드 득점" },
      { label: "Both Legs Over 2.5", labelKo: "양 경기 2.5골 오버" },
    ],
    aiModel: "KickVista AI v2",
  },

  "ligue1-recap": {
    titleEn: "Ligue 1 Recap: PSG Cruise 4-0 vs Marseille — Le Classique Dominance",
    titleKo: "리그 1 리캡: PSG, 마르세유 4-0 완파 — 르 클라시크 압도",
    descriptionEn:
      "PSG dismantled Marseille 4-0 in Le Classique, with Kylian Mbappé marking his return with a brace at the Parc des Princes.",
    descriptionKo:
      "PSG가 르 클라시크에서 마르세유를 4-0으로 완파했으며, 음바페는 복귀전에서 두 골을 터뜨렸습니다.",
    publishedAt: "2026-03-10T22:30:00Z",
    type: "recap",
    league: "Ligue 1",
    leagueKo: "리그 1",
    leagueFlag: "🇫🇷",
    homeTeam: "PSG",
    homeTeamKo: "파리 생제르맹",
    homeFlag: "🔵",
    awayTeam: "Marseille",
    awayTeamKo: "마르세유",
    awayFlag: "🔵",
    matchDate: "2026-03-10T19:45:00Z",
    prediction: { outcome: "PSG Win", outcomeKo: "PSG 승리", confidence: 94 },
    keyFactorsEn: [
      "Mbappé scored twice in his return from a hamstring injury",
      "PSG's xG: 3.2 vs Marseille's 0.3",
      "PSG have now won 9 consecutive Le Classique meetings",
      "Ousmane Dembélé provided two assists on the night",
      "Marseille failed to register a single shot on target",
    ],
    keyFactorsKo: [
      "음바페, 햄스트링 부상 복귀전에서 두 골",
      "PSG xG 3.2 vs 마르세유 0.3",
      "PSG, 르 클라시크 9연승 달성",
      "우스만 뎀벨레, 이날 2어시스트",
      "마르세유, 유효슈팅 한 개도 기록하지 못해",
    ],
    bodyEn: [
      "A night of maximum drama at the Parc des Princes. Kylian Mbappé, making his long-awaited return from a three-week hamstring injury, announced himself back on the biggest stage possible with two goals and a performance of breathtaking quality as PSG dismantled Marseille 4-0 in Le Classique.",
      "Mbappé opened the scoring in the 22nd minute with a characteristic burst of acceleration, leaving two Marseille defenders in his wake before sliding the ball past the helpless goalkeeper. His second — a clinical right-foot finish after a sweeping team move involving seven players — came in the 67th minute and prompted a standing ovation from a delirious Parc des Princes.",
      "Ousmane Dembélé was outstanding throughout, ending the night with two assists and a performance that underlined why PSG's attacking unit is arguably the most complete in Europe right now. His chemistry with Mbappé on the right side created almost every dangerous situation PSG produced in the final third.",
      "For Marseille, this was a sobering lesson in the gulf between the two clubs. They failed to register a single shot on target across 90 minutes — a statistic that tells the complete story of the evening. Roberto De Zerbi's tactical system, typically effective against middle-table opposition, was completely overwhelmed by PSG's pressing intensity.",
      "Statistically, PSG's xG of 3.2 against Marseille's 0.3 is one of the most lopsided Le Classique performances in the modern era. The result extends PSG's run to nine consecutive victories in this fixture — a record in the history of Le Classique.",
    ],
    bodyKo: [
      "파르크 데 프랭스에서 최고의 드라마가 펼쳐졌습니다. 3주 간의 햄스트링 부상에서 기다리던 복귀를 한 킬리안 음바페가 두 골을 터뜨리며 PSG의 르 클라시크 4-0 완승을 이끌었습니다.",
      "음바페는 22분에 특유의 폭발적인 가속으로 마르세유 수비 두 명을 제치고 선제골을 터뜨렸습니다. 두 번째 골은 67분에 일곱 명이 연결된 팀 공격 후 오른발로 마무리한 것으로, 파르크 데 프랭스 전체가 기립 박수를 보냈습니다.",
      "우스만 뎀벨레는 이날 최고의 활약을 펼치며 두 개의 어시스트를 기록했습니다. 음바페와 오른쪽에서 쌓은 케미스트리가 PSG의 공격 위협을 거의 모두 만들어냈습니다.",
      "마르세유 입장에서는 두 클럽 간 격차를 냉정하게 확인하는 경기였습니다. 90분 동안 유효슈팅을 단 한 개도 기록하지 못했습니다. 중하위권 팀에게 효과적이었던 로베르토 데 제르비의 전술 시스템이 PSG의 프레싱 강도에 완전히 무너졌습니다.",
      "통계적으로 PSG의 xG 3.2 대 마르세유 0.3은 현대 르 클라시크 역사상 가장 일방적인 경기 중 하나입니다. 이 결과로 PSG는 이 경기 9연승을 달성하며 역대 기록을 세웠습니다.",
    ],
    tips: [
      { label: "MOTM: Mbappé", labelKo: "MVP: 음바페" },
      { label: "PSG Dominant xG", labelKo: "PSG 압도적 xG" },
      { label: "9th Consecutive Win", labelKo: "9연승 달성" },
    ],
    aiModel: "KickVista AI v2",
  },

  "serie-a-preview": {
    titleEn: "Serie A: Inter vs Juventus — Derby d'Italia Full AI Preview",
    titleKo: "세리에 A: 인테르 vs 유벤투스 — 데르비 디탈리아 AI 프리뷰",
    descriptionEn:
      "Full AI-powered preview of the Derby d'Italia between Inter Milan and Juventus in Serie A.",
    descriptionKo:
      "인테르 밀란 vs 유벤투스 세리에 A 데르비 디탈리아 AI 완전 프리뷰.",
    publishedAt: "2026-03-09T14:00:00Z",
    type: "preview",
    league: "Serie A",
    leagueKo: "세리에 A",
    leagueFlag: "🇮🇹",
    homeTeam: "Inter Milan",
    homeTeamKo: "인테르 밀란",
    homeFlag: "🔵",
    awayTeam: "Juventus",
    awayTeamKo: "유벤투스",
    awayFlag: "⚫",
    matchDate: "2026-03-20T19:45:00Z",
    prediction: { outcome: "Inter Win", outcomeKo: "인테르 승리", confidence: 71 },
    keyFactorsEn: [
      "Lautaro Martínez: 22 Serie A goals — league's top scorer",
      "Inter have kept clean sheets in 7 of last 10 home games",
      "Juventus have scored 2+ goals in just 3 away matches this season",
      "Inter's pressing metrics rank 1st in Serie A",
      "Derby d'Italia last 8 at San Siro: Inter W5 D1 L2",
    ],
    keyFactorsKo: [
      "라우타로 마르티네스: 세리에 A 22골 — 리그 득점왕",
      "인테르, 최근 10홈 경기 중 7경기 클린시트",
      "유벤투스, 이 시즌 원정에서 2골 이상 기록한 경기 단 3번",
      "인테르 프레싱 지표 세리에 A 1위",
      "산 시로에서의 최근 8 데르비: 인테르 5승 1무 2패",
    ],
    bodyEn: [
      "The Derby d'Italia returns to San Siro with Inter Milan hunting a fourth consecutive Scudetto and Juventus desperately needing three points to consolidate their grip on a Champions League qualification place. The fixture carries enormous weight for both clubs but for entirely different reasons.",
      "Simone Inzaghi's Inter have been the dominant force in Italian football over the past three seasons. Their 3-5-2 system, with Nicolò Barella as the engine of the midfield and Lautaro Martínez as the talismanic centre-forward, operates at a level of collective cohesion that Serie A opponents have found extremely difficult to overcome. Lautaro's 22 league goals make him a near-certainty to take this season's Capocannoniere award.",
      "Juventus under Thiago Motta have evolved from their cautious 2024 iteration into a more proactive, possession-based side. Dusan Vlahovic has rediscovered his best form, scoring nine goals in his last 11 appearances, and the partnership he has developed with Federico Chiesa — who returns from injury in time for this fixture — could prove decisive.",
      "The tactical tension will centre around Inter's press versus Juve's ability to build out from the back. Motta has drilled his squad to play through pressure with confidence, but against Inter's relentless first-line press — one of the most effective in European football — there is genuine uncertainty about whether Juventus can execute their game plan for 90 minutes.",
      "Our AI model, drawing on 376 data points, assigns Inter a 71% probability of winning this fixture. The model identifies Lautaro Martínez as the most likely match-winner with a 42% probability of scoring. Juventus' best route to a positive result is identified as a set-piece goal followed by a structured defensive block.",
    ],
    bodyKo: [
      "산 시로에서 데르비 디탈리아가 열립니다. 인테르는 4연속 스쿠데토를 향해 질주 중이고, 유벤투스는 챔피언스리그 진출권을 굳히기 위해 사활을 걸고 있습니다. 두 클럽 모두에게 각각 다른 이유로 엄청난 무게의 경기입니다.",
      "시모네 인자기 감독의 인테르는 지난 3시즌 이탈리아 축구의 지배적인 힘이었습니다. 니콜로 바렐라를 미드필드 엔진으로, 라우타로 마르티네스를 구심점으로 하는 3-5-2 시스템은 세리에 A 상대들이 넘기 힘든 집단적 응집력을 발휘합니다. 리그 22골의 라우타로는 카포칸노니에레 수상이 유력합니다.",
      "티아고 모타 감독 하의 유벤투스는 2024년의 신중한 모습에서 더 능동적인 점유 기반 팀으로 진화했습니다. 두샨 블라호비치는 최근 11경기 9골로 전성기 폼을 되찾았고, 부상에서 복귀하는 페데리코 키에사와의 파트너십이 결정적인 역할을 할 수 있습니다.",
      "전술적 핵심은 인테르의 프레스 대 유벤투스의 빌드업 능력입니다. 모타 감독은 팀에게 압박을 자신감 있게 뚫어내는 훈련을 시켰지만, 유럽 최고 수준의 인테르 퍼스트라인 프레스 앞에서 90분 내내 게임 플랜을 실행할 수 있을지는 불투명합니다.",
      "376개의 데이터 포인트를 처리한 AI 모델은 인테르의 승리 확률을 71%로 산정했습니다. 라우타로 마르티네스가 42% 득점 확률로 가장 유력한 MVP로 지목됐으며, 유벤투스의 최선의 결과 시나리오는 세트피스 득점 후 구조적 수비 블록 유지로 식별됐습니다.",
    ],
    tips: [
      { label: "Inter Win", labelKo: "인테르 승리" },
      { label: "Lautaro Anytime Scorer", labelKo: "라우타로 득점" },
      { label: "Under 3.5 Goals", labelKo: "3.5골 언더" },
    ],
    aiModel: "KickVista AI v2",
  },
};

const RELATED_MAP: Record<string, string[]> = {
  "arsenal-man-city-preview": ["el-clasico-preview", "champions-league-preview"],
  "el-clasico-preview": ["arsenal-man-city-preview", "serie-a-preview"],
  "bundesliga-recap": ["champions-league-preview", "ligue1-recap"],
  "champions-league-preview": ["arsenal-man-city-preview", "bundesliga-recap"],
  "ligue1-recap": ["bundesliga-recap", "serie-a-preview"],
  "serie-a-preview": ["el-clasico-preview", "ligue1-recap"],
};

const labels = {
  en: {
    backToAnalysis: "← All Analyses",
    breadcrumbAnalysis: "Analysis",
    match: "Match",
    published: "Published",
    aiModel: "AI Model",
    aiDisclaimer:
      "This analysis is AI-generated from structured match data for entertainment purposes only. It does not constitute betting advice. Please gamble responsibly.",
    confidence: "AI Confidence",
    prediction: "Prediction",
    keyTips: "Key Tips",
    keyFactors: "Key Factors",
    relatedAnalyses: "Related Analyses",
    preview: "Preview",
    recap: "Recap",
    generatedFrom: "Generated from structured match data only",
    backLink: "Back to Analysis",
  },
  ko: {
    backToAnalysis: "← 전체 분석",
    breadcrumbAnalysis: "분석",
    match: "경기",
    published: "발행",
    aiModel: "AI 모델",
    aiDisclaimer:
      "이 분석은 구조화된 경기 데이터를 바탕으로 AI가 생성한 오락 목적 콘텐츠입니다. 베팅 조언이 아닙니다. 책임감 있게 베팅하세요.",
    confidence: "AI 신뢰도",
    prediction: "예측",
    keyTips: "핵심 팁",
    keyFactors: "핵심 분석 요소",
    relatedAnalyses: "관련 분석",
    preview: "프리뷰",
    recap: "리캡",
    generatedFrom: "구조화된 경기 데이터만을 기반으로 생성됩니다",
    backLink: "전체 분석으로",
  },
};

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  const slugs = [
    "arsenal-man-city-preview",
    "el-clasico-preview",
    "bundesliga-recap",
    "champions-league-preview",
    "ligue1-recap",
    "serie-a-preview",
  ];
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  const article = ARTICLES[slug];
  if (!article) return buildMetadata({ locale: loc });

  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? article.titleKo : article.titleEn,
    description: loc === "ko" ? article.descriptionKo : article.descriptionEn,
    path: `/analysis/${slug}`,
  });
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const loc = locale as Locale;
  const article = ARTICLES[slug];
  if (!article) notFound();

  const t = labels[loc];
  const isKo = loc === "ko";

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kickvista.io";

  const jsonLd = articleJsonLd({
    title: isKo ? article.titleKo : article.titleEn,
    description: isKo ? article.descriptionKo : article.descriptionEn,
    url: `${BASE_URL}/${loc}/analysis/${slug}`,
    publishedAt: article.publishedAt,
  });

  const body = isKo ? article.bodyKo : article.bodyEn;
  const keyFactors = isKo ? article.keyFactorsKo : article.keyFactorsEn;
  const title = isKo ? article.titleKo : article.titleEn;
  const homeTeam = isKo ? article.homeTeamKo : article.homeTeam;
  const awayTeam = isKo ? article.awayTeamKo : article.awayTeam;
  const leagueName = isKo ? article.leagueKo : article.league;
  const predictionLabel = isKo
    ? article.prediction.outcomeKo
    : article.prediction.outcome;

  const typeMeta = {
    preview: { color: "#8b5cf6", labelEn: "Preview", labelKo: "프리뷰" },
    recap: { color: "#3b82f6", labelEn: "Recap", labelKo: "리캡" },
  };
  const typeInfo = typeMeta[article.type];
  const typeLabel = isKo ? typeInfo.labelKo : typeInfo.labelEn;
  const typeBreadcrumb = typeLabel;

  // Confidence level label
  const confidenceLevel =
    article.prediction.confidence >= 70
      ? isKo ? "높음" : "High"
      : article.prediction.confidence >= 50
      ? isKo ? "보통" : "Moderate"
      : isKo ? "불확실" : "Uncertain";
  const confidenceColor =
    article.prediction.confidence >= 70
      ? "#22c55e"
      : article.prediction.confidence >= 50
      ? "#f59e0b"
      : "#ef4444";

  // Related articles
  const relatedSlugs = RELATED_MAP[slug] ?? [];
  const relatedArticles = relatedSlugs
    .map((s) => ({ slug: s, article: ARTICLES[s] }))
    .filter((r) => r.article != null)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ background: "#0d1117", minHeight: "100vh" }}>
        {/* ── Article header ──────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
            borderBottom: "1px solid #21262d",
          }}
          className="py-10"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 20,
                fontSize: 12,
                color: "#484f58",
              }}
            >
              <a
                href={`/${loc}/analysis`}
                style={{ color: "#8b949e", textDecoration: "none" }}
              >
                {t.breadcrumbAnalysis}
              </a>
              <span>›</span>
              <span
                style={{
                  color: typeInfo.color,
                  fontWeight: 600,
                }}
              >
                {typeBreadcrumb}
              </span>
              <span>›</span>
              <span
                style={{
                  color: "#484f58",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                  maxWidth: 200,
                }}
              >
                {title}
              </span>
            </nav>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Type badge */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  color: typeInfo.color,
                  backgroundColor: `${typeInfo.color}18`,
                  border: `1px solid ${typeInfo.color}40`,
                  borderRadius: 5,
                  padding: "3px 9px",
                }}
              >
                {typeLabel}
              </span>
              {/* League badge */}
              <span
                style={{
                  fontSize: 11,
                  color: "#8b949e",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 5,
                  padding: "3px 9px",
                }}
              >
                {article.leagueFlag} {leagueName}
              </span>
              {/* AI model */}
              <span
                style={{
                  fontSize: 11,
                  color: "#a78bfa",
                  backgroundColor: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  borderRadius: 5,
                  padding: "3px 9px",
                }}
              >
                🤖 {article.aiModel}
              </span>
            </div>

            {/* Title h1 */}
            <h1
              style={{
                color: "#e6edf3",
                fontSize: 28,
                fontWeight: 900,
                margin: "0 0 20px",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h1>

            {/* Match info banner */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap" as const,
                gap: 12,
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 24 }}>{article.homeFlag}</span>
                <span
                  style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700 }}
                >
                  {homeTeam}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span style={{ color: "#8b949e", fontSize: 11 }}>
                  {t.match}
                </span>
                <span
                  style={{
                    color: "#22c55e",
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 6,
                    padding: "3px 10px",
                  }}
                >
                  {article.matchDate.split("T")[0]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700 }}
                >
                  {awayTeam}
                </span>
                <span style={{ fontSize: 24 }}>{article.awayFlag}</span>
              </div>
            </div>

            {/* Published + AI model row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <p style={{ color: "#484f58", fontSize: 12, margin: 0 }}>
                {t.published}:{" "}
                {new Date(article.publishedAt).toLocaleDateString(
                  isKo ? "ko-KR" : "en-GB",
                  { dateStyle: "long" }
                )}
              </p>
              <span
                style={{
                  color: "#484f58",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>🤖</span>
                {t.aiModel}: {article.aiModel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Top ad ──────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdSlot slotId={`analysis-article-${slug}-top`} size="leaderboard" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col gap-8">
            {/* ── AI disclaimer (compact) ────────────────────────────── */}
            <div
              style={{
                backgroundColor: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p
                style={{
                  color: "#e6a020",
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {t.aiDisclaimer}
              </p>
            </div>

            {/* ── Article body paragraphs 1-2 ───────────────────────── */}
            <article>
              {/* Match context paragraph */}
              <p
                style={{
                  color: "#c9d1d9",
                  fontSize: 15,
                  lineHeight: 1.8,
                  marginBottom: 20,
                }}
              >
                {body[0]}
              </p>
              <p
                style={{
                  color: "#c9d1d9",
                  fontSize: 15,
                  lineHeight: 1.8,
                  marginBottom: 20,
                }}
              >
                {body[1]}
              </p>
            </article>

            {/* ── Key factors section ────────────────────────────────── */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "20px",
              }}
            >
              <h3
                style={{
                  color: "#e6edf3",
                  fontSize: 14,
                  fontWeight: 700,
                  margin: "0 0 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>📊</span>
                {t.keyFactors}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {keyFactors.map((factor, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom:
                        i < keyFactors.length - 1
                          ? "1px solid #21262d"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: 11,
                        fontWeight: 800,
                        marginTop: 3,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.5 }}>
                      {factor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Prediction card (inline, prominent) ───────────────── */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "24px",
                display: "flex",
                flexDirection: "column" as const,
                gap: 16,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Prediction outcome */}
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
                    {t.prediction}
                  </p>
                  <span
                    style={{
                      color: "#22c55e",
                      fontSize: 20,
                      fontWeight: 800,
                      backgroundColor: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 8,
                      padding: "8px 16px",
                      display: "inline-block",
                    }}
                  >
                    {predictionLabel}
                  </span>
                </div>

                {/* Confidence % */}
                <div style={{ textAlign: "right" as const }}>
                  <p
                    style={{
                      color: "#8b949e",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.06em",
                      margin: "0 0 4px",
                    }}
                  >
                    {t.confidence}
                  </p>
                  <span
                    style={{
                      color: confidenceColor,
                      fontSize: 36,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {article.prediction.confidence}%
                  </span>
                  <p
                    style={{
                      color: confidenceColor,
                      fontSize: 11,
                      fontWeight: 600,
                      margin: "4px 0 0",
                    }}
                  >
                    {confidenceLevel}
                  </p>
                </div>
              </div>

              {/* Confidence meter bar */}
              <div>
                <div
                  style={{
                    height: 10,
                    backgroundColor: "#0d1117",
                    borderRadius: 999,
                    overflow: "hidden",
                    border: "1px solid #21262d",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${article.prediction.confidence}%`,
                      background: `linear-gradient(90deg, ${confidenceColor}80, ${confidenceColor})`,
                      borderRadius: 999,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: "#484f58", fontSize: 10 }}>0%</span>
                  <span style={{ color: "#484f58", fontSize: 10 }}>50%</span>
                  <span style={{ color: "#484f58", fontSize: 10 }}>100%</span>
                </div>
              </div>

              {/* Tips badges */}
              <div>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    margin: "0 0 10px",
                  }}
                >
                  {t.keyTips}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tips.map((tip) => (
                    <span
                      key={tip.label}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#a78bfa",
                        backgroundColor: "rgba(139,92,246,0.12)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        borderRadius: 5,
                        padding: "5px 12px",
                      }}
                    >
                      {isKo ? tip.labelKo : tip.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Mid-article ad ─────────────────────────────────────── */}
            <AdSlot
              slotId={`analysis-article-${slug}-inline`}
              size="rectangle"
            />

            {/* ── Remaining article paragraphs ──────────────────────── */}
            <article>
              {body.slice(2).map((paragraph, idx) => (
                <p
                  key={idx}
                  style={{
                    color: "#c9d1d9",
                    fontSize: 15,
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  {paragraph}
                </p>
              ))}

              {/* Structured data note */}
              <p
                style={{
                  color: "#484f58",
                  fontSize: 12,
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                <span>🤖</span>
                {t.generatedFrom}
              </p>
            </article>

            {/* ── Related analyses ────────────────────────────────────── */}
            {relatedArticles.length > 0 && (
              <section>
                <h2
                  style={{
                    color: "#e6edf3",
                    fontSize: 18,
                    fontWeight: 800,
                    margin: "0 0 16px",
                  }}
                >
                  {t.relatedAnalyses}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map(({ slug: relSlug, article: related }) => (
                    <AnalysisCard
                      key={relSlug}
                      title={isKo ? related.titleKo : related.titleEn}
                      summary={isKo ? related.descriptionKo : related.descriptionEn}
                      prediction={
                        related.prediction
                          ? {
                              outcome: related.prediction.outcome,
                              label: isKo
                                ? related.prediction.outcomeKo
                                : related.prediction.outcome,
                              confidence: related.prediction.confidence,
                            }
                          : undefined
                      }
                      tips={related.tips}
                      aiModel={related.aiModel}
                      generatedAt={related.publishedAt.split("T")[0]}
                      disclaimer={
                        isKo
                          ? "오락 목적으로만 제공됩니다."
                          : "For entertainment purposes only."
                      }
                      type={related.type}
                      locale={loc}
                      slug={relSlug}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Back to analysis link ────────────────────────────── */}
            <div style={{ paddingTop: 8 }}>
              <a
                href={`/${loc}/analysis`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#8b949e",
                  fontSize: 13,
                  textDecoration: "none",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: "8px 16px",
                  transition: "all 0.15s",
                }}
              >
                ← {t.backLink}
              </a>
            </div>

            {/* ── Bottom ad ───────────────────────────────────────────── */}
            <AdSlot
              slotId={`analysis-article-${slug}-bottom`}
              size="leaderboard"
            />
          </div>
        </div>
      </main>
    </>
  );
}
