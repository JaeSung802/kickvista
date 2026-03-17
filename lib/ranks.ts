export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "legend";

export interface RankInfo {
  tier: RankTier;
  badge: string;
  color: string;
  label: { en: string; ko: string };
  min: number;
  max: number;
}

export const RANKS: RankInfo[] = [
  {
    tier: "bronze",
    badge: "🥉",
    color: "#cd7f32",
    label: { en: "Bronze", ko: "브론즈" },
    min: 0,
    max: 99,
  },
  {
    tier: "silver",
    badge: "🥈",
    color: "#c0c0c0",
    label: { en: "Silver", ko: "실버" },
    min: 100,
    max: 499,
  },
  {
    tier: "gold",
    badge: "🥇",
    color: "#ffd700",
    label: { en: "Gold", ko: "골드" },
    min: 500,
    max: 1999,
  },
  {
    tier: "platinum",
    badge: "💎",
    color: "#a8d8ea",
    label: { en: "Platinum", ko: "플래티넘" },
    min: 2000,
    max: 4999,
  },
  {
    tier: "legend",
    badge: "👑",
    color: "#a855f7",
    label: { en: "Legend", ko: "레전드" },
    min: 5000,
    max: Infinity,
  },
];

export function getRank(points: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

/** Progress toward the next rank, 0–100 */
export function getProgressToNextRank(points: number): number {
  const rank = getRank(points);
  if (rank.max === Infinity) return 100;
  const range = rank.max + 1 - rank.min;
  const progress = points - rank.min;
  return Math.round((progress / range) * 100);
}
