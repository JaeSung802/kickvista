"use client";

import { useEffect } from "react";
import { nationalityFlag } from "@/lib/football/nationality-flags";

export interface PlayerModalData {
  id?: number;       // API player ID (for photo)
  name: string;
  nameKo?: string;
  position: string;
  number: number;
  nationality: string;
  height?: string;
  weight?: string;
  age?: number;
  goals?: number;
  assists?: number;
  appearances?: number;
  marketValue?: string;  // e.g. "€85M", "€120M", "£50M"
  // Ability stats (0–100). If absent, defaults computed by position.
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
}

interface PlayerModalProps {
  player: PlayerModalData | null;
  onClose: () => void;
  locale: "ko" | "en";
  teamName: string;
  teamFlag: string;
}

const POSITION_LABELS: Record<string, { en: string; ko: string; bg: string; color: string }> = {
  GK:  { en: "Goalkeeper",  ko: "골키퍼",   bg: "#fef9c3", color: "#ca8a04" },
  DEF: { en: "Defender",    ko: "수비수",   bg: "#dbeafe", color: "#1d4ed8" },
  MID: { en: "Midfielder",  ko: "미드필더", bg: "#d1fae5", color: "#059669" },
  FWD: { en: "Forward",     ko: "공격수",   bg: "#fee2e2", color: "#dc2626" },
};

// Default ability stats by position
const POS_DEFAULTS: Record<string, [number, number, number, number, number, number]> = {
  //             pace  shoot pass  drib  def   phys
  GK:  [55,  20,  60,  30,  80,  75],
  DEF: [65,  45,  70,  55,  85,  80],
  MID: [72,  68,  84,  76,  65,  70],
  FWD: [82,  85,  70,  80,  40,  68],
};

// Convert market value string (€85M, £50M, €1.5B) to Korean 억원 approximation
function toKRW(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/[€£]?([\d.]+)\s*(M|B|K)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] ?? "M").toUpperCase();
  let eurValue = unit === "B" ? num * 1000 : unit === "K" ? num / 1000 : num; // in millions EUR
  // EUR → KRW ≈ 1,480 (2025 rate)
  const krwBillion = eurValue * 1480 / 100; // → 억원
  if (krwBillion >= 10000) return `약 ${(krwBillion / 10000).toFixed(1)}조원`;
  if (krwBillion >= 100) return `약 ${Math.round(krwBillion / 100) * 100}억원`;
  return `약 ${Math.round(krwBillion)}억원`;
}

// Draw SVG radar / hexagon chart with position-average overlay
function RadarChart({
  stats,
  avgStats,
  labels,
}: {
  stats: number[];     // 6 values 0–100 (player)
  avgStats: number[];  // 6 values 0–100 (position average)
  labels: string[];    // 6 labels
}) {
  const cx = 80;
  const cy = 80;
  const r  = 60;
  const n  = stats.length;
  const angles = stats.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function polar(value: number, idx: number): [number, number] {
    const ratio = value / 100;
    return [
      cx + r * ratio * Math.cos(angles[idx]),
      cy + r * ratio * Math.sin(angles[idx]),
    ];
  }

  function outerPoint(idx: number): [number, number] {
    return [cx + r * Math.cos(angles[idx]), cy + r * Math.sin(angles[idx])];
  }

  const outerPts  = stats.map((_, i) => outerPoint(i).join(",")).join(" ");
  const midPts    = stats.map((_, i) => {
    const [x, y] = outerPoint(i);
    return `${cx + (x - cx) * 0.5},${cy + (y - cy) * 0.5}`;
  }).join(" ");
  const valuePts  = stats.map((v, i) => polar(v, i).join(",")).join(" ");
  const avgPts    = avgStats.map((v, i) => polar(v, i).join(",")).join(" ");

  return (
    <svg viewBox="-16 -16 192 192" className="w-40 h-40 mx-auto" aria-hidden>
      {/* Background grid */}
      <polygon points={outerPts} fill="rgba(22,163,74,0.04)" stroke="rgba(22,163,74,0.15)" strokeWidth="0.5" />
      <polygon points={midPts}   fill="none" stroke="rgba(22,163,74,0.1)"  strokeWidth="0.5" />
      {/* Axis lines */}
      {stats.map((_, i) => {
        const [ox, oy] = outerPoint(i);
        return <line key={i} x1={cx} y1={cy} x2={ox} y2={oy} stroke="rgba(22,163,74,0.15)" strokeWidth="0.5" />;
      })}
      {/* Position average overlay (gray) */}
      <polygon points={avgPts} fill="rgba(156,163,175,0.2)" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
      {/* Player value polygon (green) */}
      <polygon points={valuePts} fill="rgba(22,163,74,0.25)" stroke="#059669" strokeWidth="1.5" />
      {/* Dots */}
      {stats.map((v, i) => {
        const [px, py] = polar(v, i);
        return <circle key={i} cx={px} cy={py} r="2.5" fill="#059669" />;
      })}
      {/* Labels only — values shown in grid below */}
      {stats.map((_, i) => {
        const scale = 1.25;
        const ox = cx + r * scale * Math.cos(angles[i]);
        const oy = cy + r * scale * Math.sin(angles[i]);
        const anchor =
          ox < cx - 2 ? "end" : ox > cx + 2 ? "start" : "middle";
        return (
          <text key={i} x={ox} y={oy + 4} fontSize="8.5" fill="#6b7280" textAnchor={anchor} fontWeight="600">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// Position average stats (approximate league averages by position)
const POS_AVERAGES: Record<string, [number, number, number, number, number, number]> = {
  //      pace  shoot pass  drib  def   phys
  GK:  [48,  15,  52,  25,  68,  65],
  DEF: [60,  38,  62,  48,  74,  72],
  MID: [65,  58,  74,  66,  56,  62],
  FWD: [72,  72,  62,  70,  34,  60],
};

export default function PlayerModal({ player, onClose, locale, teamName, teamFlag }: PlayerModalProps) {
  const isKo = locale === "ko";

  useEffect(() => {
    if (!player) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [player, onClose]);

  if (!player) return null;

  const pos = POSITION_LABELS[player.position] ?? { en: player.position, ko: player.position, bg: "#f3f4f6", color: "#374151" };

  // Build stats array — use player overrides or position defaults
  const defaults = POS_DEFAULTS[player.position] ?? POS_DEFAULTS.MID;
  const avgDefaults = POS_AVERAGES[player.position] ?? POS_AVERAGES.MID;
  const stats = [
    player.pace      ?? defaults[0],
    player.shooting  ?? defaults[1],
    player.passing   ?? defaults[2],
    player.dribbling ?? defaults[3],
    player.defending ?? defaults[4],
    player.physical  ?? defaults[5],
  ];
  const radarLabels = isKo
    ? ["빠르기", "슈팅", "패스", "드리블", "수비", "피지컬"]
    : ["Pace", "Shoot", "Pass", "Drib", "Def", "Phys"];

  const handleShare = () => {
    const p = player!;
    const text = [
      `${isKo && p.nameKo ? p.nameKo : p.name} (${teamName})`,
      `⚽ ${isKo ? "출전" : "Apps"}: ${p.appearances ?? "—"} | ${isKo ? "골" : "Goals"}: ${p.goals ?? "—"} | ${isKo ? "어시" : "Assists"}: ${p.assists ?? "—"}`,
      p.marketValue ? `💰 ${p.marketValue}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const krw = isKo ? toKRW(player.marketValue) : null;

  // Player photo: use api-sports CDN if we have a numeric id
  const photoUrl = player.id
    ? `https://media.api-sports.io/football/players/${player.id}.png`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-0"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-sm max-h-[92svh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — 고정, 스크롤 안 됨 */}
        <div className="bg-emerald-600 px-6 pt-6 pb-10 relative shrink-0">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
            aria-label={isKo ? "공유" : "Share"}
            title={isKo ? "스탯 복사" : "Copy stats"}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v-1a3 3 0 0 1 3-3h4"/>
              <polyline points="10 5 13 2 16 5"/>
              <path d="M16 12v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h1"/>
            </svg>
          </button>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
            aria-label="Close"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8"/>
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {/* Photo — 번호를 베이스로, 사진이 위에 덮임 (실패시 번호 노출) */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden relative">
              <span className="text-2xl font-black text-white">
                {player.number > 0 ? `#${player.number}` : "?"}
              </span>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={player.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white leading-tight truncate">
                {isKo && player.nameKo ? player.nameKo : player.name}
              </h2>
              <div className="text-emerald-100 text-sm mt-0.5">{teamFlag} {teamName}</div>
              {/* Nationality + Age + Position pills */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full">
                  {nationalityFlag(player.nationality)} {player.nationality}
                </span>
                {player.age && (
                  <span className="inline-flex items-center text-[11px] font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full">
                    {player.age}{isKo ? "세" : "y"}
                  </span>
                )}
                <span
                  className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: pos.bg, color: pos.color }}
                >
                  {isKo ? pos.ko : pos.en}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 흰색 영역만 스크롤 */}
        <div className="overflow-y-auto overscroll-contain flex-1 scroll-smooth">

        {/* Jersey number badge — overlapping */}
        <div className="px-6">
          <div className="flex items-center gap-2 -mt-5 mb-4">
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm"
              style={{ background: pos.bg, color: pos.color, borderColor: pos.color + "40" }}
            >
              #{player.number}
            </span>
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-4">

          {/* Season stats */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              {isKo ? "이번 시즌 기록" : "Season Stats"}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: isKo ? "출전" : "Apps",      value: player.appearances ?? "—" },
                { label: isKo ? "골" : "Goals",       value: player.goals ?? "—" },
                { label: isKo ? "어시" : "Assists",   value: player.assists ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                  <div className="text-2xl font-black text-gray-900 tabular-nums">{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              {isKo ? "능력치" : "Ability"}
            </h3>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 pt-2 pb-3">
              <RadarChart stats={stats} avgStats={avgDefaults as number[]} labels={radarLabels} />
              {/* Stat value grid */}
              <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 px-4 mt-1">
                {radarLabels.map((label, i) => (
                  <div key={label} className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 shrink-0">{label}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden" style={{ width: 28 }}>
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats[i]}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 tabular-nums w-5 text-right shrink-0">{stats[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 pt-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="inline-block w-3 h-1 rounded bg-emerald-600" />
                  {isKo ? "선수" : "Player"}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="inline-block w-3 h-0.5 rounded border border-dashed border-gray-400" />
                  {isKo ? "포지션 평균" : "Pos. avg"}
                </span>
              </div>
            </div>
          </div>

          {/* Player info */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              {isKo ? "선수 정보" : "Player Info"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: isKo ? "나이" : "Age",          value: player.age ? `${player.age}${isKo ? "세" : "y"}` : (isKo ? "정보 없음" : "N/A"), highlight: false },
                { label: isKo ? "키" : "Height",         value: player.height ?? (isKo ? "정보 없음" : "N/A"),           highlight: false },
                { label: isKo ? "몸무게" : "Weight",     value: player.weight ?? (isKo ? "정보 없음" : "N/A"),           highlight: false },
                { label: isKo ? "국적" : "Nationality",  value: `${nationalityFlag(player.nationality)} ${player.nationality}`, highlight: false },
                { label: isKo ? "몸값" : "Market Value", value: player.marketValue ?? (isKo ? "정보 없음" : "N/A"),      highlight: true  },
                { label: isKo ? "원화" : "KRW (approx)", value: krw ?? (isKo ? "정보 없음" : "N/A"),                     highlight: true  },
              ].filter(({ label }) => !(label === (isKo ? "원화" : "KRW (approx)") && !krw))
               .map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className={`text-xs font-bold ${highlight ? "text-emerald-600" : "text-gray-900"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div> {/* end scroll wrapper */}
      </div>
    </div>
  );
}
