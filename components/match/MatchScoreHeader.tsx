import Image from "next/image";
import type { Locale } from "@/lib/i18n";

interface MatchScoreHeaderProps {
  locale: Locale;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null | undefined;
  awayScore: number | null | undefined;
  homeScoreHT?: number;
  awayScoreHT?: number;
  leagueSlug: string;
  round?: string;
  venue?: string;
  statusLabel: string;
  isLive: boolean;
  isFinished: boolean;
  backToMatchesLabel: string;
  halfTimeLabel: string;
}

export default function MatchScoreHeader({
  locale,
  homeTeamName,
  awayTeamName,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  homeScoreHT,
  awayScoreHT,
  leagueSlug,
  round,
  venue,
  statusLabel,
  isLive,
  isFinished,
  backToMatchesLabel,
  halfTimeLabel,
}: MatchScoreHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <a
          href={`/${locale}`}
          style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 }}
        >
          {backToMatchesLabel}
        </a>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            {leagueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span style={{ color: "#6b7280", fontSize: 13 }}>{round}</span>
        </div>

        <div className="flex items-start justify-between gap-2">
          {/* Home team */}
          <div className="flex flex-col items-center" style={{ flex: "0 1 120px", width: 120, minWidth: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md flex items-center justify-center p-2 mb-3" style={{ width: 72, height: 72 }}>
              <Image src={homeLogo} alt={homeTeamName} width={52} height={52} className="object-contain" unoptimized />
            </div>
            <h2 className="text-sm font-bold text-gray-800 text-center leading-tight" style={{ wordBreak: "break-word", width: "100%" }}>
              {homeTeamName}
            </h2>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {isLive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 999, padding: "4px 12px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#059669", display: "inline-block" }} />
                <span style={{ color: "#059669", fontSize: 12, fontWeight: 700 }}>{statusLabel}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "12px 20px" }}>
              <span style={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{homeScore ?? "–"}</span>
              <span style={{ color: "#9ca3af", fontSize: 24, fontWeight: 400 }}>:</span>
              <span style={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{awayScore ?? "–"}</span>
            </div>
            {!isLive && (
              <span style={{ color: isFinished ? "#059669" : "#6b7280", fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
            )}
            {homeScoreHT !== undefined && (
              <span style={{ color: "#9ca3af", fontSize: 12 }}>
                {halfTimeLabel}: {homeScoreHT}–{awayScoreHT}
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center" style={{ flex: "0 1 120px", width: 120, minWidth: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md flex items-center justify-center p-2 mb-3" style={{ width: 72, height: 72 }}>
              <Image src={awayLogo} alt={awayTeamName} width={52} height={52} className="object-contain" unoptimized />
            </div>
            <h2 className="text-sm font-bold text-gray-800 text-center leading-tight" style={{ wordBreak: "break-word", width: "100%" }}>
              {awayTeamName}
            </h2>
          </div>
        </div>

        {venue && (
          <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center" as const, marginTop: 16, marginBottom: 0 }}>
            📍 {venue}
          </p>
        )}
      </div>
    </div>
  );
}
