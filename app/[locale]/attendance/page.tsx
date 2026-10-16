import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import { ATTENDANCE_CHECKIN_PAUSED, ATTENDANCE_RESUME_NOTICE } from "@/lib/attendance-pause";
import AttendanceHistory from "@/components/attendance/AttendanceHistory";
import LoadError from "@/components/attendance/LoadError";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import { getServerUser, loadServerProfile, type ProfileLoad } from "@/lib/auth";
import { getAttendanceHistory, getMyCheckInStatus } from "@/lib/attendance";
import { getRank, getProgressToNextRank } from "@/lib/ranks";
import PointRankingWidget from "@/components/ranking/PointRankingWidget";
import RankTierList from "@/components/attendance/RankTierList";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? "출석 체크 & 포인트" : "Daily Attendance & Points",
    description:
      loc === "ko"
        ? "매일 출석 체크로 포인트를 모으고 브론즈부터 레전드까지 등급을 올리세요."
        : "Check in daily to earn points and climb from Bronze to Legend rank on KickVista.",
    path: "/attendance",
  });
}

const labels = {
  en: {
    pageTitle: "Daily Attendance",
    pageSubtitle: "Check in every day to earn points and climb the ranks",
    systemBadge: "Attendance Rewards System",
    checkInTitle: "Today's Check-In",
    historyTitle: "Your 30-Day History",
    profileError: "Couldn't load your points and check-in details.",
    profileMissing: "Your profile wasn't found. Sign in again or try again in a moment.",
    historyError: "Couldn't load your attendance history.",
    retry: "Try again",
    retrying: "Loading…",
    pointsSystemTitle: "Points System",
    basePoints: "Base: 10 pts / day",
    streak3: "Streak day 3–6: +5 pts",
    streak7: "Streak day 7–13: +15 pts",
    streak14: "Streak day 14–29: +30 pts",
    streak30: "Streak day 30+: +100 pts",
    pointsNote: "One bonus applies per day (e.g. day 7 = 10 + 15 = 25 pts). Same for every rank.",
    ranksTitle: "Rank Tiers",
    ranksSubtitle: "Your rank follows the points you currently hold.",
    leaderboardTitle: "Points Ranking",
    leaderboardSubtitle: "Ranked by points currently held — all time, not monthly.",
    rank: "Rank",
    user: "User",
    tier: "Tier",
    streak: "Streak",
    points: "Points",
    days: "days",
    pts: "pts",
  },
  ko: {
    pageTitle: "출석 체크",
    pageSubtitle: "매일 출석 체크로 포인트를 쌓고 등급을 올리세요",
    systemBadge: "출석 보상 시스템",
    checkInTitle: "오늘 출석 체크",
    historyTitle: "최근 30일 출석 기록",
    profileError: "내 포인트와 출석 정보를 불러오지 못했습니다.",
    profileMissing: "프로필 정보를 찾지 못했습니다. 다시 로그인하거나 잠시 후 다시 시도해 주세요.",
    historyError: "출석 기록을 불러오지 못했습니다.",
    retry: "다시 시도",
    retrying: "불러오는 중…",
    pointsSystemTitle: "포인트 시스템",
    basePoints: "기본: 하루 10 포인트",
    streak3: "연속 3–6일차: +5 포인트",
    streak7: "연속 7–13일차: +15 포인트",
    streak14: "연속 14–29일차: +30 포인트",
    streak30: "연속 30일차 이상: +100 포인트",
    pointsNote: "보너스는 하루에 한 구간만 적용됩니다 (예: 7일차 = 10 + 15 = 25 포인트). 등급과 관계없이 같습니다.",
    ranksTitle: "등급 시스템",
    ranksSubtitle: "등급은 현재 보유 포인트에 따라 정해집니다.",
    leaderboardTitle: "보유 포인트 랭킹",
    leaderboardSubtitle: "현재 보유 포인트가 많은 순서입니다. 월간 집계가 아닙니다.",
    rank: "순위",
    user: "유저",
    tier: "등급",
    streak: "연속",
    points: "포인트",
    days: "일",
    pts: "pts",
  },
};

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = labels[loc];
  const isKo = loc === "ko";

  // Signed-in data only. A failed read is shown as an error (with a retry),
  // never as sample data, "missed" days or 0 points.
  const supabaseUser = await getServerUser();
  let profileLoad: ProfileLoad | null = null;
  let history: Awaited<ReturnType<typeof getAttendanceHistory>> | null = null; // null = failed

  // Default to Bronze (0 pts) — the correct starting rank for any new / unauthenticated user.
  // This is what renders inside <AttendanceWidget> only when supabaseUser is truthy;
  // the widget is hidden for guests (login prompt shown instead).
  const BRONZE = getRank(0);
  let widgetProps = {
    totalDays: null as number | null,
    currentStreak: null as number | null,
    totalPoints: 0,
    rankTier: BRONZE.tier as import("@/lib/ranks").RankTier,
    rankLabel: BRONZE.label[loc],
    rankColor: BRONZE.color,
    rankBadge: BRONZE.badge,
    hasCheckedInToday: null as boolean | null,
    progressToNextRank: 0,
    locale: loc,
  };

  if (supabaseUser) {
    const [profileR, historyR, statusR] = await Promise.allSettled([
      loadServerProfile(supabaseUser.id),
      getAttendanceHistory(supabaseUser.id),
      getMyCheckInStatus(),
    ]);
    profileLoad = profileR.status === "fulfilled" ? profileR.value : { status: "error" };
    history = historyR.status === "fulfilled" ? historyR.value : null;
    const profile  = profileLoad.status === "ok" ? profileLoad.profile : null;
    // Streak and "checked in today" come only from the trusted status RPC;
    // when it fails they stay unknown (null) instead of using legacy values.
    const status   = statusR.status   === "fulfilled" && statusR.value.ok ? statusR.value : null;

    if (profile) {
      const rank = getRank(profile.total_points);
      widgetProps = {
        totalDays: history ? history.filter((h) => h.checkedIn).length : null,
        currentStreak: status ? status.streak : null,
        totalPoints: profile.total_points,
        rankTier: rank.tier,
        rankLabel: rank.label[loc],
        rankColor: rank.color,
        rankBadge: rank.badge,
        hasCheckedInToday: status ? status.checkedInToday : null,
        progressToNextRank: getProgressToNextRank(profile.total_points),
        locale: loc,
      };
    }
  }

  // Balance for the rank ladder's current position; null when signed out or
  // the profile could not be read (no position is shown then).
  const currentPoints: number | null = profileLoad?.status === "ok" ? profileLoad.profile.total_points : null;

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Page hero ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold text-emerald-700 mb-4">
            🏆 {t.systemBadge}
          </span>
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">
            {t.pageTitle}
          </h1>
          <p className="text-gray-500 text-sm">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* ── Top ad ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner slot="attendance-top" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Two-column grid: main + sidebar ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* LEFT: Widget + History */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {supabaseUser ? (
              <>
                {/* Attendance widget */}
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-4">{t.checkInTitle}</h2>
                  {profileLoad?.status === "ok" ? (
                    <AttendanceWidget
                      {...widgetProps}
                      checkInPaused={ATTENDANCE_CHECKIN_PAUSED}
                      resumeNotice={ATTENDANCE_RESUME_NOTICE}
                    />
                  ) : (
                    <LoadError
                      message={profileLoad?.status === "missing" ? t.profileMissing : t.profileError}
                      retryLabel={t.retry}
                      retryingLabel={t.retrying}
                    />
                  )}
                </div>

                {/* Attendance history */}
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-4">{t.historyTitle}</h2>
                  {history ? (
                    <AttendanceHistory history={history} locale={loc} />
                  ) : (
                    <LoadError message={t.historyError} retryLabel={t.retry} retryingLabel={t.retrying} />
                  )}
                </div>
              </>
            ) : (
              /* Login prompt for unauthenticated users — premium card */
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-6 text-center">
                {/* Calendar-style check-in icon */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="h-7 bg-emerald-600 flex items-center justify-center gap-1">
                      <span className="text-white text-[10px] font-black tracking-widest uppercase">
                        {isKo ? "출석" : "CHECK"}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-black text-emerald-600">✓</span>
                    </div>
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 text-lg leading-none">🔥</span>
                </div>

                {/* Copy */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {isKo ? "출석 체크로 포인트 적립" : "Earn Points with Daily Check-ins"}
                  </h2>
                  <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                    {isKo
                      ? "매일 로그인하고 출석 체크로 포인트를 쌓아 브론즈부터 레전드까지 등급을 올리세요."
                      : "Sign in daily, check in, and climb from Bronze to Legend by stacking points and streaks."}
                  </p>
                </div>

                {/* Reward preview pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { icon: "🥉", label: isKo ? "브론즈" : "Bronze" },
                    { icon: "🥈", label: isKo ? "실버" : "Silver" },
                    { icon: "🥇", label: isKo ? "골드" : "Gold" },
                    { icon: "👑", label: isKo ? "레전드" : "Legend" },
                  ].map((tier) => (
                    <span
                      key={tier.label}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-full px-3 py-1"
                    >
                      {tier.icon} {tier.label}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={`/${loc}/auth/login`}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors shadow-sm"
                >
                  {isKo ? "로그인하고 출석 체크" : "Sign In to Check In"}
                </a>
                <p className="text-xs text-gray-400">
                  {isKo ? "계정이 없으신가요?" : "No account yet?"}{" "}
                  <a href={`/${loc}/auth/signup`} className="text-emerald-600 font-semibold hover:underline">
                    {isKo ? "무료로 가입하기" : "Create one free"}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Points system + Ad */}
          <div className="flex flex-col gap-6">
            {/* Points system card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-base">💡</span>
                <h3 className="text-sm font-bold text-gray-800">{t.pointsSystemTitle}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: t.basePoints, color: "text-emerald-600", icon: "✓" },
                  { label: t.streak3, color: "text-blue-600", icon: "🔥" },
                  { label: t.streak7, color: "text-amber-600", icon: "🔥" },
                  { label: t.streak14, color: "text-orange-600", icon: "🔥" },
                  { label: t.streak30, color: "text-emerald-600", icon: "👑" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm w-5 text-center shrink-0">{item.icon}</span>
                    <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">{t.pointsNote}</p>
            </div>

            {/* Sidebar ad */}
            <AdSidebar slot="attendance-sidebar" />
          </div>
        </div>

        {/* ── Rank tiers (current balance) ─────────────────────────────── */}
        <section className="mb-12 max-w-3xl">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-900 mb-1">{t.ranksTitle}</h2>
            <p className="text-sm text-gray-500">{t.ranksSubtitle}</p>
          </div>
          <RankTierList locale={loc} currentPoints={currentPoints} />
        </section>

        {/* ── Points ranking (top 10 by current balance) ──────────────── */}
        {/* Auth gating, live fetch, loading/empty/error states are all handled
            inside PointRankingWidget (client component with onAuthStateChange). */}
        <section className="mb-12 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-gray-900 mb-1">{t.leaderboardTitle}</h2>
            <p className="text-sm text-gray-500">{t.leaderboardSubtitle}</p>
          </div>
          <PointRankingWidget locale={loc} />
        </section>

        {/* ── Bottom ad ───────────────────────────────────────────────── */}
        <AdBanner slot="attendance-bottom" />
      </div>
    </main>
  );
}
