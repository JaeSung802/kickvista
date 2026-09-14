import type { Locale } from "@/lib/i18n";
import type { Prediction, PredictionStats } from "@/components/match/PredictionCard";
import PredictionCard from "@/components/match/PredictionCard";
import AdSlot from "@/components/ads/AdSlot";

interface MatchSidebarProps {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  isLive: boolean;
  isFinished: boolean;
  isInactive: boolean;
  userPoints: number | null;
  initialPrediction: Prediction | null;
  initialStats: PredictionStats;
  locale: Locale;
  loginUrl: string;
  sidebarAdSlotId: string;
  leagueSlug: string;
  round: string;
  date: string;
  venue?: string;
}

export default function MatchSidebar({
  matchId,
  homeTeamName,
  awayTeamName,
  isLive,
  isFinished,
  isInactive,
  userPoints,
  initialPrediction,
  initialStats,
  locale,
  loginUrl,
  sidebarAdSlotId,
  leagueSlug,
  round,
  date,
  venue,
}: MatchSidebarProps) {
  const isKo = locale === "ko";

  return (
    <div className="flex flex-col gap-6">

      <PredictionCard
        matchId={matchId}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        isLive={isLive}
        isFinished={isFinished}
        isInactive={isInactive}
        userPoints={userPoints}
        initialPrediction={initialPrediction}
        initialStats={initialStats}
        locale={locale}
        loginUrl={loginUrl}
      />

      <AdSlot slotId={sidebarAdSlotId} size="rectangle" />

      {/* Match info card (compact sidebar reference) */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <h4 style={{ color: "#111827", fontSize: 13, fontWeight: 700, margin: 0 }}>
          {isKo ? "경기 정보" : "Match Info"}
        </h4>
        {[
          { label: isKo ? "대회" : "Competition", value: leagueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
          { label: isKo ? "라운드" : "Round", value: round },
          { label: isKo ? "날짜" : "Date", value: date.split("T")[0] },
          { label: isKo ? "경기장" : "Venue", value: venue ?? "–" },
        ].map(({ label, value }) => (
          <div key={label}>
            <span style={{ color: "#9ca3af", fontSize: 11, display: "block", marginBottom: 2 }}>{label}</span>
            <span style={{ color: "#374151", fontSize: 13 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
