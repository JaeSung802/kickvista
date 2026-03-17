"use client";

import { useState } from "react";
import MatchCard from "@/components/match/MatchCard";
import type { Match } from "@/components/match/MatchCard";

type TabKey = "all" | "live" | "upcoming" | "finished";

interface FixturesTabViewProps {
  matches: Match[];
  locale: "ko" | "en";
}

const TABS: { key: TabKey; labelEn: string; labelKo: string }[] = [
  { key: "all",      labelEn: "All",      labelKo: "전체" },
  { key: "live",     labelEn: "Live",     labelKo: "라이브" },
  { key: "upcoming", labelEn: "Upcoming", labelKo: "예정" },
  { key: "finished", labelEn: "Finished", labelKo: "종료" },
];

const EMPTY_MESSAGES: Record<"ko" | "en", Record<TabKey, string>> = {
  en: {
    all:      "No fixtures scheduled.",
    live:     "No live matches right now.",
    upcoming: "No upcoming fixtures.",
    finished: "No finished matches.",
  },
  ko: {
    all:      "예정된 경기가 없습니다.",
    live:     "현재 진행 중인 경기가 없습니다.",
    upcoming: "예정된 경기가 없습니다.",
    finished: "종료된 경기가 없습니다.",
  },
};

function filterMatches(matches: Match[], tab: TabKey): Match[] {
  if (tab === "live")     return matches.filter((m) => m.status === "live");
  if (tab === "upcoming") return matches.filter((m) => m.status === "upcoming");
  if (tab === "finished") return matches.filter((m) => m.status === "finished");
  return matches;
}

export default function FixturesTabView({ matches, locale }: FixturesTabViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const liveCount = matches.filter((m) => m.status === "live").length;
  const visible   = filterMatches(matches, activeTab);
  const emptyMsg  = EMPTY_MESSAGES[locale][activeTab];

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "#161b22", border: "1px solid #30363d" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const label    = locale === "ko" ? tab.labelKo : tab.labelEn;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                isActive
                  ? { background: "#22c55e", color: "#0d1117" }
                  : { color: "#8b949e" }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "#e6edf3";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "#8b949e";
              }}
            >
              {label}
              {tab.key === "live" && liveCount > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? "rgba(0,0,0,0.18)" : "rgba(34,197,94,0.15)",
                    color: isActive ? "#0d1117" : "#22c55e",
                  }}
                >
                  {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Match grid or empty state */}
      {visible.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          <span style={{ fontSize: 40, marginBottom: 12 }}>⚽</span>
          <p style={{ color: "#8b949e", fontSize: 14 }}>{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((match) => (
            <MatchCard key={match.id} match={match} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
