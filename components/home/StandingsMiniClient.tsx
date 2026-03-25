"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { StandingsMap } from "./HomePageContent";
import { LeagueLogo } from "@/components/ui/LeagueLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";

const CDN = "https://media.api-sports.io/football/leagues";

const LEAGUE_TABS = [
  { key: "premier-league", labelKo: "EPL",   labelEn: "EPL",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: `${CDN}/39.png`  },
  { key: "la-liga",        labelKo: "라리가", labelEn: "Liga", flag: "🇪🇸",          logo: `${CDN}/140.png` },
  { key: "bundesliga",     labelKo: "분데",   labelEn: "BL",   flag: "🇩🇪",          logo: `${CDN}/78.png`  },
  { key: "serie-a",        labelKo: "세리에", labelEn: "SA",   flag: "🇮🇹",          logo: `${CDN}/135.png` },
];

interface Props {
  standingsData: StandingsMap;
  locale: Locale;
}

export default function StandingsMiniClient({ standingsData, locale }: Props) {
  const isKo = locale === "ko";

  // Default to first league that has data
  const firstAvailable = LEAGUE_TABS.find((t) => standingsData[t.key])?.key ?? "premier-league";
  const [activeKey, setActiveKey] = useState(firstAvailable);

  const activeTab = LEAGUE_TABS.find((t) => t.key === activeKey)!;
  const rows = (standingsData[activeKey] ?? []).slice(0, 6);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LeagueLogo logo={activeTab.logo} name={activeTab.labelEn} flag={activeTab.flag} size={20} />
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {isKo ? "리그 순위" : "Standings"}
          </h3>
        </div>

        {/* League switcher — buttons, not links */}
        <div className="flex items-center gap-1">
          {LEAGUE_TABS.map((tab) => {
            if (!standingsData[tab.key]) return null;
            const isActive = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveKey(tab.key)}
                title={isKo ? tab.labelKo : tab.labelEn}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  isActive
                    ? "bg-emerald-50 ring-2 ring-emerald-400"
                    : "hover:bg-gray-100 opacity-60 hover:opacity-100"
                }`}
              >
                <LeagueLogo
                  logo={tab.logo}
                  name={isKo ? tab.labelKo : tab.labelEn}
                  flag={tab.flag}
                  size={22}
                  isActive={isActive}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Standings table */}
      <div
        key={activeKey}
        style={{ animation: "fadeIn 0.18s ease" }}
      >
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            {isKo ? "데이터 없음" : "No data"}
          </p>
        ) : (
          <>
            {/* Column labels */}
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-50">
              <span className="text-[10px] text-gray-400 w-4 shrink-0">#</span>
              <span className="flex-1 text-[10px] text-gray-400 min-w-0">
                {isKo ? "팀" : "Team"}
              </span>
              <span className="text-[10px] text-gray-400 w-6 text-center">P</span>
              <span className="text-[10px] text-gray-400 w-6 text-center">GD</span>
              <span className="text-[10px] text-gray-400 w-6 text-center font-bold">PTS</span>
            </div>

            <div className="divide-y divide-gray-50">
              {rows.map((row) => (
                <div key={row.pos} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors">
                  <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{row.pos}</span>
                  <TeamLogo logo={row.logo} name={row.team} size={16} />
                  <span className="flex-1 text-xs text-gray-700 font-medium truncate min-w-0">
                    {row.displayName}
                  </span>
                  <span className="text-[11px] text-gray-400 tabular-nums w-6 text-center">{row.played}</span>
                  <span className={`text-[11px] tabular-nums w-6 text-center ${
                    row.gd?.startsWith("+") ? "text-emerald-600" : row.gd?.startsWith("-") ? "text-red-500" : "text-gray-400"
                  }`}>
                    {row.gd ?? "0"}
                  </span>
                  <span className="text-xs font-black text-gray-900 tabular-nums w-6 text-center">{row.pts}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100">
        <a
          href={`/${locale}/league/${activeKey}`}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {isKo ? "전체 순위 보기 →" : "Full table →"}
        </a>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
