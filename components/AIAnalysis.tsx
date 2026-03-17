"use client";

const AI_PICKS = [
  {
    id: "1",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    homeFlag: "🔴",
    awayFlag: "🟡",
    league: "Bundesliga 🇩🇪",
    time: "18:30",
    prediction: "Bayern Win",
    confidence: 72,
    insight:
      "Bayern are unbeaten at home in their last 12 Bundesliga fixtures. Dortmund's away record has been inconsistent, conceding 2+ goals in 6 of their last 8 away trips.",
    tips: ["Both Teams to Score", "Over 2.5 Goals", "Bayern -1 Asian Handicap"],
    aiModel: "KickVista AI v2",
  },
  {
    id: "2",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    homeFlag: "🔵",
    awayFlag: "⚪",
    league: "Ligue 1 🇫🇷",
    time: "20:45",
    prediction: "PSG Win",
    confidence: 81,
    insight:
      "PSG have won the last 7 Le Classique fixtures at Parc des Princes. Marseille are missing 3 key defenders through suspension, exposing their backline.",
    tips: ["PSG Win & Over 2.5", "Mbappé to Score Anytime", "PSG -1.5 Handicap"],
    aiModel: "KickVista AI v2",
  },
  {
    id: "3",
    homeTeam: "Arsenal",
    awayTeam: "Tottenham",
    homeFlag: "🔴",
    awayFlag: "⚪",
    league: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    time: "12:30",
    prediction: "Draw",
    confidence: 45,
    insight:
      "North London derbies are historically tight. Arsenal&apos;s recent form is excellent but Spurs have kept clean sheets in 3 of their last 4 away games. High-tension match expected.",
    tips: ["Under 2.5 Goals", "Draw at HT", "Both Teams Under 1.5"],
    aiModel: "KickVista AI v2",
  },
];

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "#21262d" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

export default function AIAnalysis() {
  return (
    <section id="ai-analysis" className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full inline-block" style={{ background: "#22c55e" }} />
            <h2 className="text-xl font-bold text-white">AI Match Predictions</h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#9333ea22", color: "#a855f7" }}
            >
              ✨ Powered by AI
            </span>
          </div>
          <a href="#" style={{ color: "#22c55e" }} className="text-sm font-medium hover:underline">
            All predictions →
          </a>
        </div>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-2 mb-6 px-4 py-3 rounded-lg text-xs"
          style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e" }}
        >
          <span className="text-base shrink-0">⚠️</span>
          <span>
            AI predictions are for entertainment purposes only. Past performance does not guarantee future results.
            Always gamble responsibly.
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {AI_PICKS.map((pick) => (
            <div
              key={pick.id}
              className="flex flex-col gap-4 p-5 rounded-xl transition-all duration-200 cursor-pointer"
              style={{ background: "#161b22", border: "1px solid #30363d" }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.borderColor = "#9333ea44";
                (e.currentTarget).style.background = "#1c2128";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.borderColor = "#30363d";
                (e.currentTarget).style.background = "#161b22";
              }}
            >
              {/* Match */}
              <div className="flex items-center justify-between">
                <span style={{ color: "#8b949e" }} className="text-xs">{pick.league}</span>
                <span style={{ color: "#f59e0b" }} className="text-xs font-semibold">{pick.time}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{pick.homeFlag}</span>
                  <span className="text-sm font-semibold text-white">{pick.homeTeam}</span>
                </div>
                <span style={{ color: "#484f58" }} className="text-xs font-bold">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{pick.awayTeam}</span>
                  <span className="text-2xl">{pick.awayFlag}</span>
                </div>
              </div>

              {/* Prediction badge */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "#0d1117", border: "1px solid #22c55e33" }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "#a855f7" }}>🤖</span>
                  <span className="text-xs font-medium" style={{ color: "#8b949e" }}>Prediction</span>
                </div>
                <span className="text-sm font-bold text-white">{pick.prediction}</span>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: "#8b949e" }} className="text-xs font-medium">Confidence</span>
                </div>
                <ConfidenceBar value={pick.confidence} />
              </div>

              {/* Insight */}
              <p style={{ color: "#8b949e" }} className="text-xs leading-relaxed line-clamp-3">
                {pick.insight}
              </p>

              {/* Tips */}
              <div className="flex flex-wrap gap-1.5">
                {pick.tips.map((tip) => (
                  <span
                    key={tip}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#9333ea22", color: "#a855f7" }}
                  >
                    {tip}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "#21262d" }}>
                <span style={{ color: "#484f58" }} className="text-xs">{pick.aiModel}</span>
                <a href="#" style={{ color: "#22c55e" }} className="text-xs font-medium hover:underline">
                  Full analysis →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
