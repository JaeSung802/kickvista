import type { MatchAnalysis } from "@/lib/ai-analysis";
import type { Locale } from "@/lib/i18n";

interface MatchAIAnalysisProps {
  isFinished: boolean;
  isLive:     boolean;
  dbPreview:  MatchAnalysis | null;
  hasRecap:   boolean;
  locale:     Locale;
}

export default function MatchAIAnalysis({
  isFinished,
  isLive,
  dbPreview,
  hasRecap,
  locale,
}: MatchAIAnalysisProps) {
  const isKo = locale === "ko";

  const labels = {
    aiDisclaimer: isKo
      ? "AI 분석은 오락 목적으로만 제공되며 베팅에 사용되어서는 안 됩니다."
      : "AI analysis is generated for entertainment purposes only and should not be used for betting.",
    aiPrediction: isKo ? "경기 전 예측"   : "Pre-match Prediction",
    aiConfidence: isKo ? "AI 신뢰도"      : "AI Confidence",
    keyInsight:   isKo ? "핵심 인사이트"  : "Key Insight",
  };

  return (
    <section>
      <h3 style={{ color: "#111827", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
        {isKo ? "AI 분석" : "AI Analysis"}
      </h3>

      {dbPreview ? (
        <>
          <div style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🤖</span>
            <p style={{ color: "#1d4ed8", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {dbPreview.disclaimer ?? labels.aiDisclaimer}
            </p>
          </div>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {dbPreview.prediction && (
              <div>
                <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 8px" }}>
                  {labels.aiPrediction}
                </p>
                <div className="flex items-center gap-3">
                  <span style={{ color: "#059669", fontSize: 16, fontWeight: 800, backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "6px 14px" }}>
                    {dbPreview.prediction.label}
                  </span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>{labels.aiConfidence}</span>
                    <span style={{ color: "#059669", fontSize: 13, fontWeight: 700 }}>{dbPreview.prediction.confidence}%</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <div style={{ height: "100%", width: `${dbPreview.prediction.confidence}%`, background: "linear-gradient(90deg, #059669, #059669)", borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            )}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
              <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 8px" }}>
                {labels.keyInsight}
              </p>
              <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{dbPreview.insight}</p>
            </div>
            {dbPreview.tips && dbPreview.tips.length > 0 && (
              <div>
                <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 8px" }}>
                  {isKo ? "분석 포인트" : "Key Tips"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dbPreview.tips.map((tip, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "#a78bfa", backgroundColor: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 5, padding: "4px 10px" }}>
                      {isKo ? tip.labelKo : tip.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : isFinished && hasRecap ? (
        // Recap content is shown directly below — no CTA needed
        null
      ) : isFinished ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-base shrink-0">🤖</span>
            <p className="text-xs font-medium text-blue-700">
              {isKo
                ? "AI가 경기를 분석하고 있습니다. 곧 리캡이 완성됩니다."
                : "AI is analysing the match. The recap will be ready shortly."}
            </p>
          </div>
          {[80, 48, 64].map((w, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded-full mb-3" style={{ width: `${w}%` }} />
              <div className="h-2.5 bg-gray-100 rounded-full mb-2 w-full" />
              <div className="h-2.5 bg-gray-100 rounded-full" style={{ width: "60%" }} />
            </div>
          ))}
        </div>
      ) : isLive ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100">
          <span className="text-base shrink-0">🟢</span>
          <p className="text-xs font-medium text-green-700">
            {isKo
              ? "경기가 진행 중입니다. 경기 종료 후 AI 분석이 제공됩니다."
              : "This match is in progress. AI analysis will be available after full time."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">⚽</div>
          <div>
            <p className="font-black text-gray-800 text-base mb-2">
              {isKo ? "경기 종료 후 AI 분석 시작" : "AI Analysis After Final Whistle"}
            </p>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              {isKo
                ? "경기가 끝나는 순간 AI가 즉시 분석을 시작합니다. 승리 요인, 핵심 장면, 선수 평점까지 자동으로 생성됩니다."
                : "The moment the final whistle blows, AI begins its analysis — win factors, key moments, and player ratings."}
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 mt-2 opacity-40">
            {[90, 70, 55].map((w, i) => (
              <div key={i} className="h-2.5 bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
