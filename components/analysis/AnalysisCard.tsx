"use client";

/**
 * AnalysisCard — KickVista AI Insight Card
 *
 * Displays a data-driven match analysis.
 * No gambling or betting language — strictly informational/statistical.
 */

interface KeyFactor {
  icon: string;
  label: string;
  labelKo: string;
  value: string;
  valueKo: string;
}

interface Prediction {
  outcome: string;
  label: string;
  labelKo: string;
  confidence: number; // 0–100
}

export interface AnalysisCardProps {
  title: string;
  summary: string;
  prediction?: Prediction;
  keyFactors?: KeyFactor[];
  aiModel: string;
  generatedAt: string;
  disclaimer: string;
  type: "preview" | "recap";
  locale: "ko" | "en";
  slug: string;
  isAiGenerated?: boolean;
  fixtureId?: number;
}

const TYPE_META = {
  preview: { labelEn: "Preview", labelKo: "프리뷰", accent: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  recap:   { labelEn: "Recap",   labelKo: "리캡",   accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

function ConfidenceMeter({ confidence, label, labelKo, isKo }: {
  confidence: number;
  label: string;
  labelKo: string;
  isKo: boolean;
}) {
  const tier =
    confidence >= 70 ? { label: isKo ? "높음" : "High",   color: "text-emerald-600", bar: "from-emerald-600 to-emerald-900" } :
    confidence >= 50 ? { label: isKo ? "보통" : "Medium", color: "text-amber-500", bar: "from-amber-400 to-amber-500" } :
                       { label: isKo ? "낮음" : "Low",    color: "text-gray-400",  bar: "from-gray-300 to-gray-400"  };

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">
          {isKo ? "AI 신뢰도" : "AI Confidence"} · <span className="font-bold text-gray-700">{isKo ? labelKo : label}</span>
        </span>
        <span className={`text-sm font-black tabular-nums ${tier.color}`}>
          {confidence}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${tier.bar} transition-all duration-700`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-gray-400">0%</span>
        <span className={`text-[10px] font-semibold ${tier.color}`}>{tier.label}</span>
        <span className="text-[10px] text-gray-400">100%</span>
      </div>
    </div>
  );
}

export default function AnalysisCard({
  title,
  summary,
  prediction,
  keyFactors,
  aiModel,
  generatedAt,
  disclaimer,
  type,
  locale,
  slug,
  isAiGenerated = true,
  fixtureId,
}: AnalysisCardProps) {
  const isKo = locale === "ko";
  const meta = TYPE_META[type];
  const typeLabel = isKo ? meta.labelKo : meta.labelEn;

  // Format ISO date to readable string
  const dateLabel = (() => {
    try {
      return new Date(generatedAt).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return generatedAt;
    }
  })();

  return (
    <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Top accent stripe */}
      <div style={{ height: 3, backgroundColor: meta.accent }} />

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Header: type badge + AI model */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5"
            style={{ color: meta.accent, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}
          >
            {type === "preview" ? "🔮" : "📊"} {typeLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
            ✨ {aiModel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug">
          {title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
          {summary}
        </p>

        {/* Key Factors */}
        {keyFactors && keyFactors.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {isKo ? "핵심 요소" : "Key Factors"}
            </p>
            <div className="flex flex-col gap-1.5">
              {keyFactors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                  <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <span>{factor.icon}</span>
                    {isKo ? factor.labelKo : factor.label}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {isKo ? factor.valueKo : factor.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Meter */}
        {prediction && (
          <ConfidenceMeter
            confidence={prediction.confidence}
            label={prediction.label}
            labelKo={prediction.labelKo}
            isKo={isKo}
          />
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-gray-400">{dateLabel}</span>
          {isAiGenerated ? (
            <a
              href={`/${locale}/analysis/${slug}`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {isKo ? "자세히 보기 →" : "Read More →"}
            </a>
          ) : type === "recap" && fixtureId ? (
            <a
              href={`/${locale}/match/${fixtureId}#tab-4`}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              📊 {isKo ? "경기 결과 보기 →" : "View Match Recap →"}
            </a>
          ) : (
            <span className="text-xs font-semibold text-gray-400 italic">
              {isKo ? "분석 준비 중..." : "Analysis coming soon..."}
            </span>
          )}
        </div>

        {/* AI Disclaimer */}
        <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <span className="text-[10px] shrink-0 mt-0.5">🤖</span>
          <p className="text-[10px] text-blue-600 leading-relaxed italic">
            {disclaimer}
          </p>
        </div>
      </div>
    </article>
  );
}
