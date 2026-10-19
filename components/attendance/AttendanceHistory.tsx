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
  /** today's check-in day (UTC date, YYYY-MM-DD); defaults to the last day of the history */
  today?: string;
}

const t = {
  en: {
    title: "Attendance History",
    subtitle: "Last 30 days · a new day starts at 9:00 AM KST",
    today: "Today",
    todayDone: "checked in",
    todayOpen: "not checked in yet",
    checkedDays: "Days checked in",
    days: "days",
    empty: "No check-ins in the last 30 days.",
    note: "For reference only. Streaks and rewards use the check-in records shown in the check-in card.",
    checked: "Checked In",
    missed: "Missed",
  },
  ko: {
    title: "출석 기록",
    subtitle: "최근 30일 · 매일 오전 9시(KST)에 날짜가 바뀝니다",
    today: "오늘",
    todayDone: "출석",
    todayOpen: "아직 출석 전",
    checkedDays: "출석한 날",
    days: "일",
    empty: "최근 30일 동안 출석 기록이 없습니다.",
    note: "기록 확인용입니다. 연속 출석과 보상은 출석 체크 카드의 기록 기준입니다.",
    checked: "출석",
    missed: "미출석",
  },
};

/** Day of month from "YYYY-MM-DD" — no Date parsing, so no time-zone shift. */
function formatDay(dateStr: string): string {
  return String(Number(dateStr.slice(8, 10)));
}

export default function AttendanceHistory({ history, locale, today }: AttendanceHistoryProps) {
  const tx = t[locale];

  const sorted = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  const todayDate = today ?? sorted[sorted.length - 1]?.date ?? null;

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
      {/* Today = amber ring + label (independent of check-in); green fill = a recorded check-in only. */}
      <div className="grid gap-x-1.5 gap-y-4 pb-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {sorted.map((entry) => {
          const isToday = entry.date === todayDate;
          return (
            <div key={entry.date} className="relative">
              <div
                title={entry.date}
                aria-label={isToday ? `${entry.date} · ${tx.today} · ${entry.checkedIn ? tx.todayDone : tx.todayOpen}` : entry.date}
                aria-current={isToday ? "date" : undefined}
                className={`aspect-square rounded-full flex items-center justify-center text-xs cursor-default ${
                  entry.checkedIn
                    ? "bg-emerald-500 text-white font-semibold"
                    : isToday
                      ? "bg-white text-gray-800 font-black border border-amber-300"
                      : "bg-gray-100 text-gray-400 font-semibold border border-gray-200"
                } ${isToday ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-white" : ""}`}
              >
                {formatDay(entry.date)}
              </div>
              {isToday && (
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] leading-none font-bold text-amber-700 whitespace-nowrap">
                  {tx.today}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">{tx.checked}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200" />
          <span className="text-xs text-gray-500">{tx.missed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-amber-500" />
          <span className="text-xs text-gray-500">{tx.today}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{tx.note}</p>
    </div>
  );
}
