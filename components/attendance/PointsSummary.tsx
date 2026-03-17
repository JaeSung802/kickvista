"use client";

interface PointsSummaryProps {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  pointsThisWeek: number;
  locale: "ko" | "en";
}

interface StatBoxProps {
  icon: string;
  value: string | number;
  label: string;
  accent?: boolean;
  accentColor?: string;
}

function StatBox({ icon, value, label, accent = false, accentColor = "#22c55e" }: StatBoxProps) {
  return (
    <div
      style={{
        backgroundColor: "#0d1117",
        border: `1px solid ${accent ? accentColor + "55" : "#30363d"}`,
        borderRadius: "8px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        flex: 1,
        minWidth: "90px",
      }}
    >
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <span
        style={{
          color: accent ? accentColor : "#e6edf3",
          fontSize: "20px",
          fontWeight: 800,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ color: "#8b949e", fontSize: "11px", textAlign: "center", lineHeight: "1.3" }}>
        {label}
      </span>
    </div>
  );
}

const STREAK_BONUSES = [
  { days: 3,  bonus: 5,  labelEn: "3-day streak",   labelKo: "3일 연속" },
  { days: 7,  bonus: 15, labelEn: "7-day streak",   labelKo: "7일 연속" },
  { days: 14, bonus: 30, labelEn: "14-day streak",  labelKo: "14일 연속" },
  { days: 30, bonus: 70, labelEn: "30-day streak",  labelKo: "30일 연속" },
];

export default function PointsSummary({
  totalPoints,
  currentStreak,
  longestStreak,
  totalDays,
  pointsThisWeek,
  locale,
}: PointsSummaryProps) {
  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Total points */}
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#8b949e", fontSize: "12px", margin: "0 0 4px 0", fontWeight: 500 }}>
          {locale === "ko" ? "총 포인트" : "Total Points"}
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: "#22c55e",
              fontSize: "48px",
              fontWeight: 900,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {totalPoints.toLocaleString()}
          </span>
          <span style={{ color: "#22c55e", fontSize: "18px", fontWeight: 700 }}>
            {locale === "ko" ? "pt" : "pts"}
          </span>
        </div>
      </div>

      {/* This week badge */}
      <div
        style={{
          backgroundColor: "#0d2818",
          border: "1px solid #166534",
          borderRadius: "8px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>📅</span>
        <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600 }}>
          {locale === "ko"
            ? `이번 주 +${pointsThisWeek} 포인트 획득`
            : `+${pointsThisWeek} pts earned this week`}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <StatBox
          icon="🔥"
          value={currentStreak}
          label={locale === "ko" ? "현재 연속" : "Current Streak"}
          accent
          accentColor="#f97316"
        />
        <StatBox
          icon="🏆"
          value={longestStreak}
          label={locale === "ko" ? "최장 연속" : "Longest Streak"}
          accentColor="#ffd700"
        />
        <StatBox
          icon="📆"
          value={totalDays}
          label={locale === "ko" ? "총 출석일" : "Total Days"}
          accentColor="#60a5fa"
        />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "#21262d" }} />

      {/* How to earn points */}
      <div>
        <h4
          style={{
            color: "#e6edf3",
            fontSize: "13px",
            fontWeight: 700,
            margin: "0 0 12px 0",
          }}
        >
          {locale === "ko" ? "포인트 획득 방법" : "How to Earn Points"}
        </h4>

        {/* Base points */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            backgroundColor: "#0d1117",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>✅</span>
            <span style={{ color: "#c9d1d9", fontSize: "13px" }}>
              {locale === "ko" ? "일일 출석 체크" : "Daily check-in"}
            </span>
          </div>
          <span
            style={{
              color: "#22c55e",
              fontSize: "13px",
              fontWeight: 700,
              backgroundColor: "#0d2818",
              border: "1px solid #166534",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            +10 pts
          </span>
        </div>

        {/* Streak bonuses table */}
        <div
          style={{
            border: "1px solid #30363d",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: "#21262d",
              padding: "6px 10px",
            }}
          >
            <span style={{ color: "#8b949e", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
              {locale === "ko" ? "연속 출석" : "Streak"}
            </span>
            <span style={{ color: "#8b949e", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", textAlign: "right" }}>
              {locale === "ko" ? "보너스" : "Bonus"}
            </span>
          </div>

          {/* Rows */}
          {STREAK_BONUSES.map((row, i) => {
            const isActive = currentStreak >= row.days;
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  padding: "7px 10px",
                  backgroundColor: isActive ? "#0d2818" : "transparent",
                  borderTop: "1px solid #21262d",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isActive && <span style={{ fontSize: "11px" }}>✅</span>}
                  {!isActive && <span style={{ fontSize: "11px", opacity: 0.4 }}>⬜</span>}
                  <span style={{ color: isActive ? "#4ade80" : "#8b949e", fontSize: "12px" }}>
                    {locale === "ko" ? row.labelKo : row.labelEn}
                  </span>
                </div>
                <span
                  style={{
                    color: isActive ? "#22c55e" : "#8b949e",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  +{row.bonus} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
