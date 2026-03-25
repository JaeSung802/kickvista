"use client";

/**
 * StandingsPreview — lightweight standings widget.
 *
 * Accepts pre-processed StandingRowViewModel[] from a Server Component;
 * supports tab switching across up to 4 leagues.
 * Uses displayName (Korean-first) for all team labels.
 */

import { useState } from "react";
import type { StandingRowViewModel } from "@/lib/football/adapters";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface StandingsPreviewProps {
  locale: "ko" | "en";
  /**
   * Map of league index (0–3) → rows.
   * Index order: 0 = Premier League, 1 = La Liga, 2 = Bundesliga, 3 = Serie A
   */
  standingsData?: Record<number, StandingRowViewModel[] | undefined>;
}

const LEAGUE_LABELS = {
  en: ["Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "La Liga 🇪🇸", "Bundesliga 🇩🇪", "Serie A 🇮🇹"],
  ko: ["프리미어리그 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "라리가 🇪🇸", "분데스리가 🇩🇪", "세리에 A 🇮🇹"],
};


export default function StandingsPreview({ locale, standingsData }: StandingsPreviewProps) {
  const [active, setActive] = useState(0);
  const isKo = locale === "ko";
  const leagues = LEAGUE_LABELS[locale];
  const rows: StandingRowViewModel[] = standingsData?.[active] ?? [];

  return (
    <div>
      {/* League tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
        {leagues.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              i === active
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {isKo ? "순위 데이터 없음" : "No standings data"}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-200 px-4 py-2.5"
              style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2rem 2rem 2rem 3rem 3.5rem" }}
            >
              <span>#</span>
              <span>{isKo ? "팀" : "Team"}</span>
              <span className="text-center">{isKo ? "경기" : "P"}</span>
              <span className="text-center">{isKo ? "승" : "W"}</span>
              <span className="text-center">{isKo ? "무" : "D"}</span>
              <span className="text-center">{isKo ? "패" : "L"}</span>
              <span className="text-center">GD</span>
              <span className="text-center font-bold text-gray-600">{isKo ? "승점" : "Pts"}</span>
            </div>

            {/* Rows */}
            {rows.map((row, idx) => {
              const total = rows.length;
              const isCL  = row.pos <= 4;
              const isEL  = row.pos === 5;
              const isCCL = row.pos === 6;
              // Relegation = bottom 3 entries (index-based to avoid overlap with CL zone on small tables)
              const isRel = idx >= total - 3;
              return (
                <div
                  key={row.team}
                  className={`relative grid items-center px-4 py-2.5 text-sm transition-colors ${
                    isRel ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"
                  } ${idx < rows.length - 1 ? "border-b border-gray-100" : ""}`}
                  style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2rem 2rem 2rem 3rem 3.5rem" }}
                >
                  {/* Zone bar */}
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                      isRel ? "bg-red-500" : isCL ? "bg-blue-500" : isEL ? "bg-orange-400" : isCCL ? "bg-cyan-500" : "opacity-0"
                    }`}
                  />
                  <span className={`text-sm font-semibold tabular-nums ${
                    isRel ? "text-red-500" : isCL ? "text-blue-600" : isEL ? "text-orange-500" : isCCL ? "text-cyan-600" : "text-gray-500"
                  }`}>
                    {row.pos}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo logo={row.logo} name={row.displayName} size={18} />
                    <span className="text-sm font-medium text-gray-800 truncate">{row.displayName}</span>
                  </div>

                  <span className="text-center tabular-nums text-gray-500 text-xs">{row.played}</span>
                  <span className="text-center tabular-nums text-emerald-600 text-xs font-semibold">{row.won}</span>
                  <span className="text-center tabular-nums text-gray-400 text-xs">{row.drawn}</span>
                  <span className="text-center tabular-nums text-red-400 text-xs">{row.lost}</span>
                  <span className={`text-center tabular-nums text-xs font-semibold ${
                    row.gd.startsWith("+") ? "text-emerald-600" : row.gd.startsWith("-") ? "text-red-500" : "text-gray-400"
                  }`}>
                    {row.gd}
                  </span>
                  <span className="text-center font-black text-sm text-gray-900 tabular-nums">{row.pts}</span>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />
                {isKo ? "챔피언스리그" : "Champions League"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-orange-400 inline-block" />
                {isKo ? "유로파리그" : "Europa League"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-cyan-500 inline-block" />
                {isKo ? "컨퍼런스리그" : "Conference League"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                {isKo ? "강등권" : "Relegation"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
