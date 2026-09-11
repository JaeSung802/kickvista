import type { Locale } from "@/lib/i18n";

interface StatRow {
  label: string;
  labelKo: string;
  home: string | number;
  away: string | number;
}

interface KeyStatRow {
  label: string;
  labelKo: string;
  home: string | number;
  away: string | number;
  winner: "home" | "away" | "draw";
}

interface MatchStatisticsProps {
  statistics: StatRow[];
  keyStats: KeyStatRow[] | null;
  isFinished: boolean;
  locale: Locale;
  homeTeamName: string;
  awayTeamName: string;
  statisticsTitle: string;
}

export default function MatchStatistics({
  statistics,
  keyStats,
  isFinished,
  locale,
  homeTeamName,
  awayTeamName,
  statisticsTitle,
}: MatchStatisticsProps) {
  const isKo = locale === "ko";

  return (
    <>
      <section>
        <h3 style={{ color: "#111827", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
          {statisticsTitle}
        </h3>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 0" }}>
          {statistics.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 20px", margin: 0, textAlign: "center" }}>
              {isFinished
                ? (isKo ? "통계 데이터가 없습니다." : "No statistics available.")
                : (isKo ? "경기 시작 후 통계가 표시됩니다." : "Statistics will appear once the match kicks off.")}
            </p>
          ) : null}
          {statistics.map((stat, idx) => {
            const homeNum = typeof stat.home === "string" ? parseInt(stat.home) : stat.home;
            const awayNum = typeof stat.away === "string" ? parseInt(stat.away) : stat.away;
            const total = homeNum + awayNum || 1;
            const homePercent = Math.round((homeNum / total) * 100);
            return (
              <div key={idx} style={{ padding: "12px 20px", borderBottom: idx < statistics.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{stat.home}</span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{isKo ? stat.labelKo : stat.label}</span>
                  <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{stat.away}</span>
                </div>
                <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                  <div style={{ height: "100%", width: `${homePercent}%`, background: "linear-gradient(90deg, #059669, #059669)", borderRadius: "999px 0 0 999px", transition: "width 0.6s ease" }} />
                  <div style={{ height: "100%", width: `${100 - homePercent}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: "0 999px 999px 0", transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Stats Comparison (from recap) — finished matches only */}
      {isFinished && keyStats !== null && keyStats.length > 0 && (
        <section>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {isKo ? "승부를 가른 통계" : "Decisive Stats"}
            </p>
            <div className="flex flex-col gap-4">
              {keyStats.map((stat) => {
                const hv = typeof stat.home === "string" ? parseFloat(stat.home) : stat.home;
                const av = typeof stat.away === "string" ? parseFloat(stat.away) : stat.away;
                const total = hv + av || 1;
                const homePct = Math.round((hv / total) * 100);
                return (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold" style={{ color: stat.winner === "home" ? "#059669" : "#374151" }}>{stat.home}</span>
                      <span className="text-xs text-gray-500 font-medium">{isKo ? stat.labelKo : stat.label}</span>
                      <span className="text-sm font-bold" style={{ color: stat.winner === "away" ? "#2563eb" : "#374151" }}>{stat.away}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${homePct}%`, background: stat.winner === "home" ? "linear-gradient(90deg,#059669,#059669)" : "linear-gradient(90deg,#d1d5db,#9ca3af)", borderRadius: "999px 0 0 999px" }} />
                      <div style={{ width: `${100 - homePct}%`, background: stat.winner === "away" ? "linear-gradient(90deg,#60a5fa,#2563eb)" : "linear-gradient(90deg,#d1d5db,#9ca3af)", borderRadius: "0 999px 999px 0" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block w-3 h-2 rounded-full bg-emerald-500" />
                {homeTeamName}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                {awayTeamName}
                <span className="inline-block w-3 h-2 rounded-full bg-blue-500" />
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
