import "server-only";

/**
 * Temporary server-side pause of daily check-in.
 *
 * While true, POST /api/attendance/check-in returns 503 before any session
 * lookup or database work, so neither the previous direct-write path nor
 * the kv_daily_checkin() RPC can pay. Used to switch check-in paths (or
 * roll back) without the two ever running at the same time.
 *
 * Typed as boolean (not a literal) so the code after the check stays
 * type-checked.
 */
export const ATTENDANCE_CHECKIN_PAUSED: boolean = true;

/**
 * Shows the streak notice of the check-in resume (policy A: streaks start
 * again from day 1 with the first check-in after resuming; history and
 * points are kept) on the attendance widget. Display only; does not change
 * check-in or the payout.
 */
export const ATTENDANCE_RESUME_NOTICE: boolean = true;
