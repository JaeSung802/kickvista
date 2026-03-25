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

function StatBox({ icon, value, label, accent = false, accentColor = "#059669" }: StatBoxProps) {
  return (
    <div className="flex-1 min-w-22.5 bg-gray-50 border border-gray-100 rounded-lg p-3.5 flex flex-col items-center gap-1">
      <span className="text-xl">{icon}</span>
      <span
        className="text-xl font-black tabular-nums leading-none"
        style={{ color: accent ? accentColor : "#111827" }}
      >
        {value}
      </span>
      <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

const STREAK_BONUSES = [
  { days: 3,  bonus: 5,  labelEn: "3-day streak",  labelKo: "3일 연속" },
  { days: 7,  bonus: 15, labelEn: "7-day streak",  labelKo: "7일 연속" },
  { days: 14, bonus: 30, labelEn: "14-day streak", labelKo: "14일 연속" },
  { days: 30, bonus: 70, labelEn: "30-day streak", labelKo: "30일 연속" },
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-5 shadow-sm">
      {/* Total points */}
      <div className="text-center">
        <p className="text-xs text-gray-400 font-medium mb-1">
          {locale === "ko" ? "총 포인트" : "Total Points"}
        </p>
        <div className="inline-flex items-baseline gap-1.5">
          <span className="text-5xl font-black text-emerald-600 tabular-nums leading-none" style={{ letterSpacing: "-0.02em" }}>
            {totalPoints.toLocaleString()}
          </span>
          <span className="text-lg font-bold text-emerald-600">
            {locale === "ko" ? "pt" : "pts"}
          </span>
        </div>
      </div>

      {/* This week badge */}
      <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
        <span className="text-base">📅</span>
        <span className="text-sm font-semibold text-emerald-700">
          {locale === "ko"
            ? `이번 주 +${pointsThisWeek} 포인트 획득`
            : `+${pointsThisWeek} pts earned this week`}
        </span>
      </div>

      {/* Stats grid */}
      <div className="flex gap-2 flex-wrap">
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
        />
        <StatBox
          icon="📆"
          value={totalDays}
          label={locale === "ko" ? "총 출석일" : "Total Days"}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* How to earn points */}
      <div>
        <h4 className="text-xs font-bold text-gray-900 mb-3">
          {locale === "ko" ? "포인트 획득 방법" : "How to Earn Points"}
        </h4>

        {/* Base points */}
        <div className="flex items-center justify-between px-2.5 py-2 bg-gray-50 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">✅</span>
            <span className="text-xs text-gray-700">
              {locale === "ko" ? "일일 출석 체크" : "Daily check-in"}
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            +10 pts
          </span>
        </div>

        {/* Streak bonuses table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid bg-gray-50 px-2.5 py-1.5 border-b border-gray-200" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <span className="text-xs font-semibold uppercase text-gray-400">
              {locale === "ko" ? "연속 출석" : "Streak"}
            </span>
            <span className="text-xs font-semibold uppercase text-gray-400 text-right">
              {locale === "ko" ? "보너스" : "Bonus"}
            </span>
          </div>

          {/* Rows */}
          {STREAK_BONUSES.map((row, i) => {
            const isActive = currentStreak >= row.days;
            return (
              <div
                key={i}
                className={`grid px-2.5 py-1.5 border-t border-gray-100 ${isActive ? "bg-emerald-50" : ""}`}
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{isActive ? "✅" : <span style={{ opacity: 0.4 }}>⬜</span>}</span>
                  <span className={`text-xs ${isActive ? "text-emerald-700 font-medium" : "text-gray-400"}`}>
                    {locale === "ko" ? row.labelKo : row.labelEn}
                  </span>
                </div>
                <span className={`text-xs font-bold text-right ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
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
