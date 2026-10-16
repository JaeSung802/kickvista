import { RANKS, getRank } from "@/lib/ranks";

interface RankTierListProps {
  locale: "ko" | "en";
  /** the signed-in user's current balance; null = not signed in / unknown (no position shown) */
  currentPoints: number | null;
}

// Readable on white (lib/ranks colours for gold / platinum are too light for text).
const TEXT_COLOR: Record<string, string> = {
  bronze: "#b45309",
  silver: "#64748b",
  gold: "#ca8a04",
  platinum: "#0284c7",
  legend: "#059669",
};

const t = {
  en: {
    current: "Current",
    mine: (p: string, tier: string) => `You hold ${p} P · ${tier}`,
    toNext: (p: string, tier: string) => `${p} P to ${tier}`,
    top: "Highest rank",
    guest: "Sign in to see your rank.",
    range5000: "5,000 P +",
    notes: [
      "Your rank is set by the points you currently hold, not by points earned in the past.",
      "Spending points in the shop lowers your balance and can lower your rank.",
      "Rank icons are separate from the title badges you can buy in the points shop.",
    ],
  },
  ko: {
    current: "현재 등급",
    mine: (p: string, tier: string) => `내 보유 포인트 ${p} P · ${tier}`,
    toNext: (p: string, tier: string) => `${tier}까지 ${p} P`,
    top: "최고 등급",
    guest: "로그인하면 내 등급을 표시합니다.",
    range5000: "5,000 P 이상",
    notes: [
      "등급은 지금 보유한 포인트로 정해집니다. 지금까지 모은 누적 포인트 기준이 아닙니다.",
      "상점에서 포인트를 사용하면 보유 포인트가 줄어 등급이 내려갈 수 있습니다.",
      "등급 아이콘은 포인트 상점에서 구매하는 칭호 배지와 별개입니다.",
    ],
  },
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function RankTierList({ locale, currentPoints }: RankTierListProps) {
  const tx = t[locale];
  const current = currentPoints === null ? null : getRank(currentPoints);
  const next = current ? RANKS[RANKS.indexOf(current) + 1] ?? null : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Current position */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm">
        {current && currentPoints !== null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold text-gray-900">
              {current.badge} {tx.mine(fmt(currentPoints), current.label[locale])}
            </span>
            <span className="text-xs text-gray-500">
              {next ? tx.toNext(fmt(next.min - currentPoints), next.label[locale]) : tx.top}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">{tx.guest}</span>
        )}
      </div>

      {/* Ladder: highest first */}
      <ol className="divide-y divide-gray-100">
        {[...RANKS].reverse().map((r) => {
          const isCurrent = current?.tier === r.tier;
          const range = r.max === Infinity ? tx.range5000 : `${fmt(r.min)} – ${fmt(r.max)} P`;
          return (
            <li
              key={r.tier}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 ${isCurrent ? "bg-emerald-50" : ""}`}
            >
              <span className="text-lg w-6 text-center shrink-0" aria-hidden>{r.badge}</span>
              <span className="text-sm font-extrabold min-w-0 flex-1" style={{ color: TEXT_COLOR[r.tier] }}>
                {r.label[locale]}
                {isCurrent && (
                  <span className="ml-2 align-middle text-[10px] font-bold text-white bg-emerald-600 rounded px-1.5 py-0.5">
                    {tx.current}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500 tabular-nums shrink-0">{range}</span>
            </li>
          );
        })}
      </ol>

      <ul className="px-4 sm:px-5 py-3 border-t border-gray-100 space-y-1">
        {tx.notes.map((n) => (
          <li key={n} className="text-xs text-gray-500 leading-relaxed">· {n}</li>
        ))}
      </ul>
    </div>
  );
}
