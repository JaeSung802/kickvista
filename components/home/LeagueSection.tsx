/**
 * LeagueSection — Server Component
 *
 * Fetches Premier League standings directly via fetchAPI.
 * No localhost fetch — server component calls the data layer directly.
 */

import Image from "next/image";
import { fetchAPI } from "@/lib/api";
import type { ApfStandingsResponse, ApfStandingEntry } from "@/lib/types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getStandings(): Promise<{
  leagueName: string;
  leagueLogo: string;
  table: ApfStandingEntry[];
} | null> {
  const data = await fetchAPI<ApfStandingsResponse[]>("/standings?league=39&season=2025");
  const league = data.response?.[0]?.league;
  if (!league) return null;

  return {
    leagueName: league.name,
    leagueLogo: league.logo,
    table: league.standings?.[0] ?? [],
  };
}

// ─── Form dots ────────────────────────────────────────────────────────────────

function FormDots({ form }: { form: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {form
        .slice(-5)
        .split("")
        .map((ch, i) => (
          <span
            key={i}
            title={ch === "W" ? "승" : ch === "D" ? "무" : "패"}
            className={`w-1.5 h-1.5 rounded-full inline-block ${
              ch === "W"
                ? "bg-emerald-400"
                : ch === "D"
                ? "bg-gray-300"
                : "bg-red-400"
            }`}
          />
        ))}
    </div>
  );
}

// ─── Zone indicator ───────────────────────────────────────────────────────────

function ZoneBar({ rank }: { rank: number }) {
  // Top 4 → Champions League (blue), 5th → Europa (orange), 18–20 → Relegation (red)
  if (rank <= 4)  return <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />;
  if (rank === 5) return <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-400" />;
  if (rank >= 18) return <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />;
  return null;
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function StandingRow({ entry, isEven }: { entry: ApfStandingEntry; isEven: boolean }) {
  const isCL      = entry.rank <= 4;
  const isEL      = entry.rank === 5;
  const isRel     = entry.rank >= 18;

  return (
    <tr
      className={`
        relative border-t border-gray-100 hover:bg-gray-50 transition-colors
        ${isEven ? "bg-white" : "bg-gray-50/40"}
      `}
    >
      {/* Zone colour bar */}
      <td className="relative py-2.5 pl-4 pr-2 w-10">
        <ZoneBar rank={entry.rank} />
        <span
          className={`text-sm font-semibold tabular-nums ${
            isCL ? "text-blue-600" : isEL ? "text-orange-500" : isRel ? "text-red-500" : "text-gray-500"
          }`}
        >
          {entry.rank}
        </span>
      </td>

      {/* Team */}
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2.5">
          <Image
            src={entry.team.logo}
            alt={entry.team.name}
            width={20}
            height={20}
            className="object-contain shrink-0"
          />
          <span className="text-sm font-medium text-gray-800 truncate max-w-30">
            {entry.team.name}
          </span>
        </div>
      </td>

      {/* Played */}
      <td className="py-2.5 pr-4 text-sm text-gray-500 tabular-nums text-center w-10">
        {entry.all.played}
      </td>

      {/* W / D / L */}
      <td className="py-2.5 pr-3 text-sm text-emerald-600 tabular-nums text-center w-8 hidden sm:table-cell">
        {entry.all.win}
      </td>
      <td className="py-2.5 pr-3 text-sm text-gray-400 tabular-nums text-center w-8 hidden sm:table-cell">
        {entry.all.draw}
      </td>
      <td className="py-2.5 pr-3 text-sm text-red-400 tabular-nums text-center w-8 hidden sm:table-cell">
        {entry.all.lose}
      </td>

      {/* GD */}
      <td className="py-2.5 pr-4 text-sm tabular-nums text-center w-10 hidden md:table-cell">
        <span className={entry.goalsDiff > 0 ? "text-emerald-600" : entry.goalsDiff < 0 ? "text-red-500" : "text-gray-400"}>
          {entry.goalsDiff > 0 ? `+${entry.goalsDiff}` : entry.goalsDiff}
        </span>
      </td>

      {/* Form */}
      <td className="py-2.5 pr-4 hidden lg:table-cell">
        <FormDots form={entry.form ?? ""} />
      </td>

      {/* Points */}
      <td className="py-2.5 pr-4 text-center w-10">
        <span className="text-sm font-bold text-gray-900 tabular-nums">
          {entry.points}
        </span>
      </td>
    </tr>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        챔피언스리그
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
        유로파리그
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        강등권
      </span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default async function LeagueSection() {
  const result = await getStandings();

  if (!result) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">프리미어리그 순위</h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          순위 데이터를 불러올 수 없습니다
        </div>
      </section>
    );
  }

  const { leagueName, leagueLogo, table } = result;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Image
          src={leagueLogo}
          alt={leagueName}
          width={24}
          height={24}
          className="object-contain"
        />
        <h2 className="text-xl font-bold text-gray-900">{leagueName} 순위</h2>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">
                #
              </th>
              <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                팀
              </th>
              <th className="py-2.5 pr-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">
                경기
              </th>
              <th className="py-2.5 pr-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-8 hidden sm:table-cell">
                승
              </th>
              <th className="py-2.5 pr-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-8 hidden sm:table-cell">
                무
              </th>
              <th className="py-2.5 pr-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-8 hidden sm:table-cell">
                패
              </th>
              <th className="py-2.5 pr-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-10 hidden md:table-cell">
                GD
              </th>
              <th className="py-2.5 pr-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">
                최근
              </th>
              <th className="py-2.5 pr-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">
                승점
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((entry, idx) => (
              <StandingRow key={entry.team.id} entry={entry} isEven={idx % 2 === 0} />
            ))}
          </tbody>
        </table>

        <Legend />
      </div>
    </section>
  );
}
