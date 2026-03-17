"use client";

import AnalysisCard from "@/components/analysis/AnalysisCard";

interface AIAnalysisSectionProps {
  locale: "ko" | "en";
}

const labels = {
  en: {
    sectionTitle: "AI Match Predictions",
    aiBadge: "✨ Powered by AI",
    viewAll: "All predictions →",
    disclaimer:
      "AI predictions are for entertainment purposes only. Past performance does not guarantee future results. Always gamble responsibly.",
  },
  ko: {
    sectionTitle: "AI 경기 분석",
    aiBadge: "✨ AI 기반",
    viewAll: "전체 분석 보기 →",
    disclaimer:
      "AI 예측은 오락 목적으로만 제공됩니다. 과거 성과가 미래 결과를 보장하지 않습니다. 책임감 있는 베팅을 하세요.",
  },
};

const mockAnalysisItems = (locale: "ko" | "en") => [
  {
    title: locale === "ko"
      ? "아스날 vs 맨시티 경기 프리뷰"
      : "Arsenal vs Man City Match Preview",
    summary: locale === "ko"
      ? "아스날이 홈에서 맨시티를 맞이하는 이번 경기는 프리미어리그 선두 경쟁의 핵심 대결입니다. 아스날은 홈에서 최근 8경기 무패 행진을 이어가고 있으며, 맨시티는 원정에서 3경기 연속 득점에 성공했습니다."
      : "Arsenal host Man City in what promises to be a thrilling title-race encounter. Arsenal are unbeaten in their last 8 home matches, while City have scored in their last 3 away games. Both sides are in excellent form heading into this crucial clash.",
    prediction: { outcome: "home", label: locale === "ko" ? "홈 승" : "Home Win", confidence: 65 },
    tips: [
      { label: "Both Teams to Score",    labelKo: "양팀 득점" },
      { label: "Over 2.5 Goals",         labelKo: "2.5골 오버" },
      { label: "Arsenal Win & BTTS",     labelKo: "아스날 승 & 양팀 득점" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString().split("T")[0],
    disclaimer: locale === "ko"
      ? "AI 예측은 오락 목적으로만 제공됩니다"
      : "AI predictions are for entertainment only",
    type: "preview" as const,
    locale,
    slug: "arsenal-vs-man-city-preview",
  },
  {
    title: locale === "ko"
      ? "바이에른 뮌헨 vs 도르트문트 분석"
      : "Bayern Munich vs Dortmund Analysis",
    summary: locale === "ko"
      ? "데어 클라시커 대결이 알리안츠 아레나에서 펼쳐집니다. 바이에른은 홈에서 최근 12경기 분데스리가 무패를 기록 중이며, 도르트문트의 원정 기록은 8경기 중 6경기에서 2골 이상 실점하는 등 불안정합니다."
      : "Der Klassiker arrives at Allianz Arena with title implications. Bayern are unbeaten at home in their last 12 Bundesliga fixtures. Dortmund's away record has been inconsistent, conceding 2+ goals in 6 of their last 8 away trips.",
    prediction: { outcome: "home", label: locale === "ko" ? "바이에른 승" : "Bayern Win", confidence: 72 },
    tips: [
      { label: "Both Teams to Score",    labelKo: "양팀 득점" },
      { label: "Over 2.5 Goals",         labelKo: "2.5골 오버" },
      { label: "Bayern -1 Handicap",     labelKo: "바이에른 -1 핸디캡" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString().split("T")[0],
    disclaimer: locale === "ko"
      ? "AI 예측은 오락 목적으로만 제공됩니다"
      : "AI predictions are for entertainment only",
    type: "preview" as const,
    locale,
    slug: "bayern-vs-dortmund-analysis",
  },
  {
    title: locale === "ko"
      ? "PSG vs 마르세유 르 클라시크 프리뷰"
      : "PSG vs Marseille Le Classique Preview",
    summary: locale === "ko"
      ? "파르크 데 프랭스에서 열리는 르 클라시크. PSG는 이 홈 대결에서 최근 7연승을 기록 중입니다. 마르세유는 3명의 주전 수비수가 출전 정지 상태로 수비가 취약해진 상황입니다."
      : "Le Classique at Parc des Princes. PSG have won the last 7 Le Classique fixtures at this ground. Marseille are missing 3 key defenders through suspension, exposing their backline to PSG's lethal attack.",
    prediction: { outcome: "home", label: locale === "ko" ? "PSG 승" : "PSG Win", confidence: 81 },
    tips: [
      { label: "PSG Win & Over 2.5",     labelKo: "PSG 승 & 2.5골 오버" },
      { label: "Score in Both Halves",   labelKo: "전후반 모두 득점" },
      { label: "PSG -1.5 Handicap",      labelKo: "PSG -1.5 핸디캡" },
    ],
    aiModel: "KickVista AI v2",
    generatedAt: new Date().toISOString().split("T")[0],
    disclaimer: locale === "ko"
      ? "AI 예측은 오락 목적으로만 제공됩니다"
      : "AI predictions are for entertainment only",
    type: "preview" as const,
    locale,
    slug: "psg-vs-marseille-le-classique",
  },
];

export default function AIAnalysisSection({ locale }: AIAnalysisSectionProps) {
  const t = labels[locale];
  const items = mockAnalysisItems(locale);

  return (
    <section id="ai-analysis" className="py-8" style={{ borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-title-bar" />
            <h2 className="text-lg font-bold text-white">{t.sectionTitle}</h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              {t.aiBadge}
            </span>
          </div>
          <a
            href={`/${locale}/analysis`}
            style={{ color: "#22c55e" }}
            className="text-sm font-medium hover:underline"
          >
            {t.viewAll}
          </a>
        </div>

        {/* Disclaimer banner */}
        <div
          className="flex items-start gap-2 mb-6 px-4 py-3 rounded-lg text-xs"
          style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e" }}
        >
          <span className="text-base shrink-0">⚠️</span>
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
      </div>
    </section>
  );
}
