"use client";

const leagues = [
  {
    id: "pl",
    name: "Premier League",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: 20,
    matches: 3,
    color: "#9333ea",
    badge: "🔵",
  },
  {
    id: "laliga",
    name: "La Liga",
    country: "Spain",
    flag: "🇪🇸",
    teams: 20,
    matches: 2,
    color: "#ef4444",
    badge: "🔴",
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    flag: "🇩🇪",
    teams: 18,
    matches: 4,
    color: "#f59e0b",
    badge: "🟡",
  },
  {
    id: "seriea",
    name: "Serie A",
    country: "Italy",
    flag: "🇮🇹",
    teams: 20,
    matches: 1,
    color: "#3b82f6",
    badge: "🔵",
  },
  {
    id: "ligue1",
    name: "Ligue 1",
    country: "France",
    flag: "🇫🇷",
    teams: 18,
    matches: 2,
    color: "#06b6d4",
    badge: "🟦",
  },
  {
    id: "champions",
    name: "Champions League",
    country: "Europe",
    flag: "🌍",
    teams: 32,
    matches: 5,
    color: "#22c55e",
    badge: "⭐",
  },
];

export default function LeagueCards() {
  return (
    <section id="leagues" className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span
              className="w-1 h-6 rounded-full inline-block"
              style={{ background: "#22c55e" }}
            />
            <h2 className="text-xl font-bold text-white">Top Leagues</h2>
          </div>
          <a
            href="#"
            style={{ color: "#22c55e" }}
            className="text-sm font-medium hover:underline"
          >
            View all leagues →
          </a>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {leagues.map((league) => (
            <a
              key={league.id}
              href="#"
              className="group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = league.color;
                el.style.background = "#1c2128";
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = `0 8px 24px ${league.color}22`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "#30363d";
                el.style.background = "#161b22";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              {/* League color stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                style={{ background: league.color }}
              />

              {/* Flag */}
              <span className="text-3xl">{league.flag}</span>

              {/* Name */}
              <div className="text-center">
                <p className="text-xs font-semibold text-white leading-tight">
                  {league.name}
                </p>
                <p style={{ color: "#8b949e" }} className="text-xs mt-0.5">
                  {league.country}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 w-full justify-center">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${league.color}22`, color: league.color }}
                >
                  {league.matches} live
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
