"use client";

interface Tip {
  label: string;
  labelKo: string;
}

interface Prediction {
  outcome: string;
  label: string;
  confidence: number; // 0–100
}

interface AnalysisCardProps {
  title: string;
  summary: string;
  prediction?: Prediction;
  tips: Tip[];
  aiModel: string;
  generatedAt: string;
  disclaimer: string;
  type: "preview" | "recap";
  locale: "ko" | "en";
  slug: string;
}

const typeMeta = {
  preview: { labelEn: "Preview", labelKo: "프리뷰", color: "#22c55e",  bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  recap:   { labelEn: "Recap",   labelKo: "리캡",   color: "#3b82f6",  bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
};

export default function AnalysisCard({
  title,
  summary,
  prediction,
  tips,
  aiModel,
  generatedAt,
  disclaimer,
  type,
  locale,
  slug,
}: AnalysisCardProps) {
  const isKo = locale === "ko";
  const meta = typeMeta[type];
  const typeLabel      = isKo ? meta.labelKo : meta.labelEn;
  const readMore       = isKo ? "자세히 보기" : "Read More";
  const confidenceLabel = isKo ? "AI 신뢰도" : "AI Confidence";
  const tipsLabel      = isKo ? "분석 포인트" : "Key Tips";

  return (
    <article
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#30363d";
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 2, backgroundColor: meta.color }} />

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Type badge + AI model */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: meta.color,
              backgroundColor: meta.bg,
              border: `1px solid ${meta.border}`,
              borderRadius: 5,
              padding: "3px 9px",
            }}
          >
            {typeLabel}
          </span>
          <span style={{ fontSize: 10, color: "#484f58" }}>
            🤖 {aiModel}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.45 }}>
          {title}
        </h3>

        {/* Summary */}
        <p
          style={{
            color: "#8b949e",
            fontSize: 13,
            margin: 0,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </p>

        {/* Confidence bar */}
        {prediction && (
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ color: "#8b949e", fontSize: 11 }}>
                {confidenceLabel}:{" "}
                <strong style={{ color: "#c9d1d9" }}>{prediction.label}</strong>
              </span>
              <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>
                {prediction.confidence}%
              </span>
            </div>
            <div style={{ height: 5, backgroundColor: "#21262d", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${prediction.confidence}%`,
                  background: "linear-gradient(90deg, #16a34a, #22c55e)",
                  borderRadius: 999,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div>
            <p style={{ color: "#484f58", fontSize: 10, margin: "0 0 7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {tipsLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tips.map((tip, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#8b949e",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 5,
                    padding: "3px 9px",
                  }}
                >
                  {isKo ? tip.labelKo : tip.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: "1px solid #21262d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ color: "#484f58", fontSize: 11 }}>{generatedAt}</span>
          <a
            href={`/${locale}/analysis/${slug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "#22c55e",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {readMore} →
          </a>
        </div>

        {/* Disclaimer */}
        <p style={{ color: "#484f58", fontSize: 10, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
          {disclaimer}
        </p>
      </div>
    </article>
  );
}
