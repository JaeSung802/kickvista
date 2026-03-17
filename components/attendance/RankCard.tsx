"use client";

type RankTier = "bronze" | "silver" | "gold" | "platinum" | "legend";

interface RankCardProps {
  tier: RankTier;
  label: string;
  labelKo: string;
  color: string;
  badge: string;
  minPoints: number;
  maxPoints: number | null;
  isCurrentRank: boolean;
  locale: "ko" | "en";
}

const TIER_PERKS: Record<RankTier, { en: string; ko: string }[]> = {
  bronze: [
    { en: "Daily check-in", ko: "매일 출석 체크" },
    { en: "10 base points/day", ko: "기본 10포인트/일" },
    { en: "Community access", ko: "커뮤니티 이용 가능" },
  ],
  silver: [
    { en: "+5 streak bonus", ko: "연속 출석 보너스 +5" },
    { en: "Custom nickname color", ko: "닉네임 색상 변경" },
    { en: "All Bronze perks", ko: "브론즈 혜택 포함" },
  ],
  gold: [
    { en: "Priority AI analysis", ko: "AI 분석 우선 제공" },
    { en: "+10 streak bonus", ko: "연속 출석 보너스 +10" },
    { en: "Gold badge display", ko: "골드 배지 표시" },
    { en: "All Silver perks", ko: "실버 혜택 포함" },
  ],
  platinum: [
    { en: "Community badge", ko: "커뮤니티 배지" },
    { en: "Exclusive match previews", ko: "경기 프리뷰 독점 제공" },
    { en: "+20 streak bonus", ko: "연속 출석 보너스 +20" },
    { en: "All Gold perks", ko: "골드 혜택 포함" },
  ],
  legend: [
    { en: "Legend status", ko: "레전드 지위" },
    { en: "Unique Legend badge", ko: "유니크 레전드 배지" },
    { en: "Top community ranking", ko: "커뮤니티 랭킹 상단 표시" },
    { en: "+35 streak bonus", ko: "연속 출석 보너스 +35" },
    { en: "All Platinum perks", ko: "플래티넘 혜택 포함" },
  ],
};

export default function RankCard({
  tier,
  label,
  labelKo,
  color,
  badge,
  minPoints,
  maxPoints,
  isCurrentRank,
  locale,
}: RankCardProps) {
  const perks = TIER_PERKS[tier];
  const displayLabel = locale === "ko" ? labelKo : label;

  const pointsText =
    maxPoints !== null
      ? locale === "ko"
        ? `${minPoints.toLocaleString()} ~ ${maxPoints.toLocaleString()} 포인트`
        : `${minPoints.toLocaleString()} – ${maxPoints.toLocaleString()} pts`
      : locale === "ko"
      ? `${minPoints.toLocaleString()}+ 포인트`
      : `${minPoints.toLocaleString()}+ pts`;

  return (
    <div
      style={{
        backgroundColor: isCurrentRank ? "#0d1117" : "#161b22",
        border: `2px solid ${isCurrentRank ? color : "#30363d"}`,
        borderRadius: "12px",
        padding: "18px",
        position: "relative",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: isCurrentRank ? `0 0 16px ${color}33` : "none",
      }}
    >
      {/* Current rank indicator */}
      {isCurrentRank && (
        <div
          style={{
            position: "absolute",
            top: "-1px",
            right: "14px",
            backgroundColor: color,
            color: "#0d1117",
            fontSize: "10px",
            fontWeight: 800,
            padding: "2px 10px",
            borderRadius: "0 0 6px 6px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {locale === "ko" ? "현재 등급" : "Current"}
        </div>
      )}

      {/* Badge + tier name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "36px",
            lineHeight: 1,
            filter: isCurrentRank ? "drop-shadow(0 0 6px rgba(255,255,255,0.3))" : "none",
          }}
        >
          {badge}
        </span>
        <div>
          <h3
            style={{
              color: color,
              fontSize: "16px",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {displayLabel}
          </h3>
          <p style={{ color: "#8b949e", fontSize: "12px", margin: "3px 0 0 0" }}>
            {pointsText}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          backgroundColor: isCurrentRank ? `${color}44` : "#21262d",
          marginBottom: "12px",
        }}
      />

      {/* Perks list */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
        {perks.map((perk, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: isCurrentRank ? "#e6edf3" : "#8b949e",
              fontSize: "13px",
            }}
          >
            <span style={{ color: color, fontSize: "10px", flexShrink: 0 }}>✦</span>
            {locale === "ko" ? perk.ko : perk.en}
          </li>
        ))}
      </ul>
    </div>
  );
}
