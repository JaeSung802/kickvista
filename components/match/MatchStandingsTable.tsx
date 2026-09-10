import Image from "next/image";
import type { StandingRowViewModel } from "@/lib/football/adapters";
import type { Locale } from "@/lib/i18n";

interface MatchStandingsTableProps {
  rows: StandingRowViewModel[];
  homeTeamId: number;
  awayTeamId: number;
  locale: Locale;
  leagueSlug: string;
}

const HEADERS = {
  en: { pos: "#", team: "Team", mp: "P", w: "W", d: "D", l: "L", pts: "Pts" },
  ko: { pos: "#", team: "팀",   mp: "경기", w: "승", d: "무", l: "패", pts: "승점" },
};

const TEAM_BADGE = {
  en: { home: "H", away: "A" },
  ko: { home: "홈", away: "원정" },
};

// 7 columns: # (28) | Team (1fr) | P (36) | W (30) | D (30) | L (30) | Pts (42)
const GRID = "28px 1fr 36px 30px 30px 30px 42px";

export default function MatchStandingsTable({
  rows,
  homeTeamId,
  awayTeamId,
  locale,
  leagueSlug,
}: MatchStandingsTableProps) {
  const isKo = locale === "ko";
  const h = HEADERS[locale];
  const badge = TEAM_BADGE[locale];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Table */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div style={{ minWidth: 320 }}>
          {rows.length === 0 ? (
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
              <span style={{ fontSize: 32 }}>📊</span>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                {isKo
                  ? "현재 제공되는 순위 데이터가 없습니다."
                  : "No standings data is currently available."}
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID,
                  padding: "9px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                {[h.pos, h.team, h.mp, h.w, h.d, h.l, h.pts].map((label, i) => (
                  <span
                    key={i}
                    style={{
                      color: "#9ca3af",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: i === 1 ? "left" : "center",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {rows.map((row, idx) => {
                const isHome   = row.teamId === homeTeamId;
                const isAway   = row.teamId === awayTeamId;
                const isMatch  = isHome || isAway;

                const bgColor = isHome
                  ? "rgba(5,150,105,0.06)"
                  : isAway
                  ? "rgba(37,99,235,0.05)"
                  : undefined;

                const accentColor = isHome ? "#059669" : isAway ? "#2563eb" : "#6b7280";

                return (
                  <div
                    key={row.teamId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: GRID,
                      padding: "10px 16px",
                      borderBottom: idx < rows.length - 1 ? "1px solid #f3f4f6" : "none",
                      alignItems: "center",
                      backgroundColor: bgColor,
                      borderLeft: isMatch ? `3px solid ${accentColor}` : "3px solid transparent",
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isMatch ? 700 : 500,
                        color: isMatch ? accentColor : "#9ca3af",
                        textAlign: "center",
                      }}
                    >
                      {row.pos}
                    </span>

                    {/* Team */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        minWidth: 0,
                      }}
                    >
                      {row.logo ? (
                        <Image
                          src={row.logo}
                          alt={row.displayName}
                          width={18}
                          height={18}
                          style={{ objectFit: "contain", flexShrink: 0 }}
                          unoptimized
                        />
                      ) : (
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{row.flag}</span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isMatch ? 600 : 400,
                          color: "#111827",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.displayName}
                      </span>
                      {/* Accessible team-role badge (avoids color-only distinction) */}
                      {isHome && (
                        <span
                          aria-label={isKo ? "홈팀" : "Home team"}
                          style={{
                            flexShrink: 0,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#059669",
                            backgroundColor: "rgba(5,150,105,0.12)",
                            border: "1px solid rgba(5,150,105,0.25)",
                            borderRadius: 3,
                            padding: "1px 4px",
                            lineHeight: 1.5,
                          }}
                        >
                          {badge.home}
                        </span>
                      )}
                      {isAway && (
                        <span
                          aria-label={isKo ? "원정팀" : "Away team"}
                          style={{
                            flexShrink: 0,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#2563eb",
                            backgroundColor: "rgba(37,99,235,0.1)",
                            border: "1px solid rgba(37,99,235,0.22)",
                            borderRadius: 3,
                            padding: "1px 4px",
                            lineHeight: 1.5,
                          }}
                        >
                          {badge.away}
                        </span>
                      )}
                    </div>

                    {/* P W D L Pts */}
                    {[row.played, row.won, row.drawn, row.lost, row.pts].map((val, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          fontWeight: i === 4 ? (isMatch ? 800 : 700) : isMatch ? 600 : 400,
                          color:
                            i === 4
                              ? "#111827"
                              : i === 1
                              ? "#059669"
                              : i === 3
                              ? "#ef4444"
                              : "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full standings link */}
      <div style={{ textAlign: "right" }}>
        <a
          href={`/${locale}/league/${leagueSlug}/standings`}
          style={{
            color: "#059669",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {isKo ? "전체 순위표 보기" : "View full standings"}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
