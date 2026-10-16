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

export type CheckInResult =
  | { status: "checked_in"; pointsEarned: number; newStreak: number }
  | { status: "already_checked_in" }
  | { status: "paused" }
  | { status: "unauthenticated" }
  | { status: "profile_missing" }
  | { status: "failed" };

/**
 * Record today's check-in for the signed-in user through the
 * public.kv_daily_checkin() RPC (supabase/attendance-checkin-rpc.sql).
 *
 * The RPC identifies the caller with auth.uid() and computes the UTC day,
 * streak and points itself; it takes no input from the client. The
 * check-in record, ledger entry and balance change happen in one
 * transaction, and a retry on the same day pays nothing. While the DB payout
 * switch (kv_private.flags) is off the RPC returns { paused: true } and writes
 * nothing.
 */
export async function recordCheckIn(): Promise<CheckInResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("kv_daily_checkin");
  if (error) {
    if (error.code === "28000") return { status: "unauthenticated" };
    if (error.code === "P0002") return { status: "profile_missing" };
    console.error(JSON.stringify({ scope: "attendance", event: "checkin_failed", db_code: error.code ?? null }));
    return { status: "failed" };
  }

  const r = data as { checked_in?: boolean; already?: boolean; paused?: boolean; points_earned?: number; streak?: number } | null;
  if (r?.paused) return { status: "paused" };
  if (r?.already) return { status: "already_checked_in" };
  if (r?.checked_in && typeof r.points_earned === "number" && typeof r.streak === "number") {
    return { status: "checked_in", pointsEarned: r.points_earned, newStreak: r.streak };
  }
  console.error(JSON.stringify({ scope: "attendance", event: "checkin_unexpected_result" }));
  return { status: "failed" };
}
