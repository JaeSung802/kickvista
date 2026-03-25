import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSlot from "@/components/ads/AdSlot";
import { getServerUser } from "@/lib/auth";

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
    title: loc === "ko" ? "내 프로필" : "My Profile",
    description:
      loc === "ko"
        ? "킥비스타 프로필에서 출석 기록, 활동 내역, 포인트를 확인하세요."
        : "View your KickVista profile, attendance history, activity and points.",
    path: "/profile",
    noIndex: true,
  });
}

// ─── Mock user data ───────────────────────────────────────────────────────────

const MOCK_USER = {
  nickname: "saka_fan_2026",
  email: "user@kickvista.io",
  avatar: "🔴",
  joinDate: "2025-08-15",
  favoriteLeague: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  favoriteLeagueKo: "프리미어리그 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  favoriteTeam: "Arsenal",
  favoriteTeamKo: "아스날",
  level: 14,
  xpCurrent: 3450,
  xpMax: 5000,
  rankTier: "silver" as const,
  rankLabel: "Silver",
  rankLabelKo: "실버",
  rankColor: "#c0c0c0",
  rankBadge: "🥈",
  totalPoints: 350,
  totalAttendance: 45,
  currentStreak: 3,
  longestStreak: 18,
};

const MOCK_RECENT_POSTS = [
  {
    id: "1",
    titleEn: "Salah's movement in the second half was on another level",
    titleKo: "살라의 후반전 움직임은 진짜 레전드급이었다",
    category: "match-discussion",
    categoryColor: "#059669",
    comments: 12,
    timeAgo: "2h ago",
    timeAgoKo: "2시간 전",
  },
  {
    id: "2",
    titleEn: "Why Arteta's pressing system is so effective",
    titleKo: "아르테타의 프레싱 시스템이 효과적인 이유",
    category: "tactics",
    categoryColor: "#8b5cf6",
    comments: 7,
    timeAgo: "1d ago",
    timeAgoKo: "1일 전",
  },
  {
    id: "3",
    titleEn: "Champions League prediction — Man City vs Bayern",
    titleKo: "챔피언스리그 예측 — 맨시티 vs 바이에른",
    category: "analysis",
    categoryColor: "#06b6d4",
    comments: 19,
    timeAgo: "2d ago",
    timeAgoKo: "2일 전",
  },
];

const MOCK_RECENT_COMMENTS = [
  {
    id: "c1",
    postTitleEn: "BREAKING: Mbappé linked with shock Premier League move",
    postTitleKo: "속보: 음바페, 프리미어리그 이적설 급부상",
    commentEn: "This would be absolutely insane. Imagine Mbappé and Haaland in the same league.",
    commentKo: "이거 진짜 미칠 것 같다. 음바페랑 홀란드가 같은 리그에 있는 상상을 해봐.",
    timeAgo: "5h ago",
    timeAgoKo: "5시간 전",
  },
  {
    id: "c2",
    postTitleEn: "Rate the Arsenal squad depth",
    postTitleKo: "아스날 선수단 깊이 평가",
    commentEn: "Trossard is criminally underrated. He's world-class on his day.",
    commentKo: "트로사르는 진짜 저평가됐다. 컨디션 좋을 때는 월드클래스급이야.",
    timeAgo: "1d ago",
    timeAgoKo: "1일 전",
  },
];

const MONTHLY_ATTENDANCE = Array.from({ length: 14 }, (_, i) => {
  const date = new Date("2026-03-01");
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split("T")[0],
    checked: i < 3 ? true : [0, 1, 3, 5, 7, 10].includes(i),
  };
});

const labels = {
  en: {
    myProfile: "My Profile",
    settings: "Settings",
    editProfile: "Edit Profile",
    level: "Level",
    rank: "Rank",
    points: "Points",
    totalAttendance: "Total Days",
    streak: "Current Streak",
    longestStreak: "Longest Streak",
    days: "days",
    joinedOn: "Joined",
    favoriteLeague: "Favourite League",
    favoriteTeam: "Favourite Team",
    xp: "XP",
    xpToNext: "XP to next level",
    attendanceTitle: "This Month's Attendance",
    postsTitle: "Recent Posts",
    commentsTitle: "Recent Comments",
    noActivity: "No activity yet.",
    viewAllPosts: "View all posts →",
    viewAllComments: "View all comments →",
    checked: "Checked",
    missed: "Missed",
  },
  ko: {
    myProfile: "내 프로필",
    settings: "설정",
    editProfile: "프로필 수정",
    level: "레벨",
    rank: "등급",
    points: "포인트",
    totalAttendance: "총 출석일",
    streak: "연속 출석",
    longestStreak: "최장 연속",
    days: "일",
    joinedOn: "가입일",
    favoriteLeague: "좋아하는 리그",
    favoriteTeam: "좋아하는 팀",
    xp: "경험치",
    xpToNext: "다음 레벨까지",
    attendanceTitle: "이번 달 출석",
    postsTitle: "최근 게시글",
    commentsTitle: "최근 댓글",
    noActivity: "아직 활동 내역이 없습니다.",
    viewAllPosts: "모든 게시글 보기 →",
    viewAllComments: "모든 댓글 보기 →",
    checked: "출석",
    missed: "미출석",
  },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = labels[loc];
  const isKo = loc === "ko";

  const supabaseUser = await getServerUser();

  if (!supabaseUser) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-emerald-50 border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-6 text-center">
          <span className="text-5xl leading-none">🏆</span>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">
              {isKo ? "내 프로필" : "My Profile"}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isKo
                ? "로그인 후 포인트, 등급, 출석 기록을 확인할 수 있습니다."
                : "Sign in to view your points, rank, and attendance history."}
            </p>
          </div>
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
          <a
            href={`/${loc}/auth/login`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors shadow-sm"
          >
            {isKo ? "로그인하기" : "Sign In"}
          </a>
          <p className="text-xs text-gray-400">
            {isKo ? "계정이 없으신가요?" : "No account yet?"}{" "}
            <a href={`/${loc}/auth/signup`} className="text-emerald-600 font-semibold hover:underline">
              {isKo ? "무료로 가입하기" : "Create one free"}
            </a>
          </p>
        </div>
      </main>
    );
  }

  const user = MOCK_USER;
  const xpPercent = Math.round((user.xpCurrent / user.xpMax) * 100);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Profile hero ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* User info */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl shrink-0"
                style={{ border: `3px solid ${user.rankColor}` }}
              >
                {user.avatar}
              </div>

              {/* Details */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h1 className="text-2xl font-black text-gray-900">{user.nickname}</h1>
                  {/* Rank badge */}
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5 border"
                    style={{
                      color: user.rankColor,
                      backgroundColor: `${user.rankColor}18`,
                      borderColor: `${user.rankColor}50`,
                    }}
                  >
                    {user.rankBadge} {isKo ? user.rankLabelKo : user.rankLabel}
                  </span>
                  {/* Level badge */}
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    {t.level} {user.level}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                  <span>📅 {t.joinedOn}: {user.joinDate}</span>
                  <span>{isKo ? user.favoriteLeagueKo : user.favoriteLeague}</span>
                </div>

                {/* XP progress */}
                <div className="max-w-xs">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>{t.xp}: {user.xpCurrent.toLocaleString()} / {user.xpMax.toLocaleString()}</span>
                    <span>{xpPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`/${loc}/profile/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline"
              >
                ✏️ {t.editProfile}
              </a>
              <a
                href={`/${loc}/profile/settings`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline"
              >
                ⚙️ {t.settings}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center divide-x divide-gray-100 overflow-x-auto">
            {[
              { label: t.points,          value: user.totalPoints.toLocaleString(), className: "text-emerald-600" },
              { label: t.totalAttendance, value: `${user.totalAttendance} ${t.days}`, className: "text-gray-900" },
              { label: t.streak,          value: `🔥 ${user.currentStreak} ${t.days}`, className: "text-amber-500" },
              { label: t.longestStreak,   value: `${user.longestStreak} ${t.days}`,   className: "text-gray-900" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5 px-8 py-4">
                <span className={`text-xl font-extrabold tabular-nums ${stat.className}`}>{stat.value}</span>
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* This month's attendance */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">{t.attendanceTitle}</h2>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-400">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {MONTHLY_ATTENDANCE.map((day) => (
                    <div
                      key={day.date}
                      title={day.date}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${
                        day.checked
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {new Date(day.date).getDate()}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span className="text-xs text-gray-400">{t.checked}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200" />
                    <span className="text-xs text-gray-400">{t.missed}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Posts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-gray-900">{t.postsTitle}</h2>
                <a href={`/${loc}/community`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 no-underline">
                  {t.viewAllPosts}
                </a>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {MOCK_RECENT_POSTS.map((post, idx) => (
                  <a
                    key={post.id}
                    href={`/${loc}/community/${post.id}`}
                    className={`flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors no-underline ${
                      idx < MOCK_RECENT_POSTS.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold rounded px-1.5 py-0.5"
                          style={{
                            color: post.categoryColor,
                            backgroundColor: `${post.categoryColor}18`,
                            border: `1px solid ${post.categoryColor}40`,
                          }}
                        >
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isKo ? post.timeAgoKo : post.timeAgo}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate block">
                        {isKo ? post.titleKo : post.titleEn}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">💬 {post.comments}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Recent Comments */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-gray-900">{t.commentsTitle}</h2>
                <a href={`/${loc}/community`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 no-underline">
                  {t.viewAllComments}
                </a>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {MOCK_RECENT_COMMENTS.map((comment, idx) => (
                  <div
                    key={comment.id}
                    className={`px-4 py-3.5 ${idx < MOCK_RECENT_COMMENTS.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <p className="text-xs text-gray-400 truncate mb-1">
                      💬 {isKo ? comment.postTitleKo : comment.postTitleEn}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-1">
                      &ldquo;{isKo ? comment.commentKo : comment.commentEn}&rdquo;
                    </p>
                    <span className="text-xs text-gray-400">
                      {isKo ? comment.timeAgoKo : comment.timeAgo}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">
            {/* Profile details card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-900">
                  {isKo ? "프로필 정보" : "Profile Details"}
                </h3>
              </div>
              <div className="px-4 py-1">
                {[
                  { label: t.favoriteLeague, value: isKo ? user.favoriteLeagueKo : user.favoriteLeague },
                  { label: t.favoriteTeam,   value: isKo ? user.favoriteTeamKo   : user.favoriteTeam   },
                  { label: t.rank,           value: `${user.rankBadge} ${isKo ? user.rankLabelKo : user.rankLabel}` },
                  { label: t.level,          value: `⚡ ${user.level}` },
                  { label: t.joinedOn,       value: user.joinDate },
                ].map(({ label, value }, idx, arr) => (
                  <div
                    key={label}
                    className={`flex flex-col gap-0.5 py-2.5 ${idx < arr.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {[
                { label: isKo ? "출석 체크 페이지" : "Attendance Page", href: `/${loc}/attendance`, icon: "📅" },
                { label: isKo ? "AI 분석 보기"    : "View AI Analysis",  href: `/${loc}/analysis`,   icon: "✨" },
                { label: isKo ? "커뮤니티"         : "Community",         href: `/${loc}/community`,  icon: "💬" },
                { label: isKo ? "계정 설정"         : "Account Settings",  href: `/${loc}/profile/settings`, icon: "⚙️" },
              ].map(({ label, href, icon }, idx, arr) => (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors no-underline ${
                    idx < arr.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-sm font-semibold text-gray-800 flex-1">{label}</span>
                  <span className="text-gray-400 text-sm">→</span>
                </a>
              ))}
            </div>

            {/* Ad */}
            <AdSlot slotId="profile-sidebar" size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
