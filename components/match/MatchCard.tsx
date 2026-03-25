"use client";

import Image from "next/image";
import { useState } from "react";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status: "live" | "upcoming" | "finished" | "postponed" | "cancelled";
  time?: string;
  minute?: number;
  league: string;
  leagueFlag: string;
  venue?: string;
  date?: string; // YYYY-MM-DD
  locale?: "ko" | "en";
}

interface MatchCardProps {
  match: Match;
  locale: "ko" | "en";
}

function TeamBadge({ logo, flag, name, size = 32 }: { logo?: string; flag: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <Image
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-contain shrink-0"
        onError={() => setFailed(true)}
        unoptimized
      />
    );
  }

  // Fallback: colored circle emoji
  return (
    <span className="shrink-0 text-xl leading-none" style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {flag}
    </span>
  );
}

const statusLabels = {
  en: {
    live:      (minute: number) => `${minute}'`,
    finished:  "FT",
    postponed: "Postponed",
    cancelled: "Cancelled",
  },
  ko: {
    live:      (minute: number) => `${minute}'`,
    finished:  "종료",
    postponed: "연기됨",
    cancelled: "취소됨",
  },
};

export default function MatchCard({ match, locale }: MatchCardProps) {
  const isLive      = match.status === "live";
  const isFinished  = match.status === "finished";
  const isCancelled = match.status === "cancelled";
  const isInactive  = match.status === "postponed" || isCancelled;
  const sl          = statusLabels[locale];

  const homeWin  = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin  = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const isDraw   = isFinished && !homeWin && !awayWin && match.homeScore != null;

  const cardBody = (
    <>
      {/* Live top accent line */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-linear-to-r from-transparent via-emerald-700 to-transparent" />
      )}

      {/* League + status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{match.leagueFlag}</span>
          <span className="text-xs font-medium text-gray-400">{match.league}</span>
        </div>

        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block live-dot" />
            <span className="text-xs font-bold text-emerald-600">
              {locale === "ko" ? "라이브 " : "LIVE "}{sl.live(match.minute ?? 0)}
            </span>
          </div>
        ) : isInactive ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-600">
            {isCancelled ? sl.cancelled : sl.postponed}
          </span>
        ) : (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isFinished ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-700"
          }`}>
            {isFinished ? sl.finished : match.time}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className={`flex items-center justify-between gap-2 ${isInactive ? "opacity-50" : ""}`}>
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamBadge logo={match.homeLogo} flag={match.homeFlag} name={match.homeTeam} size={28} />
          <span className={`text-sm truncate ${
            homeWin ? "font-bold text-gray-900" : isLive ? "font-semibold text-gray-900" : "font-medium text-gray-600"
          }`}>
            {match.homeTeam}
          </span>
          {homeWin && (
            <span className="shrink-0 text-[9px] font-black px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 leading-none">
              {locale === "ko" ? "승" : "W"}
            </span>
          )}
          {isDraw && (
            <span className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-400 leading-none">
              {locale === "ko" ? "무" : "D"}
            </span>
          )}
        </div>

        {/* Score / VS — hidden for inactive matches */}
        <div className="flex items-center gap-2 shrink-0">
          {isInactive ? (
            <span className="text-sm text-amber-300 font-bold px-2">–</span>
          ) : isLive || isFinished ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${
              isLive ? "bg-emerald-50 border border-emerald-100" : "bg-gray-50 border border-gray-100"
            }`}>
              <span className={`text-base font-black tabular-nums ${
                homeWin ? "text-emerald-600" : isDraw ? "text-gray-600" : isFinished ? "text-gray-400" : "text-gray-900"
              }`}>
                {match.homeScore}
              </span>
              <span className="text-gray-300 font-bold text-xs">–</span>
              <span className={`text-base font-black tabular-nums ${
                awayWin ? "text-emerald-600" : isDraw ? "text-gray-600" : isFinished ? "text-gray-400" : "text-gray-900"
              }`}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-xs font-black px-2.5 py-1 rounded-lg text-gray-400 bg-gray-50 tracking-wide">
              VS
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          {isDraw && (
            <span className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-400 leading-none">
              {locale === "ko" ? "무" : "D"}
            </span>
          )}
          {awayWin && (
            <span className="shrink-0 text-[9px] font-black px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 leading-none">
              {locale === "ko" ? "승" : "W"}
            </span>
          )}
          <span className={`text-sm truncate text-right ${
            awayWin ? "font-bold text-gray-900" : isLive ? "font-semibold text-gray-900" : "font-medium text-gray-600"
          }`}>
            {match.awayTeam}
          </span>
          <TeamBadge logo={match.awayLogo} flag={match.awayFlag} name={match.awayTeam} size={28} />
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span className="text-gray-300">📍</span> {match.venue}
        </p>
      )}
    </>
  );

  const sharedClass = `relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-150 bg-white border shadow-sm ${
    isInactive
      ? "border-amber-100"
      : isLive
      ? "border-emerald-200 ring-1 ring-emerald-100 hover:shadow-md"
      : "border-gray-100 hover:shadow-md"
  }`;

  if (isInactive) {
    return (
      <div className={sharedClass} style={{ minHeight: 120 }}>
        {cardBody}
      </div>
    );
  }

  return (
    <a
      href={`/${locale}/match/${match.id}`}
      className={sharedClass}
      style={{ textDecoration: "none", minHeight: 120 }}
    >
      {cardBody}
    </a>
  );
}
