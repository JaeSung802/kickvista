"use client";

interface RecapCTACardProps {
  locale: "ko" | "en";
  recapTabIdx: number;
}

export default function RecapCTACard({ locale, recapTabIdx }: RecapCTACardProps) {
  const isKo = locale === "ko";

  function handleClick() {

    // 1. Dispatch event so MatchTabNav updates its active highlight
    window.dispatchEvent(
      new CustomEvent<number>("match-switch-tab", { detail: recapTabIdx })
    );

    // 2. Direct DOM scroll as failsafe (bypasses any event delivery issues)
    const section = document.getElementById(`tab-${recapTabIdx}`);
    if (section) {
      const offset = window.innerWidth < 768 ? 110 : 130;
      const y = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      style={{
        background: "linear-gradient(135deg, #059669, #064E3B)",
        borderRadius: 20,
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(22,163,74,0.3)",
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Icon with NEW badge */}
      <div style={{ position: "relative" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
        }}>
          ✨
        </div>
        <span style={{
          position: "absolute", top: -8, right: -8,
          backgroundColor: "#f59e0b",
          color: "#fff",
          fontSize: 9, fontWeight: 900,
          padding: "2px 6px",
          borderRadius: 999,
          lineHeight: 1.4,
        }}>
          NEW
        </span>
      </div>

      {/* Text */}
      <div>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: "0 0 8px", lineHeight: 1.3 }}>
          {isKo ? "AI 전문 분석 리캡이 도착했습니다!" : "Expert AI Recap is Ready!"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: 0, lineHeight: 1.7, maxWidth: 280 }}>
          {isKo
            ? "경기 하이라이트와 승리 요인을 AI가 완벽하게 요약했습니다."
            : "AI has fully summarised the highlights and winning factors."}
        </p>
      </div>

      {/* CTA button */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        color: "#059669",
        fontSize: 14,
        fontWeight: 800,
        padding: "12px 28px",
        borderRadius: 999,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        pointerEvents: "none", // card div handles the click
      }}>
        {isKo ? "지금 리캡 확인하기 →" : "View Full Recap Now →"}
      </div>
    </div>
  );
}
