interface AIDisclaimerProps {
  locale: "ko" | "en";
  compact?: boolean;
}

export default function AIDisclaimer({ locale, compact = false }: AIDisclaimerProps) {
  if (compact) {
    return (
      <div
        style={{
          backgroundColor: "#2d2200",
          border: "1px solid #713f12",
          borderRadius: "6px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "14px", flexShrink: 0 }}>⚠️</span>
        <p
          style={{
            color: "#fbbf24",
            fontSize: "12px",
            lineHeight: "1.4",
            margin: 0,
          }}
        >
          {locale === "ko"
            ? "AI 분석은 구조화된 축구 데이터만을 기반으로 생성됩니다. 오락 목적으로만 제공됩니다."
            : "AI predictions are generated from structured football data only. For entertainment purposes. Always gamble responsibly."}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #713f12",
        borderRadius: "10px",
        padding: "16px 18px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "16px" }}>⚠️</span>
        <h4
          style={{
            color: "#fbbf24",
            fontSize: "13px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {locale === "ko" ? "AI 분석 안내" : "AI Disclaimer"}
        </h4>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ color: "#d97706", fontSize: "13px", lineHeight: "1.55", margin: 0 }}>
          {locale === "ko"
            ? "AI 분석은 구조화된 축구 데이터만을 기반으로 생성됩니다. 오락 목적으로만 제공됩니다."
            : "AI predictions are generated from structured football data only. For entertainment purposes. Always gamble responsibly."}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            paddingTop: "10px",
            borderTop: "1px solid #44330d",
          }}
        >
          {/* Detail points */}
          {[
            locale === "ko"
              ? "📊 구조화된 축구 데이터(경기 결과, 통계, 팀 폼)만을 기반으로 생성"
              : "📊 Generated from structured football data only (results, stats, team form)",
            locale === "ko"
              ? "🎯 예측은 참고용이며, 결과를 보장하지 않습니다"
              : "🎯 Predictions are for reference only and do not guarantee results",
            locale === "ko"
              ? "🔞 도박은 책임감 있게 하시기 바랍니다"
              : "🔞 Please gamble responsibly",
          ].map((item, i) => (
            <p key={i} style={{ color: "#8b949e", fontSize: "12px", lineHeight: "1.5", margin: 0 }}>
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
