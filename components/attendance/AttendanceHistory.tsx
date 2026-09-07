"use client";

import { useState } from "react";

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

const tx = {
  en: {
    subtitle: "Last 30 days",
    currentStreak: "Current Streak",
    totalPoints: "Period Points",
    days: "days",
    pts: "pts",
    checked: "Checked In",
    missed: "Missed",
    noData: "No data",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
  ko: {
    subtitle: "최근 30일",
    currentStreak: "연속 출석",
    totalPoints: "기간 포인트",
    days: "일",
    pts: "pts",
    checked: "출석",
    missed: "미출석",
    noData: "기록 없음",
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    months: [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월",
    ],
  },
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AttendanceHistory({ history, locale }: AttendanceHistoryProps) {
  const t = tx[locale];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  // Index history by date for O(1) lookup
  const historyMap = new Map(history.map((h) => [h.date, h]));

  // Stats (last 30 days)
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const totalPoints = sorted.reduce((s, d) => s + d.pointsEarned, 0);
  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].checkedIn) currentStreak++;
    else break;
  }

  // Month navigation — start on current month
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    // Don't navigate past current month
    if (nextY > today.getFullYear() || (nextY === today.getFullYear() && nextM > today.getMonth())) return;
    setViewYear(nextY);
    setViewMonth(nextM);
  }

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday

  // Earliest date in history (to know "no data" range)
  const minDate = sorted.length > 0 ? sorted[0].date : todayStr;

  // Cells: null = padding, Date = actual day
  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  // Pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 text-center">
          <div className="text-lg font-black text-emerald-600 tabular-nums">
            🔥 {currentStreak}
            <span className="text-xs font-medium ml-0.5">{t.days}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{t.currentStreak}</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 text-center">
          <div className="text-lg font-black text-gray-800 tabular-nums">
            {totalPoints.toLocaleString()}
            <span className="text-xs font-medium ml-0.5">{t.pts}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{t.totalPoints}</div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="previous month"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gray-800">
          {viewYear}년 {t.months[viewMonth]}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="next month"
        >
          ›
        </button>
      </div>

      {/* Calendar */}
      <div className="flex flex-col gap-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {t.weekdays.map((wd, i) => (
            <div
              key={wd}
              className={`text-center text-[10px] font-bold py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((date, idx) => {
            if (!date) {
              return <div key={`pad-${idx}`} />;
            }

            const dateStr = toDateStr(date);
            const entry = historyMap.get(dateStr);
            const isFuture = date > today;
            const isToday = dateStr === todayStr;
            const inHistory = dateStr >= minDate;
            const dayNum = date.getDate();
            const isSun = date.getDay() === 0;
            const isSat = date.getDay() === 6;

            // Visual state
            let cellClass = "";
            let icon: React.ReactNode = null;

            if (isFuture) {
              cellClass = "text-gray-300";
            } else if (entry?.checkedIn) {
              cellClass = "bg-emerald-500 text-white";
              icon = (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute bottom-0.5 right-0.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              );
            } else if (inHistory) {
              // Missed day within history window
              cellClass = "bg-red-50 text-red-400 border border-red-100";
            } else {
              // Before history window — no data
              cellClass = "text-gray-300";
            }

            return (
              <div
                key={dateStr}
                title={
                  entry
                    ? entry.checkedIn
                      ? `${dateStr} · +${entry.pointsEarned}pts`
                      : `${dateStr} · ${t.missed}`
                    : isFuture
                    ? ""
                    : t.noData
                }
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold select-none transition-all ${cellClass} ${
                  isToday ? "ring-2 ring-emerald-500 ring-offset-1" : ""
                }`}
              >
                <span className={`leading-none ${isSun && !entry?.checkedIn && !isFuture ? "text-red-400" : ""} ${isSat && !entry?.checkedIn && !isFuture ? "text-blue-400" : ""}`}>
                  {dayNum}
                </span>
                {entry?.checkedIn && entry.pointsEarned > 0 && (
                  <span className="text-[8px] leading-none opacity-80 mt-0.5">+{entry.pointsEarned}</span>
                )}
                {icon}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500 flex items-center justify-center">
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">{t.checked}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-100" />
          <span className="text-xs text-gray-500">{t.missed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-dashed border-gray-200" />
          <span className="text-xs text-gray-500">{t.noData}</span>
        </div>
      </div>
    </div>
  );
}
