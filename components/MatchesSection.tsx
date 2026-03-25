"use client";

import MatchCard, { Match } from "./MatchCard";

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

const TABS = ["All", "Live", "Today", "Finished"];

export default function MatchesSection() {
  return (
    <section id="matches" className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span
              className="w-1 h-6 rounded-full inline-block"
              style={{ background: "#059669" }}
            />
            <h2 className="text-xl font-bold text-white">Today&apos;s Matches</h2>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#05966922", color: "#059669" }}
            >
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              2 LIVE
            </span>
          </div>
          <a href="#" style={{ color: "#059669" }} className="text-sm font-medium hover:underline">
            View all →
          </a>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                i === 0
                  ? { background: "#059669", color: "#0d1117" }
                  : { color: "#8b949e" }
              }
              onMouseEnter={(e) => {
                if (i !== 0) (e.currentTarget).style.color = "#e6edf3";
              }}
              onMouseLeave={(e) => {
                if (i !== 0) (e.currentTarget).style.color = "#8b949e";
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Match grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {MATCHES.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </section>
  );
}
