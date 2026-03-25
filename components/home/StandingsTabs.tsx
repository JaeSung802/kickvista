"use client";

/**
 * StandingsTabs — Client Component
 *
 * Manages the active league tab. Receives all standings data
 * (pre-fetched server-side) as props and renders the active league's table.
 * Zero additional fetches; purely display logic.
 */

import { useState } from "react";
import type { StandingRowViewModel } from "@/lib/football/adapters";
import type { StandingsMap } from "./HomePageContent";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface Tab {
  key: string;
  labelKo: string;
  labelEn: string;
  flag: string;
}

const TABS: Tab[] = [
  { key: "premier-league", labelKo: "프리미어리그", labelEn: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "la-liga",        labelKo: "라리가",        labelEn: "La Liga",        flag: "🇪🇸" },
  { key: "bundesliga",     labelKo: "분데스리가",    labelEn: "Bundesliga",     flag: "🇩🇪" },
  { key: "serie-a",        labelKo: "세리에 A",      labelEn: "Serie A",        flag: "🇮🇹" },
];

// CL: top 4, EL: 5th, ECL: 6th, relegation: last 3 of the full table
function zoneColor(pos: number, totalRows: number): string {
  if (pos <= 4)             return "bg-blue-500";
  if (pos === 5)            return "bg-orange-400";
  if (pos === 6)            return "bg-cyan-500";
  if (pos >= totalRows - 2) return "bg-red-500";
  return "transparent";
}

function FormDot({ result }: { result: string }) {
  const color =
    result === "W" ? "bg-emerald-400"
    : result === "D" ? "bg-gray-300"
    : "bg-red-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} title={result} />;
}

function StandingsTable({
  rows,
  locale,
}: {
  rows: StandingRowViewModel[];
  locale: "ko" | "en";
}) {
  const isKo = locale === "ko";
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rows : rows.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wide">
            <th className="py-2.5 pl-4 pr-2 text-left w-8">#</th>
            <th className="py-2.5 pr-4 text-left">
              {isKo ? "팀" : "Team"}
            </th>
            <th className="py-2.5 pr-3 text-center w-8">{isKo ? "경기" : "P"}</th>
            <th className="py-2.5 pr-3 text-center w-8 hidden sm:table-cell">{isKo ? "승" : "W"}</th>
            <th className="py-2.5 pr-3 text-center w-8 hidden sm:table-cell">{isKo ? "무" : "D"}</th>
            <th className="py-2.5 pr-3 text-center w-8 hidden sm:table-cell">{isKo ? "패" : "L"}</th>
            <th className="py-2.5 pr-3 text-center w-10 hidden md:table-cell">GD</th>
            <th className="py-2.5 pr-3 text-left hidden lg:table-cell">{isKo ? "최근" : "Form"}</th>
            <th className="py-2.5 pr-4 text-center w-10 font-bold">{isKo ? "승점" : "Pts"}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row, idx) => {
            const zone  = zoneColor(row.pos, rows.length);
            const isCL  = row.pos <= 4;
            const isEL  = row.pos === 5;
            const isCCL = row.pos === 6;
            const isRel = zone === "bg-red-500";

            return (
              <tr
                key={row.team}
                className={`border-b border-gray-100 transition-colors relative ${
                  isRel
                    ? "bg-red-50/40 hover:bg-red-50"
                    : idx % 2 === 1
                    ? "bg-gray-50/40 hover:bg-gray-50"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* Zone bar */}
                <td className="py-2.5 pl-4 pr-2 relative">
                  {zone !== "transparent" && (
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-0.5 ${zone}`}
                    />
                  )}
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isCL  ? "text-blue-600"
                      : isEL  ? "text-orange-500"
                      : isCCL ? "text-cyan-600"
                      : isRel ? "text-red-500"
                      : "text-gray-500"
                    }`}
                  >
                    {row.pos}
                  </span>
                </td>

                {/* Team */}
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <TeamLogo logo={row.logo} name={row.team} size={20} />
                    <span className="font-medium text-gray-800 truncate max-w-28">
                      {row.displayName}
                    </span>
                  </div>
                </td>

                <td className="py-2.5 pr-3 text-center text-gray-500 tabular-nums">{row.played}</td>
                <td className="py-2.5 pr-3 text-center text-emerald-600 tabular-nums hidden sm:table-cell">{row.won}</td>
                <td className="py-2.5 pr-3 text-center text-gray-400 tabular-nums hidden sm:table-cell">{row.drawn}</td>
                <td className="py-2.5 pr-3 text-center text-red-400 tabular-nums hidden sm:table-cell">{row.lost}</td>

                {/* GD */}
                <td className="py-2.5 pr-3 text-center tabular-nums hidden md:table-cell">
                  <span
                    className={
                      row.gd.startsWith("+")
                        ? "text-emerald-600"
                        : row.gd.startsWith("-")
                        ? "text-red-500"
                        : "text-gray-400"
                    }
                  >
                    {row.gd}
                  </span>
                </td>

                {/* Form */}
                <td className="py-2.5 pr-3 hidden lg:table-cell">
                  <div className="flex items-center gap-0.5">
                    {row.form.slice(0, 5).map((r, i) => (
                      <FormDot key={i} result={r} />
                    ))}
                  </div>
                </td>

                {/* Points */}
                <td className="py-2.5 pr-4 text-center">
                  <span className="font-bold text-gray-900 tabular-nums">{row.pts}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend + Show more */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            {isKo ? "챔피언스리그" : "Champions League"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            {isKo ? "유로파리그" : "Europa League"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
            {isKo ? "컨퍼런스리그" : "Conference League"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {isKo ? "강등권" : "Relegation"}
          </span>
        </div>
        {rows.length > 10 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors shrink-0"
          >
            {showAll
              ? (isKo ? "접기 ↑" : "Show less ↑")
              : (isKo ? `더보기 (${rows.length - 10}개) ↓` : `Show all (${rows.length}) ↓`)}
          </button>
        )}
      </div>
    </div>
  );
}

interface StandingsTabsProps {
  standingsData: StandingsMap;
  locale: "ko" | "en";
}

export default function StandingsTabs({ standingsData, locale }: StandingsTabsProps) {
  const [activeKey, setActiveKey] = useState("premier-league");
  const isKo = locale === "ko";

  const activeRows = standingsData[activeKey] ?? [];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => {
          const hasData = (standingsData[tab.key] ?? []).length > 0;
          if (!hasData) return null;
          const active = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveKey(tab.key)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${active
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }
              `}
            >
              <span>{tab.flag}</span>
              <span>{isKo ? tab.labelKo : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {activeRows.length > 0 ? (
          <StandingsTable key={activeKey} rows={activeRows} locale={locale} />
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">
            {isKo ? "순위 데이터를 불러오는 중..." : "Loading standings..."}
          </div>
        )}
      </div>
    </div>
  );
}
