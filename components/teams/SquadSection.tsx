"use client";

import { useRef, useState } from "react";
import PlayerModal, { type PlayerModalData } from "@/components/ui/PlayerModal";
import type { MockPlayer } from "@/lib/football/squads";
import { nationalityFlag } from "@/lib/football/nationality-flags";

interface SquadSectionProps {
  players: MockPlayer[];
  teamName: string;
  teamFlag: string;
  locale: "ko" | "en";
  /** ISO timestamp of when the squad data was last fetched */
  updatedAt?: string;
  /** Whether the data came from the live API (vs. mock fallback) */
  isLive?: boolean;
}

function PlayerAvatarFallback({ number }: { number: number }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 transition-colors">
      {/* Silhouette SVG */}
      <svg viewBox="0 0 36 36" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="12" r="6" fill="#9ca3af" className="group-hover:fill-emerald-400" style={{ transition: "fill 0.2s" }} />
        <path d="M4 34c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#9ca3af" className="group-hover:fill-emerald-400" style={{ transition: "fill 0.2s" }} />
        <text x="18" y="30" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" dy="0">{number}</text>
      </svg>
    </div>
  );
}

function PlayerAvatar({ id, number, name }: { id?: number; number: number; name: string }) {
  const [failed, setFailed] = useState(false);
  const photoUrl = id ? `https://media.api-sports.io/football/players/${id}.png` : null;

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100 border border-gray-200"
        onError={() => setFailed(true)}
      />
    );
  }

  return <PlayerAvatarFallback number={number} />;
}

const POS_LABELS: Record<string, { en: string; ko: string }> = {
  GK:  { en: "Goalkeepers",  ko: "골키퍼" },
  DEF: { en: "Defenders",    ko: "수비수" },
  MID: { en: "Midfielders",  ko: "미드필더" },
  FWD: { en: "Forwards",     ko: "공격수" },
};

export default function SquadSection({ players, teamName, teamFlag, locale, updatedAt, isLive }: SquadSectionProps) {
  const isKo = locale === "ko";
  const [selected, setSelected] = useState<PlayerModalData | null>(null);
  // Cache fetched stats so we don't re-fetch the same player twice
  const statsCache = useRef<Map<number, Partial<PlayerModalData>>>(new Map());

  async function handlePlayerClick(player: MockPlayer) {
    setSelected(player); // open modal immediately with existing data

    if (!player.id) return;

    // Return cached result if already fetched
    if (statsCache.current.has(player.id)) {
      const cached = statsCache.current.get(player.id)!;
      setSelected((prev) => (prev ? { ...prev, ...cached } : prev));
      return;
    }

    try {
      const res = await fetch(`/api/player-stats?id=${player.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // Pick the primary competition stats (first entry with the most appearances)
      const statistics: Array<{ games: { appearences: number | null }; goals: { total: number | null; assists: number | null } }> =
        data.statistics ?? [];
      const st = statistics.reduce(
        (best, cur) =>
          (cur.games.appearences ?? 0) > (best.games.appearences ?? 0) ? cur : best,
        statistics[0] ?? null,
      );

      if (!st) return;

      const update: Partial<PlayerModalData> = {};
      if (st.games.appearences != null) update.appearances = st.games.appearences;
      if (st.goals.total       != null) update.goals       = st.goals.total;
      if (st.goals.assists     != null) update.assists      = st.goals.assists;

      // Rating-based market value estimation (API-Football은 몸값을 직접 제공 안 함)
      const ratingRaw = (st.games as Record<string, unknown>).rating;
      const rating = ratingRaw ? parseFloat(String(ratingRaw)) : null;

      statsCache.current.set(player.id, update);
      setSelected((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...update };
        // 몸값이 없으면 rating으로 추정
        if (!next.marketValue && rating) {
          next.marketValue =
            rating >= 8.0 ? "~€80M+" :
            rating >= 7.5 ? "~€40M"  :
            rating >= 7.0 ? "~€20M"  : "~€10M";
        }
        return next;
      });
    } catch {
      // silently ignore — modal keeps existing data
    }
  }

  if (players.length === 0) return null;

  // Group by position
  const groups = (["GK", "DEF", "MID", "FWD"] as const).map((pos) => ({
    pos,
    label: isKo ? POS_LABELS[pos].ko : POS_LABELS[pos].en,
    players: players.filter((p) => p.position === pos).sort((a, b) => a.number - b.number),
  })).filter((g) => g.players.length > 0);

  return (
    <>
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
          <h2 className="text-base font-bold text-gray-900">
            {isKo ? "스쿼드" : "Squad"}
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {groups.map((group, gi) => (
            <div key={group.pos}>
              {/* Position header */}
              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {group.label}
              </div>
              {/* Players */}
              {group.players.map((player, idx) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-emerald-50 transition-colors group ${
                    idx < group.players.length - 1 || gi < groups.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  {/* Player photo / jersey number fallback */}
                  <PlayerAvatar id={player.id} number={player.number} name={player.name} />
                  {/* Name */}
                  <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                    {isKo && player.nameKo ? player.nameKo : player.name}
                  </span>
                  {/* Nationality (flag + name, desktop only) */}
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {nationalityFlag(player.nationality)} {player.nationality}
                  </span>
                  {/* Age */}
                  <span className="text-xs text-gray-400 shrink-0">
                    {player.age ? `${player.age}${isKo ? "세" : "y"}` : "—"}
                  </span>
                  {/* Stats preview */}
                  {(player.goals !== undefined || player.assists !== undefined) && (
                    <span className="text-xs text-gray-400 shrink-0 hidden md:block">
                      {player.goals ?? 0}G · {player.assists ?? 0}A
                    </span>
                  )}
                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          ))}
          {/* Footer: data freshness indicator */}
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {isLive ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isKo ? "실시간 API 데이터" : "Live API data"}
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {isKo ? "참고용 데이터" : "Reference data"}
                </>
              )}
            </span>
            {updatedAt && (
              <span className="text-[11px] text-gray-400">
                {isKo ? "업데이트" : "Updated"}{" "}
                {new Date(updatedAt).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </section>

      <PlayerModal
        player={selected}
        onClose={() => setSelected(null)}
        locale={locale}
        teamName={teamName}
        teamFlag={teamFlag}
      />
    </>
  );
}
