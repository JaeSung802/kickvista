function calculatePoints(streakDay: number): number {
  if (streakDay >= 30) return 10 + 100;
  if (streakDay >= 14) return 10 + 30;
  if (streakDay >= 7) return 10 + 15;
  if (streakDay >= 3) return 10 + 5;
  return 10;
}

/** Check whether the given user has already checked in today. */
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("attendance_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("attendance_date", today)
    .maybeSingle();

  return !!data;
}

/** Fetch the last 30 days of attendance logs for a user. */
export async function getAttendanceHistory(userId: string): Promise<
  { date: string; checkedIn: boolean; streakDay: number; pointsEarned: number }[]
> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: rawLogs } = await supabase
    .from("attendance_logs")
    .select("attendance_date, points_earned, streak_day")
    .eq("user_id", userId)
    .gte("attendance_date", fromDate)
    .order("attendance_date", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs = (rawLogs ?? []) as any[];
  const logMap = new Map<string, { points_earned: number; streak_day: number }>(
    logs.map((l) => [l.attendance_date as string, l])
  );

  const result: { date: string; checkedIn: boolean; streakDay: number; pointsEarned: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const log = logMap.get(dateStr);
    result.push({
      date: dateStr,
      checkedIn: !!log,
      streakDay: log?.streak_day ?? 0,
      pointsEarned: log?.points_earned ?? 0,
    });
  }

  return result;
}

/**
 * Record today's check-in for a user.
 * Returns the points earned and new streak, or signals already-checked-in.
 */
export async function recordCheckIn(userId: string): Promise<{
  alreadyCheckedIn: boolean;
  pointsEarned: number;
  newStreak: number;
}> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  // Idempotency check
  const { data: existing } = await supabase
    .from("attendance_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("attendance_date", today)
    .maybeSingle();

  if (existing) {
    return { alreadyCheckedIn: true, pointsEarned: 0, newStreak: 0 };
  }

  // Get profile for current streak
  const { data: profileData } = await supabase
    .from("profiles")
    .select("current_streak, total_points")
    .eq("id", userId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any;

  // Check if yesterday was checked in
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: yesterdayLog } = await supabase
    .from("attendance_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("attendance_date", yesterdayStr)
    .maybeSingle();

  const newStreak = yesterdayLog
    ? (profile?.current_streak ?? 0) + 1
    : 1;
  const pointsEarned = calculatePoints(newStreak);

  // Insert log
  await supabase.from("attendance_logs").insert({
    user_id: userId,
    attendance_date: today,
    points_earned: pointsEarned,
    streak_day: newStreak,
  });

  // Update profile
  await supabase
    .from("profiles")
    .update({
      current_streak: newStreak,
      total_points: (profile?.total_points ?? 0) + pointsEarned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { alreadyCheckedIn: false, pointsEarned, newStreak };
}
