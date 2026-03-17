export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "legend";

export interface RankInfo {
  tier: RankTier;
  label: string;
  labelKo: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  badge: string;
  emoji: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;           // YYYY-MM-DD
  checkedIn: boolean;
  streakDay: number;      // consecutive day count
  pointsEarned: number;
  createdAt: string;
}

export interface UserAttendanceSummary {
  userId: string;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  rank: RankTier;
  lastCheckedIn?: string;
  history: AttendanceRecord[];
}
