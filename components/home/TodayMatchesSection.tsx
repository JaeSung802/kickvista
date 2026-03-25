/**
 * TodayMatchesSection — Server Component
 *
 * Accepts pre-fetched MatchViewModel[] from the page (no internal fetch).
 * Renders a responsive card grid — one card per fixture.
 *
 * Design: white card with subtle border, score centred, status badge,
 * team flags as emoji, live pulse animation.
 */

import type { Locale } from "@/lib/i18n";
import type { MatchViewModel } from "@/lib/football/adapters";
import { SectionHeader } from "./HomePageContent";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface TodayMatchesSectionProps {
  matches: MatchViewModel[];
  locale: Locale;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ match }: { match: MatchViewModel }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        {match.minute != null ? `${match.minute}′` : "LIVE"}
      </span>
    );
  }

  if (match.status === "finished") {
    return (
      <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-100 rounded px-2 py-0.5">
        FT
      </span>
    );
  }

  return (
    <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5">
      {match.time ?? "—"}
    </span>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: MatchViewModel }) {
  const isLive     = match.status === "live";
  const isFinished = match.status === "finished";
  const hasScore   = match.homeScore !== undefined && match.awayScore !== undefined;

  const homeWins = hasScore && match.homeScore! > match.awayScore!;
  const awayWins = hasScore && match.awayScore! > match.homeScore!;

  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
        ${isLive ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}
      `}
    >
      {/* League */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
          <span>{match.leagueFlag}</span>
          <span className="truncate">{match.league}</span>
        </span>
        <StatusBadge match={match} />
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <TeamLogo logo={match.homeLogo} name={match.homeTeam} size={24} />
          <span
            className={`text-sm truncate ${
              homeWins || isLive
                ? "font-bold text-gray-900"
                : isFinished
                ? "font-medium text-gray-500"
                : "font-medium text-gray-800"
            }`}
          >
            {match.homeTeam}
          </span>
        </div>

        {/* Score */}
        <div className="shrink-0 flex items-center gap-1.5 px-2">
          {hasScore ? (
            <>
              <span
                className={`text-xl font-black tabular-nums ${homeWins ? "text-gray-900" : "text-gray-400"}`}
              >
                {match.homeScore}
              </span>
              <span className="text-gray-300 text-sm">–</span>
              <span
                className={`text-xl font-black tabular-nums ${awayWins ? "text-gray-900" : "text-gray-400"}`}
              >
                {match.awayScore}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-300 font-light">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          <span
            className={`text-sm truncate text-right ${
              awayWins || isLive
                ? "font-bold text-gray-900"
                : isFinished
                ? "font-medium text-gray-500"
                : "font-medium text-gray-800"
            }`}
          >
            {match.awayTeam}
          </span>
          <TeamLogo logo={match.awayLogo} name={match.awayTeam} size={24} />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoMatches({ locale }: { locale: Locale }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
      <div className="text-4xl mb-3">⚽</div>
      <p className="text-gray-400 text-sm">
        {locale === "ko" ? "오늘 예정된 경기가 없습니다" : "No matches scheduled today"}
      </p>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TodayMatchesSection({ matches, locale }: TodayMatchesSectionProps) {

  const isKo   = locale === "ko";
  const title  = isKo ? "오늘의 경기" : "Today's Matches";
  const more   = isKo ? "전체 보기" : "View all";
  const shown  = matches.slice(0, 9);

  return (
    <div id="matches">
      <SectionHeader
        title={title}
        href={`/${locale}/#matches`}
        linkLabel={matches.length > 9 ? `${more} (${matches.length})` : undefined}
      />

      {shown.length === 0 ? (
        <NoMatches locale={locale} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
