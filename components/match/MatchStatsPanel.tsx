/**
 * MatchStatsPanel — team statistics from the fixture response, in the order the
 * API lists them. A value the response leaves empty shows "–"; a comparison bar
 * is drawn only when both values are non-negative numbers.
 */

import type { Locale } from "@/lib/i18n";
import { statNumber, type CoreStatRow } from "@/lib/football/match-core";
import MatchDataNotice, { type MatchPhase } from "@/components/match/MatchDataNotice";

const LABELS: Record<string, [string, string]> = {
  "Ball Possession":  ["점유율", "Possession"],
  "Total Shots":      ["슈팅", "Total shots"],
  "Shots on Goal":    ["유효 슈팅", "Shots on target"],
  "Shots off Goal":   ["빗나간 슈팅", "Shots off target"],
  "Blocked Shots":    ["막힌 슈팅", "Blocked shots"],
  "Shots insidebox":  ["박스 안 슈팅", "Shots inside box"],
  "Shots outsidebox": ["박스 밖 슈팅", "Shots outside box"],
  "Fouls":            ["파울", "Fouls"],
  "Corner Kicks":     ["코너킥", "Corners"],
  "Offsides":         ["오프사이드", "Offsides"],
  "Yellow Cards":     ["경고", "Yellow cards"],
  "Red Cards":        ["퇴장", "Red cards"],
  "Goalkeeper Saves": ["선방", "Goalkeeper saves"],
  "Total passes":     ["패스", "Passes"],
  "Passes accurate":  ["성공한 패스", "Accurate passes"],
  "Passes %":         ["패스 성공률", "Pass accuracy"],
  "expected_goals":   ["기대 득점(xG)", "Expected goals (xG)"],
  "goals_prevented":  ["실점 방지(골키퍼)", "Goals prevented"],
};

function display(v: number | string | null) {
  return v === null ? "–" : String(v);
}

export default function MatchStatsPanel({
  locale, statistics, phase, homeName, awayName,
}: {
  locale: Locale;
  statistics: CoreStatRow[] | null;
  phase: MatchPhase;
  homeName: string;
  awayName: string;
}) {
  if (!statistics) return <MatchDataNotice locale={locale} section="statistics" phase={phase} />;
  const isKo = locale === "ko";
  return (
    <section className="rounded-xl border border-gray-200 bg-white" data-match-stats={statistics.length}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-xs font-semibold text-gray-500">
        <span className="truncate">{homeName}</span>
        <span className="truncate text-right">{awayName}</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {statistics.map((row) => {
          const label = LABELS[row.type]?.[isKo ? 0 : 1] ?? row.type;
          const h = statNumber(row.home), a = statNumber(row.away);
          const bar = h !== null && a !== null && h >= 0 && a >= 0 && h + a > 0;
          const hPct = bar ? (h! / (h! + a!)) * 100 : 0;
          return (
            <li key={row.type} className="px-4 py-2.5" data-stat-type={row.type}>
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-sm font-bold tabular-nums text-gray-900">{display(row.home)}</span>
                <span className="min-w-0 flex-1 text-center text-xs text-gray-500">{label}</span>
                <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums text-gray-900">{display(row.away)}</span>
              </div>
              {bar && (
                <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                  <span className="rounded-l-full bg-emerald-500" style={{ width: `${hPct}%` }} />
                  <span className="flex-1 rounded-r-full bg-gray-300" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
