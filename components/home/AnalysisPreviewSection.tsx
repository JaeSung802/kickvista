/**
 * AnalysisPreviewSection — Server Component
 *
 * "Data-based match insights" section.
 * Shows 3 analysis feature cards that link to the full analysis page.
 *
 * Design: trustworthy data/sport portal feel.
 * Avoids betting-site language — focuses on "insight", "prediction", "stats".
 */

import type { Locale } from "@/lib/i18n";
import { SectionHeader } from "./HomePageContent";

interface AnalysisPreviewSectionProps {
  locale: Locale;
}

interface InsightCard {
  icon: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  tagKo: string;
  tagEn: string;
  tagColor: string;
}

const INSIGHT_CARDS: InsightCard[] = [
  {
    icon: "📊",
    titleKo: "AI 경기 인사이트",
    titleEn: "AI Match Insights",
    descKo: "오늘 경기의 팀 폼, 과거 맞대결, 부상 현황을 종합해 핵심 지표를 분석합니다.",
    descEn: "Form guide, head-to-head history, and injury impact — condensed into the key metrics that matter.",
    tagKo: "데이터 분석",
    tagEn: "Data Analysis",
    tagColor: "text-blue-600 bg-blue-50",
  },
  {
    icon: "📈",
    titleKo: "리그 트렌드",
    titleEn: "League Trends",
    descKo: "리그 전체의 득점 패턴, 팀별 승률 추이, 홈/원정 성적 차이를 시각적으로 제공합니다.",
    descEn: "Scoring patterns, win-rate trends, and home vs away performance across the season.",
    tagKo: "시즌 통계",
    tagEn: "Season Stats",
    tagColor: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: "⚡",
    titleKo: "경기 예측",
    titleEn: "Match Forecast",
    descKo: "과거 500경기 이상의 데이터 기반으로 산출된 경기 결과 확률 분포를 확인하세요.",
    descEn: "Probability distributions computed from 500+ historical match records — not gut feeling.",
    tagKo: "예측 모델",
    tagEn: "Prediction Model",
    tagColor: "text-emerald-600 bg-emerald-50",
  },
];

export default function AnalysisPreviewSection({ locale }: AnalysisPreviewSectionProps) {
  const isKo = locale === "ko";

  return (
    <div>
      <SectionHeader
        title={isKo ? "AI 데이터 분석" : "AI Data Analysis"}
        href={`/${locale}/analysis`}
        linkLabel={isKo ? "분석 더보기" : "View analysis"}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        {INSIGHT_CARDS.map((card) => (
          <a
            key={card.titleEn}
            href={`/${locale}/analysis`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            {/* Icon + tag */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${card.tagColor}`}>
                {isKo ? card.tagKo : card.tagEn}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
              {isKo ? card.titleKo : card.titleEn}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed">
              {isKo ? card.descKo : card.descEn}
            </p>
          </a>
        ))}
      </div>

      {/* Bottom CTA banner */}
      <div className="mt-5 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
        <div>
          <div className="text-sm font-bold text-emerald-800">
            {isKo ? "오늘 경기 AI 분석 바로 보기" : "View today's AI analysis"}
          </div>
          <div className="text-xs text-emerald-600 mt-0.5">
            {isKo
              ? "데이터 기반 경기 인사이트, 무료로 제공됩니다"
              : "Data-driven match insights, completely free"}
          </div>
        </div>
        <a
          href={`/${locale}/analysis`}
          className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {isKo ? "분석 보기" : "View"}
        </a>
      </div>
    </div>
  );
}
