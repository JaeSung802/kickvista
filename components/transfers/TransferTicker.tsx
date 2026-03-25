"use client";

export interface TickerItem {
  player: string;
  playerKo: string;
  fromTeam: string;
  fromTeamKo: string;
  toTeam: string;
  toTeamKo: string;
  fee: string;
  status: "confirmed" | "rumour" | "imminent" | "rejected";
  source?: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#059669",
  imminent:  "#d97706",
  rumour:    "#9ca3af",
  rejected:  "#dc2626",
};

const STATUS_LABELS: Record<string, { en: string; ko: string }> = {
  confirmed: { en: "✅ DONE DEAL",  ko: "✅ 확정" },
  imminent:  { en: "🔥 IMMINENT",   ko: "🔥 임박" },
  rumour:    { en: "💬 RUMOUR",     ko: "💬 루머" },
  rejected:  { en: "❌ REJECTED",   ko: "❌ 거절" },
};

interface TransferTickerProps {
  items: TickerItem[];
  locale: "ko" | "en";
}

export default function TransferTicker({ items, locale }: TransferTickerProps) {
  const isKo = locale === "ko";
  // Duplicate items so the scroll loops seamlessly
  const all = [...items, ...items];

  return (
    <div
      className="bg-gray-900 text-white overflow-hidden border-b border-gray-700"
      style={{ height: 36 }}
    >
      <div className="flex items-center h-full">
        {/* Label */}
        <div className="shrink-0 bg-emerald-600 h-full flex items-center px-3 z-10 gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="4"/>
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="2" opacity="0.4"/>
          </svg>
          <span className="text-xs font-bold tracking-wide whitespace-nowrap">
            {isKo ? "이적 속보" : "TRANSFER NEWS"}
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex items-center gap-0 whitespace-nowrap"
            style={{ animation: "ticker-scroll 60s linear infinite" }}
          >
            {all.map((item, i) => {
              const statusColor = STATUS_COLORS[item.status];
              const statusLabel = STATUS_LABELS[item.status];
              const player = isKo ? item.playerKo : item.player;
              const from = isKo ? item.fromTeamKo : item.fromTeam;
              const to = isKo ? item.toTeamKo : item.toTeam;

              return (
                <span key={i} className="inline-flex items-center gap-2 px-6 text-xs">
                  <span style={{ color: statusColor }} className="font-bold text-[10px] tracking-wide">
                    {isKo ? statusLabel.ko : statusLabel.en}
                  </span>
                  <span className="font-semibold text-white">{player}</span>
                  <span className="text-gray-400">{from} → {to}</span>
                  <span className="font-bold text-amber-400">{item.fee}</span>
                  {item.source && (
                    <span className="text-gray-500 text-[10px]">— {item.source}</span>
                  )}
                  <span className="text-gray-600 mx-2">·</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
