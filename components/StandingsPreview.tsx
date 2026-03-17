"use client";

const STANDINGS = [
  { pos: 1, team: "Arsenal", flag: "🔴", played: 28, won: 20, drawn: 5, lost: 3, gd: "+38", pts: 65, form: ["W", "W", "D", "W", "W"] },
  { pos: 2, team: "Man City", flag: "🔵", played: 28, won: 19, drawn: 6, lost: 3, gd: "+35", pts: 63, form: ["W", "W", "W", "D", "W"] },
  { pos: 3, team: "Liverpool", flag: "🔴", played: 28, won: 18, drawn: 6, lost: 4, gd: "+29", pts: 60, form: ["W", "D", "W", "W", "L"] },
  { pos: 4, team: "Aston Villa", flag: "🟣", played: 28, won: 16, drawn: 5, lost: 7, gd: "+18", pts: 53, form: ["L", "W", "W", "D", "W"] },
  { pos: 5, team: "Tottenham", flag: "⚪", played: 28, won: 14, drawn: 6, lost: 8, gd: "+12", pts: 48, form: ["W", "L", "W", "W", "D"] },
  { pos: 6, team: "Chelsea", flag: "🔵", played: 28, won: 12, drawn: 8, lost: 8, gd: "+5", pts: 44, form: ["D", "W", "L", "W", "D"] },
];

const FORM_COLORS: Record<string, { background: string; color: string }> = {
  W: { background: "#22c55e22", color: "#22c55e" },
  D: { background: "#f59e0b22", color: "#f59e0b" },
  L: { background: "#ef444422", color: "#ef4444" },
};

const LEAGUES = ["Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "La Liga 🇪🇸", "Bundesliga 🇩🇪", "Serie A 🇮🇹"];

export default function StandingsPreview() {
  return (
    <section id="standings" className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full inline-block" style={{ background: "#22c55e" }} />
            <h2 className="text-xl font-bold text-white">Standings</h2>
          </div>
          <a href="#" style={{ color: "#22c55e" }} className="text-sm font-medium hover:underline">
            Full table →
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* League selector */}
          <div
            className="flex flex-col gap-1 p-2 rounded-xl h-fit"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            {LEAGUES.map((league, i) => (
              <button
                key={league}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all"
                style={
                  i === 0
                    ? { background: "#22c55e22", color: "#22c55e" }
                    : { color: "#8b949e" }
                }
                onMouseEnter={(e) => {
                  if (i !== 0) {
                    (e.currentTarget).style.background = "#21262d";
                    (e.currentTarget).style.color = "#e6edf3";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== 0) {
                    (e.currentTarget).style.background = "transparent";
                    (e.currentTarget).style.color = "#8b949e";
                  }
                }}
              >
                {league}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            className="lg:col-span-2 rounded-xl overflow-hidden"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            {/* Table header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-4 py-3"
              style={{
                gridTemplateColumns: "2rem 1fr 2rem 2rem 2rem 2rem 3rem 3rem 6rem",
                color: "#8b949e",
                borderBottom: "1px solid #30363d",
                background: "#0d1117",
              }}
            >
              <span>#</span>
              <span>Team</span>
              <span className="text-center">P</span>
              <span className="text-center">W</span>
              <span className="text-center">D</span>
              <span className="text-center">L</span>
              <span className="text-center">GD</span>
              <span className="text-center font-bold">Pts</span>
              <span className="text-center">Form</span>
            </div>

            {/* Rows */}
            {STANDINGS.map((row, idx) => (
              <div
                key={row.team}
                className="grid items-center px-4 py-3 text-sm transition-all cursor-pointer"
                style={{
                  gridTemplateColumns: "2rem 1fr 2rem 2rem 2rem 2rem 3rem 3rem 6rem",
                  borderBottom: idx < STANDINGS.length - 1 ? "1px solid #21262d" : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.background = "#1c2128";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.background = "transparent";
                }}
              >
                {/* Position with Champions League indicator */}
                <span
                  className="font-bold text-sm"
                  style={{
                    color: row.pos <= 4 ? "#22c55e" : row.pos === 5 ? "#f59e0b" : "#8b949e",
                  }}
                >
                  {row.pos}
                </span>

                {/* Team */}
                <div className="flex items-center gap-2 min-w-0">
                  <span>{row.flag}</span>
                  <span className="text-white font-medium truncate">{row.team}</span>
                </div>

                <span style={{ color: "#8b949e" }} className="text-center tabular-nums">{row.played}</span>
                <span className="text-center text-white tabular-nums font-medium">{row.won}</span>
                <span style={{ color: "#8b949e" }} className="text-center tabular-nums">{row.drawn}</span>
                <span style={{ color: "#8b949e" }} className="text-center tabular-nums">{row.lost}</span>
                <span
                  className="text-center tabular-nums font-medium"
                  style={{ color: row.gd.startsWith("+") ? "#22c55e" : "#ef4444" }}
                >
                  {row.gd}
                </span>
                <span className="text-center font-bold text-white tabular-nums">{row.pts}</span>

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

            {/* Legend */}
            <div
              className="flex items-center gap-4 px-4 py-3 text-xs"
              style={{ borderTop: "1px solid #30363d", color: "#8b949e" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span>Champions League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: "#f59e0b" }}
                />
                <span>Europa League</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
