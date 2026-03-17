"use client";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore?: number;
  awayScore?: number;
  status: "live" | "upcoming" | "finished";
  time?: string;
  minute?: number;
  league: string;
  leagueFlag: string;
  venue?: string;
}

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div
      className="relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 hover:border-opacity-70 cursor-pointer group"
      style={{
        background: "#161b22",
        border: `1px solid ${isLive ? "#22c55e44" : "#30363d"}`,
        boxShadow: isLive ? "0 0 0 1px #22c55e22" : "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget).style.borderColor = isLive ? "#22c55e88" : "#484f58";
        (e.currentTarget).style.background = "#1c2128";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.borderColor = isLive ? "#22c55e44" : "#30363d";
        (e.currentTarget).style.background = "#161b22";
      }}
    >
      {/* League + Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{match.leagueFlag}</span>
          <span style={{ color: "#8b949e" }} className="text-xs font-medium">
            {match.league}
          </span>
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="live-dot w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-xs font-bold text-green-400">
              {match.minute}&apos;
            </span>
          </div>
        )}
        {!isLive && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isFinished ? "#21262d" : "#1c2128",
              color: isFinished ? "#8b949e" : "#f59e0b",
            }}
          >
            {isFinished ? "FT" : match.time}
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">{match.homeFlag}</span>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0) ? "#e6edf3" : "#8b949e" }}
          >
            {match.homeTeam}
          </span>
        </div>

        {/* Score / vs */}
        <div className="flex items-center gap-2 shrink-0">
          {isLive || isFinished ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: "#0d1117" }}
            >
              <span className="text-lg font-bold text-white tabular-nums">
                {match.homeScore}
              </span>
              <span style={{ color: "#30363d" }} className="font-bold text-sm">
                –
              </span>
              <span className="text-lg font-bold text-white tabular-nums">
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span style={{ color: "#484f58" }} className="text-sm font-semibold px-2">
              vs
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0) ? "#e6edf3" : "#8b949e" }}
          >
            {match.awayTeam}
          </span>
          <span className="text-xl shrink-0">{match.awayFlag}</span>
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#484f58" }} className="text-xs">
            📍 {match.venue}
          </span>
        </div>
      )}
    </div>
  );
}
