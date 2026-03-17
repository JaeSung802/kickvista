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

  // Sort by date ascending, take last 30
  const sorted = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const totalPoints = sorted.reduce((s, d) => s + d.pointsEarned, 0);

  // Compute current streak from the end
  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].checkedIn) currentStreak++;
    else break;
  }

  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>
            {tx.title}
          </h3>
          <p style={{ color: "#8b949e", fontSize: 12, margin: 0 }}>{tx.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div
          style={{
            flex: 1,
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "10px 14px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 800 }}>
            🔥 {currentStreak}
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 2 }}>{tx.days}</span>
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>{tx.currentStreak}</div>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "10px 14px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800 }}>
            {totalPoints.toLocaleString()}
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 2 }}>{tx.pts}</span>
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 2 }}>{tx.totalPoints}</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 6,
        }}
      >
        {sorted.map((entry) => (
          <div
            key={entry.date}
            title={`${entry.date}${entry.checkedIn ? ` · +${entry.pointsEarned}pts` : ""}`}
            style={{
              aspectRatio: "1",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
              cursor: "default",
              backgroundColor: entry.checkedIn ? "#22c55e" : "#21262d",
              color: entry.checkedIn ? "#0d1117" : "#484f58",
              border: entry.checkedIn ? "none" : "1px solid #30363d",
              transition: "transform 0.1s",
            }}
          >
            {formatDay(entry.date)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
            }}
          />
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.checked}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
            }}
          />
          <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.missed}</span>
        </div>
      </div>
    </div>
  );
}
