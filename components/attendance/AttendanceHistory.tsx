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
    checkedDays: "Days checked in",
    days: "days",
    empty: "No check-ins in the last 30 days.",
    note: "For reference only. Streaks and rewards use the check-in records shown in the check-in card.",
    checked: "Checked In",
    missed: "Missed",
  },
  ko: {
    title: "출석 기록",
    subtitle: "최근 30일",
    checkedDays: "출석한 날",
    days: "일",
    empty: "최근 30일 동안 출석 기록이 없습니다.",
    note: "기록 확인용입니다. 연속 출석과 보상은 출석 체크 카드의 기록 기준입니다.",
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

  // No streak or point totals here: these rows include check-ins from before
  // the trusted records (policy A), so only the days are shown.
  const checkedDays = sorted.filter((d) => d.checkedIn).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">{tx.title}</h3>
          <p className="text-xs text-gray-400">{tx.subtitle}</p>
        </div>
      </div>

      {/* Days checked in (display only) */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{tx.checkedDays}</span>
        <span className="text-lg font-black text-gray-800 tabular-nums">
          {checkedDays}
          <span className="text-xs font-medium ml-0.5">{tx.days}</span>
        </span>
      </div>
      {checkedDays === 0 && <p className="text-sm text-gray-500 -mt-1">{tx.empty}</p>}

      {/* Calendar grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {sorted.map((entry) => (
          <div
            key={entry.date}
            title={entry.date}
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
      <p className="text-xs text-gray-400 leading-relaxed">{tx.note}</p>
    </div>
  );
}
