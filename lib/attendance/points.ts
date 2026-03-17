import type { AttendanceRecord } from "./types";

export const POINTS_CONFIG = {
  baseCheckIn: 10,
  streakBonus: {
    3: 5,    // +5 at 3-day streak
    7: 15,   // +15 at 7-day streak
    14: 30,  // +30 at 14-day streak
    30: 100, // +100 at 30-day streak
  },
  maxStreakBonus: 100,
} as const;

export function calculateDailyPoints(streakDay: number): number {
  let bonus = 0;
  for (const [threshold, value] of Object.entries(POINTS_CONFIG.streakBonus)) {
    if (streakDay >= Number(threshold)) bonus = value;
  }
  return POINTS_CONFIG.baseCheckIn + bonus;
}

export function getTotalPoints(history: AttendanceRecord[]): number {
  return history.reduce((sum, r) => sum + (r.checkedIn ? r.pointsEarned : 0), 0);
}

export function hasCheckedInToday(history: AttendanceRecord[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return history.some((r) => r.date === today && r.checkedIn);
}

export function getCurrentStreak(history: AttendanceRecord[]): number {
  const sorted = [...history]
    .filter((r) => r.checkedIn)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const record of sorted) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    const diff = (expected.getTime() - recordDate.getTime()) / 86400000;
    if (diff <= 1) {
      streak++;
      expected = recordDate;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
