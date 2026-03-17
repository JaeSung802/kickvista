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
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Rank color top stripe */}
      <div style={{ height: 2, backgroundColor: rankColor }} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: 0 }}>
          {tx.attendance}
        </h3>
        {/* Rank badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(0,0,0,0.25)",
            border: `1px solid ${rankColor}40`,
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          <span style={{ fontSize: 14 }}>{rankBadge}</span>
          <span style={{ color: rankColor, fontSize: 12, fontWeight: 700 }}>{rankLabel}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        {/* Points */}
        <div className="flex flex-col items-center gap-1">
          <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 800 }}>
            {totalPoints.toLocaleString()}
          </span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.points}</span>
        </div>

        <div style={{ width: 1, height: 36, backgroundColor: "#30363d" }} />

        {/* Streak */}
        <div className="flex flex-col items-center gap-1">
          <span style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800 }}>
            🔥 {currentStreak}
          </span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.streak}</span>
        </div>

        <div style={{ width: 1, height: 36, backgroundColor: "#30363d" }} />

        {/* Total days */}
        <div className="flex flex-col items-center gap-1">
          <span style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800 }}>{totalDays}</span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.days}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.nextRank}</span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>{progressToNextRank}%</span>
        </div>
        <div
          style={{
            height: 6,
            backgroundColor: "#0d1117",
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid #30363d",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, progressToNextRank)}%`,
              backgroundColor: rankColor,
              borderRadius: 999,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Check-in button */}
      <button
        onClick={hasCheckedInToday ? undefined : () => { onCheckIn?.(); fetch("/api/attendance/check-in", { method: "POST" }); }}
        disabled={hasCheckedInToday}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: hasCheckedInToday ? "default" : "pointer",
          border: "none",
          backgroundColor: hasCheckedInToday ? "#21262d" : "#22c55e",
          color: hasCheckedInToday ? "#8b949e" : "#0d1117",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!hasCheckedInToday) e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        {hasCheckedInToday ? `✓ ${tx.checkedIn}` : tx.checkIn}
      </button>
      </div>
    </div>
  );
}
