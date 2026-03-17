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
  locale?: "ko" | "en";
}

interface MatchCardProps {
  match: Match;
  locale: "ko" | "en";
}

const statusLabels = {
  en: {
    live:     (minute: number) => `${minute}'`,
    finished: "FT",
  },
  ko: {
    live:     (minute: number) => `${minute}'`,
    finished: "종료",
  },
};

export default function MatchCard({ match, locale }: MatchCardProps) {
  const isLive     = match.status === "live";
  const isFinished = match.status === "finished";
  const sl         = statusLabels[locale];

  return (
    <a
      href={`/${locale}/match/${match.id}`}
      className="relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-150 min-h-30"
      style={{
        background:     "#161b22",
        border:         `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "#30363d"}`,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background    = "#1c2128";
        el.style.borderColor   = isLive ? "rgba(34,197,94,0.5)" : "#484f58";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background    = "#161b22";
        el.style.borderColor   = isLive ? "rgba(34,197,94,0.3)" : "#30363d";
      }}
    >
      {/* Live glow line */}
      {isLive && (
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
          style={{ background: "linear-gradient(90deg, transparent, #22c55e, transparent)" }}
        />
      )}

      {/* League + status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{match.leagueFlag}</span>
          <span style={{ color: "#8b949e" }} className="text-xs font-medium">
            {match.league}
          </span>
        </div>

        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block live-dot"
              style={{ background: "#22c55e" }}
            />
            <span className="text-xs font-bold" style={{ color: "#22c55e" }}>
              {locale === "ko" ? "라이브 " : "LIVE "}{sl.live(match.minute ?? 0)}
            </span>
          </div>
        ) : (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: "#21262d",
              color: isFinished ? "#484f58" : "#8b949e",
            }}
          >
            {isFinished ? sl.finished : match.time}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">{match.homeFlag}</span>
          <span
            className="text-sm font-semibold truncate"
            style={{
              color:
                isLive
                  ? "#e6edf3"
                  : isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0)
                  ? "#e6edf3"
                  : "#8b949e",
            }}
          >
            {match.homeTeam}
          </span>
        </div>

        {/* Score / vs */}
        <div className="flex items-center gap-2 shrink-0">
          {isLive || isFinished ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: isLive ? "rgba(34,197,94,0.06)" : "#0d1117",
                border: isLive ? "1px solid rgba(34,197,94,0.2)" : "1px solid #21262d",
              }}
            >
              <span className="text-base font-black tabular-nums" style={{ color: isLive ? "#e6edf3" : "#c9d1d9" }}>
                {match.homeScore}
              </span>
              <span style={{ color: "#484f58" }} className="font-bold text-xs">–</span>
              <span className="text-base font-black tabular-nums" style={{ color: isLive ? "#e6edf3" : "#c9d1d9" }}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span
              className="text-xs font-black px-2.5 py-1 rounded-lg"
              style={{ color: "#8b949e", background: "#21262d", letterSpacing: "0.04em" }}
            >
              VS
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span
            className="text-sm font-semibold truncate"
            style={{
              color:
                isLive
                  ? "#e6edf3"
                  : isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0)
                  ? "#e6edf3"
                  : "#8b949e",
            }}
          >
            {match.awayTeam}
          </span>
          <span className="text-xl shrink-0">{match.awayFlag}</span>
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <p style={{ color: "#8b949e", fontSize: 11 }} className="flex items-center gap-1">
          <span style={{ color: "#484f58" }}>📍</span> {match.venue}
        </p>
      )}
    </a>
  );
}
