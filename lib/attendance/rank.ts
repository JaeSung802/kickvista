import type { RankInfo, RankTier } from "./types";

export const RANK_TIERS: RankInfo[] = [
  {
    tier: "bronze",
    label: "Bronze",
    labelKo: "브론즈",
    minPoints: 0,
    maxPoints: 99,
    color: "#cd7f32",
    badge: "🥉",
    emoji: "🏆",
  },
  {
    tier: "silver",
    label: "Silver",
    labelKo: "실버",
    minPoints: 100,
    maxPoints: 499,
    color: "#c0c0c0",
    badge: "🥈",
    emoji: "⭐",
  },
  {
    tier: "gold",
    label: "Gold",
    labelKo: "골드",
    minPoints: 500,
    maxPoints: 1999,
    color: "#f59e0b",
    badge: "🥇",
    emoji: "🌟",
  },
  {
    tier: "platinum",
    label: "Platinum",
    labelKo: "플래티넘",
    minPoints: 2000,
    maxPoints: 4999,
    color: "#22c55e",
    badge: "💎",
    emoji: "💫",
  },
  {
    tier: "legend",
    label: "Legend",
    labelKo: "레전드",
    minPoints: 5000,
    maxPoints: null,
    color: "#9333ea",
    badge: "👑",
    emoji: "🔥",
  },
];

export function getRankByPoints(points: number): RankInfo {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (points >= RANK_TIERS[i].minPoints) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

export function getNextRank(current: RankTier): RankInfo | null {
  const idx = RANK_TIERS.findIndex((r) => r.tier === current);
  return RANK_TIERS[idx + 1] ?? null;
}

export function getProgressToNextRank(points: number): number {
  const current = getRankByPoints(points);
  const next = getNextRank(current.tier);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  return Math.min(100, Math.round((earned / range) * 100));
}
