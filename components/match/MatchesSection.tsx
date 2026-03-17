"use client";

import { useState } from "react";
import MatchCard, { Match } from "@/components/match/MatchCard";

interface MatchesSectionProps {
  locale: "ko" | "en";
  /**
   * Live matches to display. When provided (e.g. from a Server Component that
   * called `queryTodayFixtures` + `fixturesToMatches`), this replaces the
   * built-in MOCK_MATCHES. Omit to keep the default mock data.
   */
  matches?: Match[];
}

const MATCHES: Match[] = [
  {
    id: "1",
    homeTeam: "Arsenal",
    awayTeam: "Man City",
    homeFlag: "🔴",
    awayFlag: "🔵",
    homeScore: 2,
    awayScore: 1,
    status: "live",
    minute: 67,
    league: "Premier League",
    leagueFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Emirates Stadium",
  },
  {
    id: "2",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeFlag: "⚪",
    awayFlag: "🔵",
    homeScore: 1,
    awayScore: 1,
    status: "live",
    minute: 45,
    league: "La Liga",
    leagueFlag: "🇪🇸",
    venue: "Santiago Bernabéu",
  },
  {
    id: "3",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    homeFlag: "🔴",
    awayFlag: "🟡",
    status: "upcoming",
    time: "18:30",
    league: "Bundesliga",
    leagueFlag: "🇩🇪",
    venue: "Allianz Arena",
  },
  {
    id: "4",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    homeFlag: "🔵",
    awayFlag: "⚪",
    status: "upcoming",
    time: "20:45",
    league: "Ligue 1",
    leagueFlag: "🇫🇷",
    venue: "Parc des Princes",
  },
  {
    id: "5",
    homeTeam: "Juventus",
    awayTeam: "Inter Milan",
    homeFlag: "⚫",
    awayFlag: "🔵",
    homeScore: 0,
    awayScore: 2,
    status: "finished",
    league: "Serie A",
    leagueFlag: "🇮🇹",
    venue: "Allianz Stadium",
  },
  {
    id: "6",
    homeTeam: "Liverpool",
    awayTeam: "Chelsea",
    homeFlag: "🔴",
    awayFlag: "🔵",
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    league: "Premier League",
    leagueFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Anfield",
  },
];

type TabKey = "all" | "live" | "upcoming" | "finished";

const tabs: { key: TabKey; labelEn: string; labelKo: string }[] = [
  { key: "all",      labelEn: "All",      labelKo: "전체" },
  { key: "live",     labelEn: "Live",     labelKo: "라이브" },
  { key: "upcoming", labelEn: "Upcoming", labelKo: "예정" },
  { key: "finished", labelEn: "Finished", labelKo: "종료" },
];

const labels = {
  en: {
    sectionTitle: "Today's Matches",
    viewAll: "View all →",
    live: "LIVE",
  },
  ko: {
    sectionTitle: "오늘의 경기",
    viewAll: "전체 보기 →",
    live: "라이브",
  },
};

function filterMatches(matches: Match[], tab: TabKey): Match[] {
  if (tab === "live")     return matches.filter((m) => m.status === "live");
  if (tab === "upcoming") return matches.filter((m) => m.status === "upcoming");
  if (tab === "finished") return matches.filter((m) => m.status === "finished");
  return matches;
}

export default function MatchesSection({ locale, matches: propMatches }: MatchesSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const t = labels[locale];
  // Use injected data when provided (real API or pre-processed mock), else built-in mock
  const allMatches = propMatches ?? MATCHES;
  const visibleMatches = filterMatches(allMatches, activeTab);
  const liveCount = allMatches.filter((m) => m.status === "live").length;

  return (
    <section id="matches" className="py-8" style={{ borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-title-bar" />
            <h2 className="text-lg font-bold text-white">{t.sectionTitle}</h2>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#22c55e22", color: "#22c55e" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block live-dot"
                style={{ background: "#22c55e" }}
              />
              {liveCount} {t.live}
            </span>
          </div>
          <a
            href={`/${locale}/matches`}
            style={{ color: "#22c55e" }}
            className="text-sm font-medium hover:underline"
          >
            {t.viewAll}
          </a>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "#161b22", border: "1px solid #30363d", scrollbarWidth: "none", maxWidth: "fit-content" }}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const label = locale === "ko" ? tab.labelKo : tab.labelEn;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0"
                style={
                  isActive
                    ? { background: "#22c55e", color: "#0d1117" }
                    : { color: "#8b949e" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget).style.color = "#e6edf3";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget).style.color = "#8b949e";
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Match grid / empty state */}
        {visibleMatches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            <span style={{ fontSize: 36, marginBottom: 12 }}>⚽</span>
            <p style={{ color: "#8b949e", fontSize: 14 }}>
              {locale === "ko" ? "해당 경기가 없습니다" : "No matches for this filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleMatches.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
