import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import AttendanceHistory from "@/components/attendance/AttendanceHistory";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { hasCheckedInToday, getAttendanceHistory } from "@/lib/attendance";
import { getRank, getProgressToNextRank } from "@/lib/ranks";
import PointRankingWidget, { type RankingEntry } from "@/components/ranking/PointRankingWidget";

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

// ─── Mock 30-day attendance history ──────────────────────────────────────────

function generateMockHistory() {
  const history: {
    date: string;
    checkedIn: boolean;
    streakDay: number;
    pointsEarned: number;
  }[] = [];
  const today = new Date();
  const missedOffsets = new Set([4, 9, 15, 22, 26]);
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const checkedIn = !missedOffsets.has(i);
    history.push({
      date: dateStr,
      checkedIn,
      streakDay: checkedIn ? Math.max(1, 3 - Math.floor(i / 10)) : 0,
      pointsEarned: checkedIn ? (i < 3 ? 15 : i < 7 ? 12 : 10) : 0,
    });
  }
  history[27].checkedIn = true;
  history[27].pointsEarned = 10;
  history[28].checkedIn = true;
  history[28].pointsEarned = 12;
  history[29].checkedIn = true;
  history[29].pointsEarned = 15;
  return history;
}

const MOCK_HISTORY = generateMockHistory();

// ─── Rank tier data ───────────────────────────────────────────────────────────

const RANK_TIERS = [
  {
    tier: "bronze",
    badge: "🥉",
    colorEn: "Bronze",
    colorKo: "브론즈",
    color: "#cd7f32",
    requireEn: "0 – 99 pts",
    requireKo: "0 – 99 포인트",
    perksEn: ["Access to daily check-in", "Basic leaderboard visibility"],
    perksKo: ["일일 출석 체크 기능", "기본 리더보드 표시"],
  },
  {
    tier: "silver",
    badge: "🥈",
    colorEn: "Silver",
    colorKo: "실버",
    color: "#64748b", // slate-500, matches lib/ranks.ts — visible on white backgrounds
    requireEn: "100 – 499 pts",
    requireKo: "100 – 499 포인트",
    perksEn: ["Double points on weekends", "Silver badge on profile"],
    perksKo: ["주말 포인트 2배", "프로필에 실버 뱃지 표시"],
  },
  {
    tier: "gold",
    badge: "🥇",
    colorEn: "Gold",
    colorKo: "골드",
    color: "#eab308",
    requireEn: "500 – 1,999 pts",
    requireKo: "500 – 1,999 포인트",
    perksEn: [
      "Triple points on streak milestone",
      "Gold badge on profile",
      "Early access to AI analysis",
    ],
    perksKo: [
      "연속 출석 마일스톤 3배 포인트",
      "프로필에 골드 뱃지 표시",
      "AI 분석 조기 접근",
    ],
  },
  {
    tier: "platinum",
    badge: "💎",
    colorEn: "Platinum",
    colorKo: "플래티넘",
    color: "#0ea5e9",
    requireEn: "2,000 – 4,999 pts",
    requireKo: "2,000 – 4,999 포인트",
    perksEn: [
      "5× points on 30-day streaks",
      "Platinum badge & animated border",
      "Community post pinning",
    ],
    perksKo: [
      "30일 연속 출석 시 5배 포인트",
      "플래티넘 뱃지 & 애니메이션 테두리",
      "커뮤니티 게시글 고정 기능",
    ],
  },
  {
    tier: "legend",
    badge: "👑",
    colorEn: "Legend",
    colorKo: "레전드",
    color: "#34d399",
    requireEn: "5,000+ pts",
    requireKo: "5,000 포인트 이상",
    perksEn: [
      "10× points on 90-day streaks",
      "Legend crown badge & exclusive glow",
      "Early beta feature access",
      "Featured on site leaderboard",
    ],
    perksKo: [
      "90일 연속 출석 시 10배 포인트",
      "레전드 왕관 뱃지 & 특별 글로우 효과",
      "신기능 베타 조기 접근",
      "사이트 전체 리더보드 노출",
    ],
  },
];

// ─── Fallback leaderboard ─────────────────────────────────────────────────────
// Shown by PointRankingWidget while Supabase is not yet configured, or when the
// live query returns 0 rows due to the leaderboard view's SECURITY INVOKER mode.
// See supabase/schema.sql → get_leaderboard() for the permanent DB-side fix.

const FALLBACK_LEADERBOARD: RankingEntry[] = [
  { rank: 1,  nickname: "footballking_kr",   badge: "👑", tier: "Legend",   totalPoints: 8240, currentStreak: 127 },
  { rank: 2,  nickname: "premierleaguefan",  badge: "👑", tier: "Legend",   totalPoints: 7310, currentStreak: 98  },
  { rank: 3,  nickname: "bundesligaboss",    badge: "👑", tier: "Legend",   totalPoints: 6890, currentStreak: 82  },
  { rank: 4,  nickname: "seriea_fanatic",    badge: "💎", tier: "Platinum", totalPoints: 4670, currentStreak: 56  },
  { rank: 5,  nickname: "laliganerd",        badge: "💎", tier: "Platinum", totalPoints: 3820, currentStreak: 44  },
  { rank: 6,  nickname: "championsleague_x", badge: "💎", tier: "Platinum", totalPoints: 2540, currentStreak: 31  },
  { rank: 7,  nickname: "kickvista_gold7",   badge: "🥇", tier: "Gold",     totalPoints: 1820, currentStreak: 22  },
  { rank: 8,  nickname: "goalgetter_88",     badge: "🥇", tier: "Gold",     totalPoints: 1540, currentStreak: 18  },
  { rank: 9,  nickname: "silverstreak_kr",   badge: "🥈", tier: "Silver",   totalPoints: 380,  currentStreak: 12  },
  { rank: 10, nickname: "kickvista_user10",  badge: "🥈", tier: "Silver",   totalPoints: 290,  currentStreak: 7   },
];

const labels = {
  en: {
    pageTitle: "Daily Attendance",
    pageSubtitle: "Check in every day to earn points and climb the ranks",
    systemBadge: "Attendance Rewards System",
    checkInTitle: "Today's Check-In",
    historyTitle: "Your 30-Day History",
    pointsSystemTitle: "Points System",
    basePoints: "Base: 10 pts / day",
    streak3: "3-day streak: +5 pts",
    streak7: "7-day streak: +15 pts",
    streak14: "14-day streak: +30 pts",
    streak30: "30-day streak: +100 pts",
    ranksTitle: "Rank Tiers",
    ranksSubtitle: "Earn points to unlock higher ranks and exclusive perks",
    currentBadge: "Current",
    leaderboardTitle: "Points Leaderboard",
    leaderboardSubtitle: "Top 10 most dedicated fans this month",
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
    pointsSystemTitle: "포인트 시스템",
    basePoints: "기본: 하루 10 포인트",
    streak3: "3일 연속: +5 포인트",
    streak7: "7일 연속: +15 포인트",
    streak14: "14일 연속: +30 포인트",
    streak30: "30일 연속: +100 포인트",
    ranksTitle: "등급 시스템",
    ranksSubtitle: "포인트를 모아 더 높은 등급과 특별 혜택을 잠금 해제하세요",
    currentBadge: "현재 등급",
    leaderboardTitle: "포인트 랭킹",
    leaderboardSubtitle: "이번 달 가장 열정적인 팬 TOP 10",
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

  // Try to load real user data; fall back to defaults when not authenticated
  const supabaseUser = await getServerUser();
  let realHistory = MOCK_HISTORY;

  // Default to Bronze (0 pts) — the correct starting rank for any new / unauthenticated user.
  // This is what renders inside <AttendanceWidget> only when supabaseUser is truthy;
  // the widget is hidden for guests (login prompt shown instead).
  const BRONZE = getRank(0);
  let widgetProps = {
    totalDays: 0,
    currentStreak: 0,
    totalPoints: 0,
    rankTier: BRONZE.tier as import("@/lib/ranks").RankTier,
    rankLabel: BRONZE.label[loc],
    rankColor: BRONZE.color,
    rankBadge: BRONZE.badge,
    hasCheckedInToday: false,
    progressToNextRank: 0,
    locale: loc,
  };

  if (supabaseUser) {
    const [profileR, checkedInR, historyR] = await Promise.allSettled([
      getServerProfile(supabaseUser.id),
      hasCheckedInToday(supabaseUser.id),
      getAttendanceHistory(supabaseUser.id),
    ]);
    const profile  = profileR.status  === "fulfilled" ? profileR.value  : null;
    const checkedIn = checkedInR.status === "fulfilled" ? checkedInR.value : false;
    const history  = historyR.status  === "fulfilled" ? historyR.value  : [];

    if (profile) {
      const rank = getRank(profile.total_points);
      widgetProps = {
        totalDays: history.filter((h) => h.checkedIn).length,
        currentStreak: profile.current_streak,
        totalPoints: profile.total_points,
        rankTier: rank.tier,
        rankLabel: rank.label[loc],
        rankColor: rank.color,
        rankBadge: rank.badge,
        hasCheckedInToday: checkedIn,
        progressToNextRank: getProgressToNextRank(profile.total_points),
        locale: loc,
      };
      realHistory = history;
    }
  }

  // Rank to highlight in the tier cards section.
  // null for unauthenticated users — no tier should show "Current".
  const currentRankTier: string | null = supabaseUser ? widgetProps.rankTier : null;

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
                  <AttendanceWidget {...widgetProps} />
                </div>

                {/* Attendance history */}
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-4">{t.historyTitle}</h2>
                  <AttendanceHistory history={realHistory} locale={loc} />
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
            </div>

            {/* Sidebar ad */}
            <AdSidebar slot="attendance-sidebar" />
          </div>
        </div>

        {/* ── Rank tiers section ───────────────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 mb-1">{t.ranksTitle}</h2>
            <p className="text-sm text-gray-500">{t.ranksSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RANK_TIERS.map((rank) => {
              const isCurrentRank = rank.tier === currentRankTier;
              return (
                <div
                  key={rank.tier}
                  className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col items-center gap-3 relative overflow-hidden ${
                    isCurrentRank ? "border-gray-300 ring-2 ring-emerald-500 ring-offset-1" : "border-gray-200"
                  }`}
                >
                  {/* Current rank ribbon */}
                  {isCurrentRank && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-lg tracking-wide">
                      {t.currentBadge}
                    </div>
                  )}

                  {/* Badge circle */}
                  <div className="w-12 h-12 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center text-2xl">
                    {rank.badge}
                  </div>

                  {/* Tier name */}
                  <div className="text-center">
                    <div className="text-sm font-extrabold text-gray-800 mb-1">
                      {isKo ? rank.colorKo : rank.colorEn}
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-0.5 inline-block">
                      {isKo ? rank.requireKo : rank.requireEn}
                    </div>
                  </div>

                  {/* Perks */}
                  <ul className="w-full space-y-1">
                    {(isKo ? rank.perksKo : rank.perksEn).map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5 text-xs text-gray-500 leading-snug">
                        <span className="text-emerald-500 text-[9px] mt-0.5 shrink-0">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Leaderboard preview (top 10) ────────────────────────────── */}
        {/* Auth gating, live fetch, loading/empty/error states are all handled
            inside PointRankingWidget (client component with onAuthStateChange). */}
        <section className="mb-12">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-gray-900 mb-1">{t.leaderboardTitle}</h2>
            <p className="text-sm text-gray-500">{t.leaderboardSubtitle}</p>
          </div>
          <PointRankingWidget locale={loc} fallbackEntries={FALLBACK_LEADERBOARD} />
        </section>

        {/* ── Bottom ad ───────────────────────────────────────────────── */}
        <AdBanner slot="attendance-bottom" />
      </div>
    </main>
  );
}
