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
  // "all" includes postponed and cancelled
  return matches;
}

/** Group matches by their date field (YYYY-MM-DD), preserving order. */
function groupByDate(matches: Match[]): { dateKey: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.date ?? "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([dateKey, matches]) => ({ dateKey, matches }));
}

/** Format YYYY-MM-DD into a localised date header string. */
function formatDateHeader(dateKey: string, locale: "ko" | "en"): string {
  if (dateKey === "unknown") return locale === "ko" ? "날짜 미정" : "Date TBD";
  const d = new Date(dateKey + "T12:00:00"); // noon to avoid timezone edge cases
  if (locale === "ko") {
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  }
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Check if a date key represents today. */
function isToday(dateKey: string): boolean {
  return dateKey === new Date().toISOString().split("T")[0];
}

export default function FixturesTabView({ matches, locale }: FixturesTabViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const liveCount = matches.filter((m) => m.status === "live").length;
  const visible   = filterMatches(matches, activeTab);
  const emptyMsg  = EMPTY_MESSAGES[locale][activeTab];
  const groups    = groupByDate(visible);

  const todayLabel = locale === "ko" ? "오늘" : "Today";

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const label    = locale === "ko" ? tab.labelKo : tab.labelEn;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}
            >
              {label}
              {tab.key === "live" && liveCount > 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/25 text-white" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Match list grouped by date */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-gray-50 border border-gray-100">
          <span style={{ fontSize: 40, marginBottom: 12 }}>⚽</span>
          <p className="text-gray-400 text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(({ dateKey, matches: groupMatches }) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0 px-1">
                <span className="text-sm font-semibold text-gray-500">
                  {formatDateHeader(dateKey, locale)}
                </span>
                {isToday(dateKey) && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {todayLabel}
                  </span>
                )}
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{groupMatches.length}</span>
              </div>

              {/* Cards for this date */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupMatches.map((match) => (
                  <MatchCard key={match.id} match={match} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
