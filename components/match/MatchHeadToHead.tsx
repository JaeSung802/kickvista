import Image from "next/image";
import type { H2HData, Team } from "@/lib/football/types";
import type { Locale } from "@/lib/i18n";
import { LEAGUE_IDS } from "@/lib/football/constants";

const SUPPORTED_LEAGUE_IDS = new Set(LEAGUE_IDS);

interface MatchHeadToHeadProps {
  data: H2HData;
  homeTeam: Team;
  awayTeam: Team;
  locale: Locale;
}

export default function MatchHeadToHead({
  data,
  homeTeam,
  awayTeam,
  locale,
}: MatchHeadToHeadProps) {
  const isKo = locale === "ko";

  // Summary ordered relative to the current match's home/away roles
  const homeWins = data.team1Id === homeTeam.id ? data.summary.team1Wins : data.summary.team2Wins;
  const awayWins = data.team1Id === homeTeam.id ? data.summary.team2Wins : data.summary.team1Wins;
  const draws    = data.summary.draws;
  const total    = homeWins + awayWins + draws;

  const homeName = isKo ? (homeTeam.nameKo ?? homeTeam.name) : homeTeam.name;
  const awayName = isKo ? (awayTeam.nameKo ?? awayTeam.name) : awayTeam.name;

  if (data.matches.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "40px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 32 }}>⚽</span>
        <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
          {isKo
            ? "표시할 역대 맞대결 기록이 없습니다."
            : "No head-to-head records are available."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px" }}>
          {isKo ? `최근 ${total}경기 맞대결` : `Last ${total} meetings`}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#059669", margin: 0 }}>{homeWins}</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {homeName} {isKo ? "승" : "W"}
            </p>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#6b7280", margin: 0 }}>{draws}</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
              {isKo ? "무승부" : "Draw"}
            </p>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: 0 }}>{awayWins}</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {awayName} {isKo ? "승" : "W"}
            </p>
          </div>
        </div>

        {total > 0 && (
          <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden", display: "flex", marginTop: 16 }}>
            <div style={{ width: `${Math.round((homeWins / total) * 100)}%`, background: "#059669", borderRadius: "999px 0 0 999px" }} />
            <div style={{ width: `${Math.round((draws / total) * 100)}%`, background: "#d1d5db" }} />
            <div style={{ width: `${Math.round((awayWins / total) * 100)}%`, background: "#2563eb", borderRadius: "0 999px 999px 0" }} />
          </div>
        )}
      </div>

      {/* Match records — historical home/away positions preserved */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {data.matches.map((m, idx) => {
          const winnerTeamId =
            m.homeScore !== null && m.awayScore !== null && m.homeScore !== m.awayScore
              ? m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId
              : null;

          // Resolve display name — ID-based lookup, fallback to raw string
          const recHomeName =
            m.homeTeamId === homeTeam.id
              ? (isKo ? (homeTeam.nameKo ?? homeTeam.name) : homeTeam.name)
              : m.homeTeamId === awayTeam.id
              ? (isKo ? (awayTeam.nameKo ?? awayTeam.name) : awayTeam.name)
              : m.homeTeam;

          const recAwayName =
            m.awayTeamId === homeTeam.id
              ? (isKo ? (homeTeam.nameKo ?? homeTeam.name) : homeTeam.name)
              : m.awayTeamId === awayTeam.id
              ? (isKo ? (awayTeam.nameKo ?? awayTeam.name) : awayTeam.name)
              : m.awayTeam;

          // Logo — prefer team prop, then raw API logo
          const recHomeLogo =
            m.homeTeamId === homeTeam.id
              ? (homeTeam.logo ?? m.homeTeamLogoUrl)
              : m.homeTeamId === awayTeam.id
              ? (awayTeam.logo ?? m.homeTeamLogoUrl)
              : m.homeTeamLogoUrl;

          const recAwayLogo =
            m.awayTeamId === homeTeam.id
              ? (homeTeam.logo ?? m.awayTeamLogoUrl)
              : m.awayTeamId === awayTeam.id
              ? (awayTeam.logo ?? m.awayTeamLogoUrl)
              : m.awayTeamLogoUrl;

          const safeHref = SUPPORTED_LEAGUE_IDS.has(m.leagueId)
            ? `/${locale}/match/${m.fixtureId}`
            : undefined;

          const rowContent = (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: idx < data.matches.length - 1 ? "1px solid #f3f4f6" : "none",
                gap: 8,
              }}
            >
              {/* Home team (historical) */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {recHomeLogo ? (
                  <Image src={recHomeLogo} alt={recHomeName} width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
                ) : (
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚽</span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: winnerTeamId === m.homeTeamId ? 600 : 400,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {recHomeName}
                </span>
              </div>

              {/* Score + date + league */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: "0.05em" }}>
                  {m.homeScore !== null && m.awayScore !== null
                    ? `${m.homeScore}–${m.awayScore}`
                    : "–"}
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>
                  {m.date.split("T")[0]}
                </span>
                <span style={{ fontSize: 9, color: "#d1d5db", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.leagueName}
                </span>
              </div>

              {/* Away team (historical) */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, justifyContent: "flex-end" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: winnerTeamId === m.awayTeamId ? 600 : 400,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {recAwayName}
                </span>
                {recAwayLogo ? (
                  <Image src={recAwayLogo} alt={recAwayName} width={18} height={18} style={{ objectFit: "contain", flexShrink: 0 }} unoptimized />
                ) : (
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚽</span>
                )}
              </div>
            </div>
          );

          return safeHref ? (
            <a key={m.fixtureId} href={safeHref} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
              {rowContent}
            </a>
          ) : (
            <div key={m.fixtureId}>{rowContent}</div>
          );
        })}
      </div>
    </div>
  );
}
