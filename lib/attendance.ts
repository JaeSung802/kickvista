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

export type CheckInStatusFailure = "not_installed" | "permission_denied" | "unauthenticated" | "error";

export type CheckInStatus =
  | {
      ok: true;
      checkedInToday: boolean;
      /** streak from the trusted check-in records only (0 when the last one is older than yesterday) */
      streak: number;
    }
  | { ok: false; reason: CheckInStatusFailure };

/**
 * Today's check-in status for the signed-in user from the read-only
 * public.kv_my_checkin_status() RPC (supabase/attendance-status-rpc.sql),
 * which must be applied before an app version using it is deployed.
 *
 * There is no fallback to profiles.current_streak / attendance_logs: on any
 * failure the result says why, and callers show the status as unknown.
 *   not_installed      function missing (PGRST202 / 42883)
 *   permission_denied  EXECUTE not granted (42501)
 *   unauthenticated    no / expired session (28000, PGRST3xx)
 *   error              network, DB or malformed result
 */
export async function getMyCheckInStatus(): Promise<CheckInStatus> {
  const fail = (reason: CheckInStatusFailure, code: string | null): CheckInStatus => {
    console.error(JSON.stringify({ scope: "attendance", event: "status_unavailable", reason, db_code: code }));
    return { ok: false, reason };
  };
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("kv_my_checkin_status");
    if (error) {
      const code = error.code ?? "";
      if (code === "PGRST202" || code === "42883") return fail("not_installed", code);
      if (code === "42501") return fail("permission_denied", code);
      if (code === "28000" || code.startsWith("PGRST3")) return fail("unauthenticated", code);
      return fail("error", code || null);
    }
    const r = data as { checked_in_today?: unknown; streak?: unknown } | null;
    if (typeof r?.checked_in_today !== "boolean" || typeof r?.streak !== "number") return fail("error", "unexpected_result");
    return { ok: true, checkedInToday: r.checked_in_today, streak: r.streak };
  } catch {
    return fail("error", "exception");
  }
}

/**
 * Fetch the last 30 days of attendance logs for a user (display only; policy A
 * keeps old rows visible but never uses them for streaks or rewards).
 * Throws when the query fails, so callers can tell a failure from a month
 * without check-ins.
 */
export async function getAttendanceHistory(userId: string): Promise<
  { date: string; checkedIn: boolean; streakDay: number; pointsEarned: number }[]
> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: rawLogs, error } = await supabase
    .from("attendance_logs")
    .select("attendance_date, points_earned, streak_day")
    .eq("user_id", userId)
    .gte("attendance_date", fromDate)
    .order("attendance_date", { ascending: true });
  if (error || !Array.isArray(rawLogs)) {
    throw new Error(`attendance history query failed${error?.code ? ` (${error.code})` : ""}`);
  }

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
  | { status: "checked_in"; pointsEarned: number; newStreak: number; totalPoints: number | null }
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

  const r = data as { checked_in?: boolean; already?: boolean; paused?: boolean; points_earned?: number; streak?: number; total_points?: number } | null;
  if (r?.paused) return { status: "paused" };
  if (r?.already) return { status: "already_checked_in" };
  if (r?.checked_in && typeof r.points_earned === "number" && typeof r.streak === "number") {
    return {
      status: "checked_in",
      pointsEarned: r.points_earned,
      newStreak: r.streak,
      totalPoints: typeof r.total_points === "number" ? r.total_points : null,
    };
  }
  console.error(JSON.stringify({ scope: "attendance", event: "checkin_unexpected_result" }));
  return { status: "failed" };
}
