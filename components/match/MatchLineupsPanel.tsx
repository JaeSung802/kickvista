/**
 * MatchLineupsPanel — starting XI, substitutes, formation and coach per team,
 * as listed in the fixture response. A team the response has no lineup for
 * shows "not provided" in its own card.
 */

import type { Locale } from "@/lib/i18n";
import type { CoreLineup, CoreLineupPlayer } from "@/lib/football/match-core";
import MatchDataNotice, { type MatchPhase } from "@/components/match/MatchDataNotice";

const POS: Record<string, [string, string]> = { G: ["GK", "GK"], D: ["DF", "DF"], M: ["MF", "MF"], F: ["FW", "FW"] };

function PlayerRow({ p, isKo }: { p: CoreLineupPlayer; isKo: boolean }) {
  const pos = p.pos ? (POS[p.pos]?.[isKo ? 0 : 1] ?? p.pos) : null;
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-gray-400">{p.number ?? "–"}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-gray-800">{p.name}</span>
      {pos && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">{pos}</span>}
    </li>
  );
}

function TeamCard({ name, lineup, isKo, side }: { name: string; lineup: CoreLineup | null; isKo: boolean; side: "home" | "away" }) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4" data-lineup-side={side} data-lineup-start={lineup?.startXI.length ?? 0}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-bold text-gray-900">{name}</h3>
        {lineup?.formation && <span className="shrink-0 text-xs font-semibold text-emerald-600">{lineup.formation}</span>}
      </div>
      {!lineup ? (
        <p className="py-6 text-center text-[13px] text-gray-500">{isKo ? "이 팀의 라인업은 제공되지 않습니다." : "Lineup not available for this team."}</p>
      ) : (
        <>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{isKo ? "선발" : "Starting XI"}</h4>
          <ul className="divide-y divide-gray-50">{lineup.startXI.map((p, i) => <PlayerRow key={i} p={p} isKo={isKo} />)}</ul>
          {lineup.substitutes.length > 0 && (
            <>
              <h4 className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{isKo ? "교체 명단" : "Substitutes"}</h4>
              <ul className="divide-y divide-gray-50">{lineup.substitutes.map((p, i) => <PlayerRow key={i} p={p} isKo={isKo} />)}</ul>
            </>
          )}
          {lineup.coach && (
            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
              {isKo ? "감독" : "Coach"} <span className="font-semibold text-gray-700">{lineup.coach}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function MatchLineupsPanel({
  locale, lineups, phase, homeName, awayName,
}: {
  locale: Locale;
  lineups: { home: CoreLineup | null; away: CoreLineup | null } | null;
  phase: MatchPhase;
  homeName: string;
  awayName: string;
}) {
  if (!lineups) return <MatchDataNotice locale={locale} section="lineups" phase={phase} />;
  const isKo = locale === "ko";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-match-lineups="">
      <TeamCard name={homeName} lineup={lineups.home} isKo={isKo} side="home" />
      <TeamCard name={awayName} lineup={lineups.away} isKo={isKo} side="away" />
    </div>
  );
}
