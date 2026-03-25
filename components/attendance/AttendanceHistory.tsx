"use client";

interface HistoryEntry {
  date: string;       // "YYYY-MM-DD"
  checkedIn: boolean;
  streakDay: number;
  pointsEarned: number;
}

interface AttendanceHistoryProps {
  history: HistoryEntry[];
  locale: "ko" | "en";
}

const t = {
  en: {
    title: "Attendance History",
    subtitle: "Last 30 days",
    currentStreak: "Current Streak",
    totalPoints: "Total Points",
    days: "days",
    pts: "pts",
    checked: "Checked In",
    missed: "Missed",
  },
  ko: {
    title: "출석 기록",
    subtitle: "최근 30일",
    currentStreak: "연속 출석",
    totalPoints: "누적 포인트",
    days: "일",
    pts: "pts",
    checked: "출석",
    missed: "미출석",
  },
};

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return String(d.getDate());
}

export default function AttendanceHistory({ history, locale }: AttendanceHistoryProps) {
  const tx = t[locale];

  const sorted = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const totalPoints = sorted.reduce((s, d) => s + d.pointsEarned, 0);

  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].checkedIn) currentStreak++;
    else break;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">{tx.title}</h3>
          <p className="text-xs text-gray-400">{tx.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 text-center">
          <div className="text-lg font-black text-emerald-600 tabular-nums">
            🔥 {currentStreak}
            <span className="text-xs font-medium ml-0.5">{tx.days}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{tx.currentStreak}</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 text-center">
          <div className="text-lg font-black text-gray-800 tabular-nums">
            {totalPoints.toLocaleString()}
            <span className="text-xs font-medium ml-0.5">{tx.pts}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{tx.totalPoints}</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {sorted.map((entry) => (
          <div
            key={entry.date}
            title={`${entry.date}${entry.checkedIn ? ` · +${entry.pointsEarned}pts` : ""}`}
            className={`aspect-square rounded-full flex items-center justify-center text-xs font-semibold cursor-default transition-transform ${
              entry.checkedIn
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-400 border border-gray-200"
            }`}
          >
            {formatDay(entry.date)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">{tx.checked}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200" />
          <span className="text-xs text-gray-500">{tx.missed}</span>
        </div>
      </div>
    </div>
  );
}
