"use client";

import { useState } from "react";
import type { StandingRowViewModel } from "@/lib/football/adapters";

interface StandingsPreviewProps {
  locale: "ko" | "en";
  /**
   * Pre-processed standings rows from a Server Component.
   * When provided, overrides the built-in STANDINGS mock for the active league.
   * Pass a map of league index → rows so the tab switcher works correctly.
   *
   * Example:
   *   const pl = await queryStandings("premier-league");
   *   <StandingsPreview standingsData={{ 0: pl ? standingsToRows(pl) : undefined }} />
   */
  standingsData?: Record<number, StandingRowViewModel[] | undefined>;
}

const STANDINGS = [
  { pos: 1, team: "Arsenal",     flag: "🔴", played: 28, won: 20, drawn: 5, lost: 3, gd: "+38", pts: 65, form: ["W", "W", "D", "W", "W"] },
  { pos: 2, team: "Man City",    flag: "🔵", played: 28, won: 19, drawn: 6, lost: 3, gd: "+35", pts: 63, form: ["W", "W", "W", "D", "W"] },
  { pos: 3, team: "Liverpool",   flag: "🔴", played: 28, won: 18, drawn: 6, lost: 4, gd: "+29", pts: 60, form: ["W", "D", "W", "W", "L"] },
  { pos: 4, team: "Aston Villa", flag: "🟣", played: 28, won: 16, drawn: 5, lost: 7, gd: "+18", pts: 53, form: ["L", "W", "W", "D", "W"] },
  { pos: 5, team: "Tottenham",   flag: "⚪", played: 28, won: 14, drawn: 6, lost: 8, gd: "+12", pts: 48, form: ["W", "L", "W", "W", "D"] },
  { pos: 6, team: "Chelsea",     flag: "🔵", played: 28, won: 12, drawn: 8, lost: 8, gd: "+5",  pts: 44, form: ["D", "W", "L", "W", "D"] },
];

const FORM_COLORS: Record<string, { background: string; color: string }> = {
  W: { background: "#22c55e22", color: "#22c55e" },
  D: { background: "#f59e0b22", color: "#f59e0b" },
  L: { background: "#ef444422", color: "#ef4444" },
};

const LEAGUES_EN = ["Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "La Liga 🇪🇸", "Bundesliga 🇩🇪", "Serie A 🇮🇹"];
const LEAGUES_KO = ["프리미어리그 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "라리가 🇪🇸", "분데스리가 🇩🇪", "세리에 A 🇮🇹"];

const labels = {
  en: {
    sectionTitle: "Standings",
    viewAll: "Full table →",
    headers: { club: "Team", p: "P", w: "W", d: "D", l: "L", gd: "GD", pts: "Pts", form: "Form" },
    championsLeague: "Champions League",
    europaLeague: "Europa League",
  },
  ko: {
    sectionTitle: "순위표",
    viewAll: "전체 순위 →",
    headers: { club: "클럽", p: "경기", w: "승", d: "무", l: "패", gd: "득실차", pts: "승점", form: "최근" },
    championsLeague: "챔피언스리그",
    europaLeague: "유로파리그",
  },
};

export default function StandingsPreview({ locale, standingsData }: StandingsPreviewProps) {
  const [activeLeague, setActiveLeague] = useState(0);
  const t = labels[locale];
  const leagueList = locale === "ko" ? LEAGUES_KO : LEAGUES_EN;
  // Use injected rows when available for the active tab, else fall back to hardcoded mock
  const activeRows: typeof STANDINGS =
    standingsData?.[activeLeague] ?? STANDINGS;

  return (
    <div id="standings">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="section-title-bar" />
          <h2 className="text-lg font-bold text-white">{t.sectionTitle}</h2>
        </div>
        <a
          href={`/${locale}/league/epl/standings`}
          style={{ color: "#22c55e" }}
          className="text-sm font-medium hover:underline"
        >
          {t.viewAll}
        </a>
      </div>

      {/* League tabs — horizontal scroll on mobile */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {leagueList.map((league, i) => (
          <button
            key={league}
            onClick={() => setActiveLeague(i)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
            style={
              i === activeLeague
                ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }
                : { background: "#161b22", color: "#8b949e", border: "1px solid #30363d" }
            }
          >
            {league}
          </button>
        ))}
      </div>

      {/* Table — scrollable on mobile */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#161b22", border: "1px solid #30363d" }}
      >
        <div className="overflow-x-auto">
          {/* Table header */}
          <div
            className="grid text-xs font-semibold uppercase tracking-wider px-4 py-3 min-w-130"
            style={{
              gridTemplateColumns: "2rem 1fr 2.5rem 2rem 2rem 2rem 3rem 3.5rem 5.5rem",
              color: "#8b949e",
              borderBottom: "1px solid #30363d",
              background: "#0d1117",
            }}
          >
            <span>#</span>
            <span>{t.headers.club}</span>
            <span className="text-center">{t.headers.p}</span>
            <span className="text-center">{t.headers.w}</span>
            <span className="text-center">{t.headers.d}</span>
            <span className="text-center">{t.headers.l}</span>
            <span className="text-center">{t.headers.gd}</span>
            <span className="text-center font-bold" style={{ color: "#c9d1d9" }}>{t.headers.pts}</span>
            <span className="text-center">{t.headers.form}</span>
          </div>

          {/* Rows */}
          {activeRows.map((row, idx) => (
            <div
              key={row.team}
              className="grid items-center px-4 py-2.5 text-sm transition-all cursor-pointer min-w-130"
              style={{
                gridTemplateColumns: "2rem 1fr 2.5rem 2rem 2rem 2rem 3rem 3.5rem 5.5rem",
                borderBottom: idx < activeRows.length - 1 ? "1px solid #21262d" : "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "#1c2128"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
            >
              {/* Position */}
              <span
                className="font-bold text-sm"
                style={{ color: row.pos <= 4 ? "#22c55e" : row.pos === 5 ? "#f59e0b" : "#484f58" }}
              >
                {row.pos}
              </span>

              {/* Team */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{row.flag}</span>
                <span className="text-white font-medium truncate text-sm">{row.team}</span>
              </div>

              <span style={{ color: "#8b949e" }} className="text-center tabular-nums text-xs">{row.played}</span>
              <span className="text-center tabular-nums text-xs font-semibold" style={{ color: "#e6edf3" }}>{row.won}</span>
              <span style={{ color: "#8b949e" }} className="text-center tabular-nums text-xs">{row.drawn}</span>
              <span style={{ color: "#8b949e" }} className="text-center tabular-nums text-xs">{row.lost}</span>
              <span
                className="text-center tabular-nums text-xs font-semibold"
                style={{ color: row.gd.startsWith("+") ? "#22c55e" : row.gd === "0" ? "#484f58" : "#ef4444" }}
              >
                {row.gd}
              </span>
              <span className="text-center font-black text-sm" style={{ color: "#e6edf3" }}>{row.pts}</span>

              {/* Form */}
              <div className="flex items-center gap-0.5 justify-center">
                {row.form.map((f, fi) => (
                  <span
                    key={fi}
                    className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                    style={FORM_COLORS[f]}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 text-xs"
          style={{ borderTop: "1px solid #30363d", color: "#8b949e" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#22c55e" }} />
            <span>{t.championsLeague}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#f59e0b" }} />
            <span>{t.europaLeague}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
