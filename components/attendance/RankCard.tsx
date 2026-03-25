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
      className={`relative rounded-xl border-2 shadow-sm transition-shadow bg-white ${
        isCurrentRank ? "shadow-md border-gray-300" : "border-gray-200"
      }`}
      style={{
        borderColor: isCurrentRank ? color : undefined,
        padding: "18px",
      }}
    >
      {/* Current rank indicator */}
      {isCurrentRank && (
        <div
          className="absolute top-0 right-3.5 text-xs font-black uppercase tracking-wide px-2.5 py-0.5 rounded-b-md text-white"
          style={{ backgroundColor: color, fontSize: 10 }}
        >
          {locale === "ko" ? "현재 등급" : "Current"}
        </div>
      )}

      {/* Badge + tier name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl leading-none">{badge}</span>
        <div>
          {/* Title always in gray-900 for readability — color accent on the bullet icons */}
          <h3 className="text-base font-black leading-tight text-gray-900">
            {displayLabel}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">{pointsText}</p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mb-3"
        style={{ height: 1, backgroundColor: isCurrentRank ? `${color}33` : "#e5e7eb" }}
      />

      {/* Perks list */}
      <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
        {perks.map((perk, i) => (
          <li
            key={i}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span className="text-xs shrink-0" style={{ color }}>✦</span>
            {locale === "ko" ? perk.ko : perk.en}
          </li>
        ))}
      </ul>
    </div>
  );
}
