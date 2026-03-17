import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import AdSlot from "@/components/ads/AdSlot";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? "AI 경기 분석 & 예측" : "AI Match Predictions & Analysis",
    description:
      loc === "ko"
        ? "AI가 분석한 프리미어리그, 라리가, 분데스리가, 세리에 A 경기 예측 및 전술 분석."
        : "AI-powered match previews, tactical breakdowns and predictions for Premier League, La Liga, Bundesliga, Serie A and more.",
    path: "/analysis",
  });
}

// ─── Mock analysis data ───────────────────────────────────────────────────────

const MOCK_ANALYSES = [
  {
    id: "1",
    fixtureId: 1001,
    type: "preview" as const,
    slug: "arsenal-man-city-preview",
    titleEn: "Arsenal vs Man City: Title Six-Pointer — Full AI Preview",
    titleKo: "아스날 vs 맨시티: 우승 직결 빅매치 — AI 완전 프리뷰",
    summaryEn:
      "Two genuine title contenders separated by just a point go head to head at the Emirates. Pep Guardiola's relentless City machine faces Arteta's high-press Arsenal in what promises to be the match of the season.",
    summaryKo:
      "단 1점 차이로 선두를 다투는 두 우승 후보가 에미레이츠에서 정면 충돌합니다. 펩 과르디올라의 맨시티와 아르테타의 아스날이 만드는 시즌 최고의 빅매치입니다.",
    prediction: { outcome: "home", label: "Arsenal Win", confidence: 68 },
    tips: [
      { label: "Arsenal Win", labelKo: "아스날 승리" },
      { label: "Both Teams to Score", labelKo: "양팀 득점" },
      { label: "Over 2.5 Goals", labelKo: "2.5골 오버" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-14T09:00:00Z",
    disclaimerEn: "For entertainment purposes only. Not betting advice.",
    disclaimerKo: "오락 목적으로만 제공됩니다. 베팅 조언이 아닙니다.",
    isAiGenerated: true,
    locale: "en",
  },
  {
    id: "2",
    fixtureId: 1002,
    type: "preview" as const,
    slug: "el-clasico-preview",
    titleEn: "El Clásico 2026: Tactical Deep-Dive — Real Madrid vs Barcelona",
    titleKo: "엘 클라시코 2026 전술 심층 분석 — 레알 마드리드 vs 바르셀로나",
    summaryEn:
      "The 297th Clásico arrives at maximum tension. With both sides separated by two points at the top of La Liga, the Vinícius Jr. vs Lamine Yamal duel is the clash within the clash.",
    summaryKo:
      "297번째 엘 클라시코가 최대 긴장감 속에 열립니다. 2점 차 선두 경쟁 속 비니시우스 주니오르 vs 라민 야말의 대결이 최고의 볼거리입니다.",
    prediction: { outcome: "draw", label: "Draw", confidence: 48 },
    tips: [
      { label: "Both Teams to Score", labelKo: "양팀 득점" },
      { label: "Draw HT", labelKo: "전반전 무승부" },
      { label: "Over 10 Corners", labelKo: "코너킥 10개 이상" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-13T14:00:00Z",
    disclaimerEn: "For entertainment purposes only. Not betting advice.",
    disclaimerKo: "오락 목적으로만 제공됩니다. 베팅 조언이 아닙니다.",
    isAiGenerated: true,
    locale: "en",
  },
  {
    id: "3",
    fixtureId: 1003,
    type: "preview" as const,
    slug: "champions-league-preview",
    titleEn: "Champions League QF: Man City vs Bayern — Who Advances?",
    titleKo: "챔피언스리그 8강: 맨시티 vs 바이에른 — 누가 4강에 오를까?",
    summaryEn:
      "A blockbuster rematch of the 2023 final. City's relentless pressing meets Bayern's clinical counter-attacking football in a tie that could go either way across two legs.",
    summaryKo:
      "2023 결승전의 블록버스터 리매치. 맨시티의 강렬한 프레싱과 바이에른의 날카로운 역습이 2경기에 걸쳐 충돌합니다.",
    prediction: { outcome: "home", label: "Man City Win", confidence: 62 },
    tips: [
      { label: "Man City to Qualify", labelKo: "맨시티 진출" },
      { label: "Both Legs Over 2.5", labelKo: "양 경기 2.5골 오버" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-12T11:30:00Z",
    disclaimerEn: "For entertainment purposes only. Not betting advice.",
    disclaimerKo: "오락 목적으로만 제공됩니다. 베팅 조언이 아닙니다.",
    isAiGenerated: true,
    locale: "en",
  },
  {
    id: "4",
    fixtureId: 1004,
    type: "recap" as const,
    slug: "bundesliga-recap",
    titleEn: "Bundesliga Title Race: Bayern vs Leverkusen — Season Recap",
    titleKo: "분데스리가 우승 경쟁: 바이에른 vs 레버쿠젠 — 시즌 리캡",
    summaryEn:
      "Mohamed Salah scored a stunning hat-trick as Liverpool dismantled Manchester United 5-0 at Anfield — a result that shifts the title race dynamics dramatically.",
    summaryKo:
      "모하메드 살라가 해트트릭을 포함한 맹활약으로 리버풀이 안필드에서 맨유를 5-0으로 격파했습니다.",
    prediction: undefined,
    tips: [
      { label: "MOTM: Salah", labelKo: "MVP: 살라" },
      { label: "Dominant Possession", labelKo: "압도적 점유율" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-11T23:00:00Z",
    disclaimerEn: "AI-generated recap for informational purposes.",
    disclaimerKo: "정보 제공을 위한 AI 생성 리캡입니다.",
    isAiGenerated: true,
    locale: "ko",
  },
  {
    id: "5",
    fixtureId: 1005,
    type: "recap" as const,
    slug: "ligue1-recap",
    titleEn: "Ligue 1: PSG Cruise to 4-0 Win as Kylian Mbappé Returns — Recap",
    titleKo: "리그 1: PSG 4-0 대승, 음바페 복귀 — 리캡",
    summaryEn:
      "Kylian Mbappé marked his return to the Parc des Princes with a brace as PSG dismantled Marseille in a dominant Ligue 1 derby performance.",
    summaryKo:
      "킬리안 음바페가 파르크 데 프랭스 복귀를 두 골로 자축하며 PSG가 마르세유를 완파했습니다.",
    prediction: undefined,
    tips: [
      { label: "MOTM: Mbappé", labelKo: "MVP: 음바페" },
      { label: "PSG Dominant xG", labelKo: "PSG 압도적 xG" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-10T22:00:00Z",
    disclaimerEn: "AI-generated recap for informational purposes.",
    disclaimerKo: "정보 제공을 위한 AI 생성 리캡입니다.",
    isAiGenerated: true,
    locale: "en",
  },
  {
    id: "6",
    fixtureId: 1006,
    type: "preview" as const,
    slug: "serie-a-preview",
    titleEn: "Serie A: Inter vs Juventus — Derby d'Italia Preview",
    titleKo: "세리에 A: 인테르 vs 유벤투스 — 데르비 디탈리아 프리뷰",
    summaryEn:
      "The Derby d'Italia returns with Inter hunting the Scudetto and Juventus desperate for three points to stay in the top-four race. Inzaghi's side are heavy favourites.",
    summaryKo:
      "스쿠데토를 노리는 인테르와 4강 경쟁에 사활을 건 유벤투스의 데르비 디탈리아. 인자기의 인테르가 강력한 우세를 점하고 있습니다.",
    prediction: { outcome: "home", label: "Inter Win", confidence: 71 },
    tips: [
      { label: "Inter Win", labelKo: "인테르 승리" },
      { label: "Lautaro Anytime Scorer", labelKo: "라우타로 득점" },
      { label: "Under 3.5 Goals", labelKo: "3.5골 언더" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: "2026-03-09T16:00:00Z",
    disclaimerEn: "For entertainment purposes only. Not betting advice.",
    disclaimerKo: "오락 목적으로만 제공됩니다. 베팅 조언이 아닙니다.",
    isAiGenerated: true,
    locale: "ko",
  },
];

const SUPPORTED_LEAGUES = [
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", en: "Premier League", ko: "프리미어리그" },
  { flag: "🇪🇸", en: "La Liga", ko: "라리가" },
  { flag: "🇩🇪", en: "Bundesliga", ko: "분데스리가" },
  { flag: "🇮🇹", en: "Serie A", ko: "세리에 A" },
  { flag: "🇫🇷", en: "Ligue 1", ko: "리그 1" },
  { flag: "🇪🇺", en: "Champions League", ko: "챔피언스리그" },
  { flag: "🇪🇺", en: "Europa League", ko: "유로파리그" },
  { flag: "🇰🇷", en: "K League 1", ko: "K리그 1" },
];

const labels = {
  en: {
    pageTitle: "AI Match Predictions",
    pageSubtitle: "Machine-learning powered analysis for every major league",
    poweredBy: "KickVista AI v2",
    countBadge: (n: number) => `${n} analyses`,
    disclaimerTitle: "Responsible Use Notice",
    disclaimer:
      "AI predictions are generated from structured football data only. Provided for entertainment purposes. Always gamble responsibly.",
    disclaimerSub: "This analysis does not constitute betting advice.",
    filterAll: "All",
    filterPreview: "Previews",
    filterRecap: "Recaps",
    filterToday: "Today",
    filterWeek: "This Week",
    latestAnalyses: "Latest Analyses",
    aboutTitle: "About KickVista AI",
    howItWorksTitle: "How It Works",
    howItWorksDesc:
      "We analyze structured match data including team form, head-to-head records, and statistical trends to generate objective, data-driven insights for every major fixture.",
    supportedLeaguesTitle: "Supported Leagues",
    updateScheduleTitle: "Update Schedule",
    updatePreview: "Previews published 24h before kick-off",
    updateRecap: "Recaps generated 2h after full-time",
    updateLive: "Live predictions refreshed every 15 minutes",
  },
  ko: {
    pageTitle: "AI 경기 분석 & 예측",
    pageSubtitle: "주요 리그 모든 경기를 위한 머신러닝 기반 분석",
    poweredBy: "KickVista AI v2",
    countBadge: (n: number) => `${n}개 분석`,
    disclaimerTitle: "책임감 있는 사용 안내",
    disclaimer:
      "AI 예측은 구조화된 축구 데이터를 기반으로 생성됩니다. 오락 목적으로만 제공됩니다. 항상 책임감 있게 베팅하세요.",
    disclaimerSub: "이 분석은 베팅 조언을 구성하지 않습니다.",
    filterAll: "전체",
    filterPreview: "프리뷰",
    filterRecap: "리캡",
    filterToday: "오늘",
    filterWeek: "이번 주",
    latestAnalyses: "최신 분석",
    aboutTitle: "KickVista AI 소개",
    howItWorksTitle: "작동 방식",
    howItWorksDesc:
      "팀 폼, 상대 전적, 통계 트렌드 등 구조화된 경기 데이터를 분석하여 모든 주요 경기에 대한 객관적이고 데이터 기반의 인사이트를 제공합니다.",
    supportedLeaguesTitle: "지원 리그",
    updateScheduleTitle: "업데이트 일정",
    updatePreview: "프리뷰: 킥오프 24시간 전 게재",
    updateRecap: "리캡: 경기 종료 2시간 후 생성",
    updateLive: "라이브 예측: 15분마다 업데이트",
  },
};

export default async function AnalysisListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = labels[loc];
  const isKo = loc === "ko";

  const filterTabs = [
    { label: t.filterAll, href: `/${loc}/analysis` },
    { label: t.filterPreview, href: `/${loc}/analysis?type=preview` },
    { label: t.filterRecap, href: `/${loc}/analysis?type=recap` },
    { label: t.filterToday, href: `/${loc}/analysis?period=today` },
    { label: t.filterWeek, href: `/${loc}/analysis?period=week` },
  ];

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* ── Page hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          borderBottom: "1px solid #21262d",
        }}
        className="py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-4">
            {/* AI badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 999,
                padding: "5px 14px",
              }}
            >
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
                {t.poweredBy}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1
                style={{
                  color: "#e6edf3",
                  fontSize: 32,
                  fontWeight: 900,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {t.pageTitle}
              </h1>
              {/* Count badge */}
              <span
                style={{
                  backgroundColor: "#22c55e",
                  color: "#0d1117",
                  fontSize: 12,
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: "3px 10px",
                  alignSelf: "flex-start",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              >
                {t.countBadge(MOCK_ANALYSES.length)}
              </span>
            </div>
            <p style={{ color: "#8b949e", fontSize: 15, margin: 0, maxWidth: 560 }}>
              {t.pageSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── Top ad ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot slotId="analysis-top" size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── AI Disclaimer banner (full version) ─────────────────────── */}
        <div
          style={{
            backgroundColor: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 32,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>⚠️</span>
          <div>
            <p
              style={{
                color: "#f59e0b",
                fontSize: 13,
                fontWeight: 700,
                margin: "0 0 4px",
              }}
            >
              {t.disclaimerTitle}
            </p>
            <p
              style={{
                color: "#e6a020",
                fontSize: 12,
                margin: "0 0 4px",
                lineHeight: 1.6,
              }}
            >
              {t.disclaimer}
            </p>
            <p
              style={{
                color: "#8b949e",
                fontSize: 11,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {t.disclaimerSub}
            </p>
          </div>
        </div>

        {/* ── Filter tabs + section title ──────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <h2 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800, margin: 0 }}>
            {t.latestAnalyses}
          </h2>
          {/* Static filter tabs — query param driven, no JS state */}
          <div
            className="flex items-center gap-1 flex-wrap"
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {filterTabs.map((tab, idx) => (
              <a
                key={tab.label}
                href={tab.href}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  backgroundColor: idx === 0 ? "#22c55e" : "transparent",
                  color: idx === 0 ? "#0d1117" : "#8b949e",
                  transition: "all 0.15s",
                  display: "inline-block",
                }}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── Analysis grid — 3 columns ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MOCK_ANALYSES.slice(0, 3).map((item) => (
            <AnalysisCard
              key={item.slug}
              title={isKo ? item.titleKo : item.titleEn}
              summary={isKo ? item.summaryKo : item.summaryEn}
              prediction={item.prediction}
              tips={item.tips}
              aiModel={item.aiModel}
              generatedAt={item.generatedAt}
              disclaimer={isKo ? item.disclaimerKo : item.disclaimerEn}
              type={item.type}
              locale={loc}
              slug={item.slug}
            />
          ))}
        </div>

        {/* ── Mid ad (leaderboard between row 1 and row 2) ─────────────── */}
        <div className="my-8">
          <AdSlot slotId="analysis-mid" size="leaderboard" />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MOCK_ANALYSES.slice(3).map((item) => (
            <AnalysisCard
              key={item.slug}
              title={isKo ? item.titleKo : item.titleEn}
              summary={isKo ? item.summaryKo : item.summaryEn}
              prediction={item.prediction}
              tips={item.tips}
              aiModel={item.aiModel}
              generatedAt={item.generatedAt}
              disclaimer={isKo ? item.disclaimerKo : item.disclaimerEn}
              type={item.type}
              locale={loc}
              slug={item.slug}
            />
          ))}
        </div>

        {/* ── About KickVista AI section ───────────────────────────────── */}
        <section
          style={{
            marginTop: 64,
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              borderBottom: "1px solid #21262d",
              backgroundColor: "#0d1117",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>✨</span>
            <h2
              style={{
                color: "#e6edf3",
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
              }}
            >
              {t.aboutTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* How it works */}
            <div
              style={{
                padding: "24px 28px",
                borderRight: "1px solid #21262d",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 18 }}>🧠</span>
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {t.howItWorksTitle}
                </h3>
              </div>
              <p
                style={{
                  color: "#8b949e",
                  fontSize: 13,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {t.howItWorksDesc}
              </p>
            </div>

            {/* Supported leagues */}
            <div
              style={{
                padding: "24px 28px",
                borderRight: "1px solid #21262d",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 18 }}>🏆</span>
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {t.supportedLeaguesTitle}
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: 6,
                }}
              >
                {SUPPORTED_LEAGUES.map((league) => (
                  <div
                    key={league.en}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{league.flag}</span>
                    <span style={{ color: "#8b949e", fontSize: 12 }}>
                      {isKo ? league.ko : league.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Update schedule */}
            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 18 }}>🕐</span>
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {t.updateScheduleTitle}
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: 10,
                }}
              >
                {[
                  { icon: "🔮", text: t.updatePreview },
                  { icon: "📊", text: t.updateRecap },
                  { icon: "⚡", text: t.updateLive },
                ].map((item) => (
                  <div
                    key={item.text}
                    style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                    <span
                      style={{
                        color: "#8b949e",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom ad ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <AdSlot slotId="analysis-bottom" size="leaderboard" />
        </div>
      </div>
    </main>
  );
}
