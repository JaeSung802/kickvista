"use client";

interface AttendanceWidgetProps {
  totalDays: number;
  currentStreak: number;
  totalPoints: number;
  rankTier: "bronze" | "silver" | "gold" | "platinum" | "legend";
  rankLabel: string;
  rankColor: string;
  rankBadge: string;
  hasCheckedInToday: boolean;
  onCheckIn?: () => void;
  locale: "ko" | "en";
  progressToNextRank: number; // 0–100
}

const t = {
  en: {
    attendance: "Attendance",
    points: "Points",
    streak: "Streak",
    days: "days",
    checkIn: "Check In Today",
    checkedIn: "Checked In",
    nextRank: "Progress to next rank",
  },
  ko: {
    attendance: "출석 체크",
    points: "포인트",
    streak: "연속 출석",
    days: "일",
    checkIn: "오늘 출석 체크",
    checkedIn: "출석 완료",
    nextRank: "다음 등급까지",
  },
};

export default function AttendanceWidget({
  totalDays,
  currentStreak,
  totalPoints,
  rankLabel,
  rankColor,
  rankBadge,
  hasCheckedInToday,
  onCheckIn,
  locale,
  progressToNextRank,
}: AttendanceWidgetProps) {
  const tx = t[locale];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Rank color top stripe */}
      <div style={{ height: 3, backgroundColor: rankColor }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{tx.attendance}</h3>
          {/* Rank badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-gray-50 border"
            style={{ borderColor: `${rankColor}40` }}
          >
            <span className="text-sm">{rankBadge}</span>
            <span className="text-xs font-bold" style={{ color: rankColor }}>{rankLabel}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          {/* Points */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-emerald-600 tabular-nums">
              {totalPoints.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">{tx.points}</span>
          </div>

          <div className="w-px h-9 bg-gray-200" />

          {/* Streak */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-gray-800 tabular-nums">
              🔥 {currentStreak}
            </span>
            <span className="text-xs text-gray-400">{tx.streak}</span>
          </div>

          <div className="w-px h-9 bg-gray-200" />

          {/* Total days */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-gray-800 tabular-nums">{totalDays}</span>
            <span className="text-xs text-gray-400">{tx.days}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">{tx.nextRank}</span>
            <span className="text-xs text-gray-400">{progressToNextRank}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressToNextRank)}%` }}
            />
          </div>
        </div>

        {/* Check-in button */}
        <button
          onClick={hasCheckedInToday ? undefined : () => { onCheckIn?.(); fetch("/api/attendance/check-in", { method: "POST" }); }}
          disabled={hasCheckedInToday}
          className={`w-full py-3 rounded-lg text-sm font-bold transition-opacity ${
            hasCheckedInToday
              ? "bg-gray-100 text-gray-400 cursor-default"
              : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
          }`}
        >
          {hasCheckedInToday ? `✓ ${tx.checkedIn}` : tx.checkIn}
        </button>
      </div>
    </div>
  );
}
