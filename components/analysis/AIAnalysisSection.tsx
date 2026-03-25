"use client";

import AnalysisCard from "@/components/analysis/AnalysisCard";

interface AIAnalysisSectionProps {
  locale: "ko" | "en";
}

const labels = {
  en: {
    sectionTitle: "AI Match Analysis",
    aiBadge: "✨ AI-Powered",
    viewAll: "All analyses →",
    disclaimer:
      "AI analyses are for informational and entertainment purposes only. Data reflects publicly available football statistics.",
  },
  ko: {
    sectionTitle: "AI 경기 분석",
    aiBadge: "✨ AI 기반",
    viewAll: "전체 분석 보기 →",
    disclaimer:
      "AI 분석은 정보 제공 및 오락 목적으로만 제공됩니다. 공개된 축구 통계 데이터를 기반으로 합니다.",
  },
};

const mockAnalysisItems = (locale: "ko" | "en") => [
  {
    title: locale === "ko"
      ? "아스날 vs 맨체스터 시티 경기 프리뷰"
      : "Arsenal vs Man City Match Preview",
    summary: locale === "ko"
      ? "아스날이 홈에서 맨체스터 시티를 맞이합니다. 홈팀은 최근 8경기 무패 행진 중이며, 공격 효율성에서 리그 상위권을 유지하고 있습니다."
      : "Arsenal host Man City in a pivotal title-race encounter. The hosts are unbeaten in 8 home fixtures and rank in the top 3 for attacking efficiency this season.",
    prediction: {
      outcome: "home",
      label:   "Home Win",
      labelKo: "홈 승",
      confidence: 65,
    },
    keyFactors: [
      { icon: "🏠", label: "Home Record",  labelKo: "홈 기록",    value: "W8 D0 L0",  valueKo: "8승 0무 0패" },
      { icon: "⚽", label: "xG (Season)",  labelKo: "기대 득점",   value: "2.1 / game", valueKo: "경기당 2.1" },
      { icon: "🛡️", label: "Clean Sheets", labelKo: "무실점 경기", value: "5 of last 8", valueKo: "최근 8경기 중 5" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString(),
    disclaimer: locale === "ko"
      ? "AI 분석은 정보 제공 목적으로만 제공됩니다"
      : "AI analysis is for informational purposes only",
    type: "preview" as const,
    locale,
    slug: "arsenal-man-city-preview",
  },
  {
    title: locale === "ko"
      ? "분데스리가 리캡: 바이에른, 레버쿠젠 3-1 격파"
      : "Bundesliga Recap: Bayern Overpower Leverkusen 3-1",
    summary: locale === "ko"
      ? "바이에른 뮌헨이 알리안츠 아레나에서 레버쿠젠을 3-1로 제압하며 선두를 탈환했습니다. 해리 케인이 두 골을 넣으며 시즌 29호 골을 달성했고, 샤카의 퇴장이 경기 흐름을 완전히 바꿨습니다."
      : "Bayern Munich dominated Leverkusen 3-1 at the Allianz Arena to reclaim top spot. Harry Kane scored twice for his 29th Bundesliga goal, as Xhaka's red card proved the turning point.",
    prediction: {
      outcome: "home",
      label:   "Bayern Win",
      labelKo: "바이에른 승",
      confidence: 91,
    },
    keyFactors: [
      { icon: "⚽", label: "Kane Goals",     labelKo: "케인 득점",     value: "2 (29 season)", valueKo: "2골 (시즌 29호)" },
      { icon: "🟥", label: "Red Card (61')", labelKo: "퇴장 (61분)",   value: "Xhaka",         valueKo: "샤카 퇴장" },
      { icon: "📊", label: "xG",             labelKo: "기대 득점",     value: "2.8 vs 0.7",    valueKo: "2.8 vs 0.7" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString(),
    disclaimer: locale === "ko"
      ? "AI 분석은 정보 제공 목적으로만 제공됩니다"
      : "AI analysis is for informational purposes only",
    type: "recap" as const,
    locale,
    slug: "bundesliga-recap",
  },
  {
    title: locale === "ko"
      ? "리그 1 리캡: 전술 완성도가 만든 결정적 승리"
      : "Ligue 1 Recap: Tactical Masterclass Seals Decisive Win",
    summary: locale === "ko"
      ? "이번 라운드의 리그 1 리캡. 치밀한 전술과 수비 집중력이 빛난 경기에서 승부를 결정짓는 결정적 골이 터졌습니다. AI가 분석한 핵심 장면과 통계를 확인하세요."
      : "This round's Ligue 1 recap. A disciplined defensive performance and clinical finishing decided the contest. Check AI-analysed key moments and match statistics.",
    prediction: {
      outcome: "home",
      label:   "Home Win",
      labelKo: "홈 승",
      confidence: 74,
    },
    keyFactors: [
      { icon: "🛡️", label: "Clean Sheet",   labelKo: "무실점",       value: "Home defense",  valueKo: "홈 수비 무실점" },
      { icon: "📊", label: "Possession",    labelKo: "점유율",       value: "61% home",      valueKo: "홈 61%" },
      { icon: "⚽", label: "xG",            labelKo: "기대 득점",    value: "2.1 vs 0.5",    valueKo: "2.1 vs 0.5" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString(),
    disclaimer: locale === "ko"
      ? "AI 분석은 정보 제공 목적으로만 제공됩니다"
      : "AI analysis is for informational purposes only",
    type: "recap" as const,
    locale,
    slug: "ligue1-recap",
  },
];

export default function AIAnalysisSection({ locale }: AIAnalysisSectionProps) {
  const t = labels[locale];
  const items = mockAnalysisItems(locale);

  return (
    <section id="ai-analysis">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
          <h2 className="text-lg font-bold text-gray-900">{t.sectionTitle}</h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
            {t.aiBadge}
          </span>
        </div>
        <a
          href={`/${locale}/analysis`}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors no-underline"
        >
          {t.viewAll}
        </a>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-lg text-xs bg-blue-50 border border-blue-100 text-blue-600">
        <span className="text-base shrink-0">🤖</span>
        <span>{t.disclaimer}</span>
      </div>

      {/* Analysis cards — horizontal scroll on mobile, grid on lg+ */}
      <div
        className="flex gap-4 overflow-x-auto snap-x pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <div key={item.slug} className="shrink-0 w-[85vw] sm:w-[60vw] lg:w-auto snap-start">
            <AnalysisCard {...item} />
          </div>
        ))}
      </div>
    </section>
  );
}
