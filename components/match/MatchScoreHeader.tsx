/**
 * MatchScoreHeader — teams, logos, status and score for the match page.
 * Adapted from the redesign branch (components/match/MatchScoreHeader.tsx):
 * uses TeamLogo (initials fallback when a logo is missing) instead of a bare
 * next/image, and shows a score only when the status has one ("vs" otherwise).
 */

import type { Locale } from "@/lib/i18n";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { MatchStatusInfo } from "@/lib/match/status";

interface MatchScoreHeaderProps {
  locale: Locale;
  homeTeamName: string;
  awayTeamName: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  homeScoreHT?: number;
  awayScoreHT?: number;
  leagueName: string;
  round?: string;
  venue?: string;
  status: MatchStatusInfo;
}

export default function MatchScoreHeader({
  locale, homeTeamName, awayTeamName, homeLogo, awayLogo, homeScore, awayScore,
  homeScoreHT, awayScoreHT, leagueName, round, venue, status,
}: MatchScoreHeaderProps) {
  const isKo = locale === "ko";
  const hasScore = status.showScore && homeScore !== undefined && awayScore !== undefined;

  return (
    <div className="bg-white border-b border-gray-200" data-match-header="">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <a href={`/${locale}`} className="inline-block mb-5 text-[13px] text-gray-500 hover:text-gray-700">
          ← {isKo ? "경기 목록으로" : "Back to matches"}
        </a>

        <div className="flex items-center justify-center gap-2 mb-6 text-[13px] text-gray-500 flex-wrap text-center">
          <span>{leagueName}</span>
          {round && <><span className="text-gray-300">·</span><span>{round}</span></>}
        </div>

        <div className="flex items-start justify-between gap-2">
          <TeamSide name={homeTeamName} logo={homeLogo} />

          <div className="flex flex-col items-center gap-2 shrink-0 pt-2" data-match-status={status.kind}>
            {status.isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                {status.label}
              </span>
            )}
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3" data-match-score={hasScore ? "" : undefined}>
              {hasScore ? (
                <>
                  <span className="text-4xl font-black leading-none text-gray-900 tabular-nums">{homeScore}</span>
                  <span className="text-2xl text-gray-400">:</span>
                  <span className="text-4xl font-black leading-none text-gray-900 tabular-nums">{awayScore}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-400">vs</span>
              )}
            </div>
            {!status.isLive && (
              <span className={`text-xs font-semibold text-center max-w-[11rem] ${status.isFinished ? "text-emerald-600" : status.isInactive ? "text-amber-700" : "text-gray-500"}`}>
                {status.label}
              </span>
            )}
            {hasScore && homeScoreHT !== undefined && awayScoreHT !== undefined && (
              <span className="text-xs text-gray-400">{isKo ? "전반" : "HT"} {homeScoreHT}–{awayScoreHT}</span>
            )}
          </div>

          <TeamSide name={awayTeamName} logo={awayLogo} />
        </div>

        {venue && <p className="mt-4 text-center text-xs text-gray-400">📍 {venue}</p>}
      </div>
    </div>
  );
}

function TeamSide({ name, logo }: { name: string; logo?: string }) {
  return (
    <div className="flex flex-col items-center min-w-0" style={{ flex: "0 1 120px" }}>
      <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-2 shadow-md">
        <TeamLogo logo={logo} name={name} size={52} />
      </div>
      <h2 className="w-full text-center text-sm font-bold leading-tight text-gray-800 break-words">{name}</h2>
    </div>
  );
}
