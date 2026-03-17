"use client";

const TICKER_ITEMS = [
  { teams: "Arsenal 2–1 Man City", status: "LIVE 67'", league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { teams: "Real Madrid 1–1 Barcelona", status: "LIVE 45'", league: "🇪🇸" },
  { teams: "Bayern 0–0 Dortmund", status: "18:30", league: "🇩🇪" },
  { teams: "PSG vs Marseille", status: "20:45", league: "🇫🇷" },
  { teams: "Juventus 0–2 Inter", status: "FT", league: "🇮🇹" },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20"
      style={{
        background: "linear-gradient(135deg, #0d1117 0%, #0f1923 50%, #0a1a0f 100%)",
      }}
    >
      {/* Background field pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            #22c55e 0px,
            #22c55e 1px,
            transparent 1px,
            transparent 80px
          ),
          repeating-linear-gradient(
            0deg,
            #22c55e 0px,
            #22c55e 1px,
            transparent 1px,
            transparent 80px
          )`,
        }}
      />

      {/* Glow effects */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Badge */}
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "#22c55e22", border: "1px solid #22c55e44", color: "#22c55e" }}
          >
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            2 LIVE MATCHES NOW
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Your Football
            <span
              className="block"
              style={{
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Intelligence Hub
            </span>
          </h1>

          {/* Subtext */}
          <p style={{ color: "#8b949e" }} className="max-w-xl text-base sm:text-lg leading-relaxed">
            Live scores, real-time standings, and AI-powered match predictions
            for every major league — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <a
              href="#matches"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#22c55e", color: "#0d1117" }}
            >
              ⚽ Live Scores
            </a>
            <a
              href="#ai-analysis"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "transparent",
                border: "1px solid #30363d",
                color: "#e6edf3",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.borderColor = "#22c55e44";
                (e.currentTarget).style.background = "#161b22";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.borderColor = "#30363d";
                (e.currentTarget).style.background = "transparent";
              }}
            >
              ✨ AI Predictions
            </a>
          </div>

          {/* Stats strip */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-4 pt-6 w-full"
            style={{ borderTop: "1px solid #21262d" }}
          >
            {[
              { value: "450+", label: "Live Leagues" },
              { value: "10K+", label: "Matches/Month" },
              { value: "89%", label: "AI Accuracy" },
              { value: "Real-time", label: "Score Updates" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-white">{stat.value}</span>
                <span style={{ color: "#8b949e" }} className="text-xs font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div
        className="mt-10 overflow-hidden"
        style={{ borderTop: "1px solid #21262d", borderBottom: "1px solid #21262d" }}
      >
        <div
          className="flex items-center"
          style={{ background: "#0d1117" }}
        >
          <div
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-bold z-10"
            style={{ background: "#22c55e", color: "#0d1117" }}
          >
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-900 inline-block" />
            LIVE
          </div>
          <div className="flex items-center gap-8 px-6 py-2.5 overflow-x-auto whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <a key={i} href="#" className="flex items-center gap-2 shrink-0 group">
                <span className="text-sm">{item.league}</span>
                <span className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                  {item.teams}
                </span>
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={
                    item.status.includes("LIVE")
                      ? { background: "#22c55e22", color: "#22c55e" }
                      : { background: "#21262d", color: "#8b949e" }
                  }
                >
                  {item.status}
                </span>
                <span style={{ color: "#30363d" }} className="text-sm">|</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
