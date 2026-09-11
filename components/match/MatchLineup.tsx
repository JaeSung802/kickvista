import type { Locale } from "@/lib/i18n";
import type { LineupPlayer } from "@/lib/football/types";

function posLabel(i: number, total: number): string {
  if (i === 0) return "GK";
  if (total >= 11) {
    if (i <= 4) return "DF";
    if (i <= 7) return "MF";
    return "FW";
  }
  return String(i + 1);
}

const POS_MAP: Record<string, string> = { G: "GK", D: "DF", M: "MF", F: "FW" };

function LineupCard({
  players,
  teamName,
  teamFlag,
  accent,
  bg,
}: {
  players: LineupPlayer[];
  teamName: string;
  teamFlag: string;
  accent: string;
  bg: string;
}) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{teamFlag}</span>
        <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{teamName}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#9ca3af", backgroundColor: "#f3f4f6", borderRadius: 4, padding: "2px 6px" }}>
          {players.length === 11 ? "XI" : `${players.length}명`}
        </span>
      </div>
      {players.map((player, i) => {
        const pos = player.pos ? (POS_MAP[player.pos] ?? player.pos) : posLabel(i, players.length);
        const isGK = pos === "GK";
        const jerseyNum = player.number ?? i + 1;
        return (
          <div key={i} style={{ padding: "9px 16px", borderBottom: i < players.length - 1 ? "1px solid #f9fafb" : "none", display: "flex", alignItems: "center", gap: 10, backgroundColor: isGK ? `${bg}` : "transparent" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", backgroundColor: isGK ? accent : bg, border: `1.5px solid ${accent}`, color: isGK ? "#fff" : accent, fontSize: 10, fontWeight: 800, flexShrink: 0, boxShadow: `0 1px 4px ${accent}40` }}>
              {jerseyNum}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: accent, backgroundColor: bg, borderRadius: 3, padding: "1px 4px", flexShrink: 0, lineHeight: 1.5, border: `1px solid ${accent}30` }}>
              {pos}
            </span>
            <span style={{ color: "#1f2937", fontSize: 13, fontWeight: isGK ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface MatchLineupProps {
  lineupHome: LineupPlayer[];
  lineupAway: LineupPlayer[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamFlag: string;
  awayTeamFlag: string;
  locale: Locale;
  lineupTitle: string;
}

export default function MatchLineup({
  lineupHome,
  lineupAway,
  homeTeamName,
  awayTeamName,
  homeTeamFlag,
  awayTeamFlag,
  locale,
  lineupTitle,
}: MatchLineupProps) {
  const isKo = locale === "ko";
  const hasLineup = lineupHome.length > 0 || lineupAway.length > 0;

  return (
    <section>
      <h3 style={{ color: "#111827", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
        {lineupTitle}
      </h3>
      {!hasLineup ? (
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
          <span style={{ fontSize: 36 }}>📋</span>
          <p style={{ color: "#374151", fontSize: 14, fontWeight: 700, margin: 0 }}>
            {isKo ? "라인업 정보 없음" : "Lineup Unavailable"}
          </p>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
            {isKo
              ? "이 경기의 선발 라인업이 아직 공개되지 않았습니다."
              : "The starting lineup for this match has not been announced yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LineupCard players={lineupHome} teamName={homeTeamName} teamFlag={homeTeamFlag} accent="#059669" bg="rgba(22,163,74,0.08)" />
          <LineupCard players={lineupAway} teamName={awayTeamName} teamFlag={awayTeamFlag} accent="#2563eb" bg="rgba(37,99,235,0.07)" />
        </div>
      )}
    </section>
  );
}
