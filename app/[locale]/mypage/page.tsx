import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSidebar from "@/components/ads/AdSidebar";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import type { Metadata } from "next";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { hasCheckedInToday } from "@/lib/attendance";
import { getRank, getProgressToNextRank } from "@/lib/ranks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;

  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? "마이페이지" : "My Page",
    description:
      loc === "ko"
        ? "나의 프로필, 출석 체크, 포인트, 활동 내역을 확인하세요."
        : "View your profile, attendance, points, and activity history.",
    path: "/mypage",
    noIndex: true,
  });
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function updateNickname(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const nickname = (formData.get("nickname") as string ?? "").trim();
  if (!nickname) return;

  await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id);

  redirect("?tab=settings&saved=1");
}

// ─── Real data helpers ────────────────────────────────────────────────────────

async function fetchMyPosts(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_posts")
    .select("id, title, view_count, like_count, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    views: (r.view_count as number) ?? 0,
    likes: (r.like_count as number) ?? 0,
    date: (r.created_at as string).split("T")[0],
  }));
}

async function fetchMyComments(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_comments")
    .select("id, content, post_id, created_at, post:community_posts!post_id(id, title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []).map((r) => {
    const post = Array.isArray(r.post) ? r.post[0] : r.post;
    return {
      id: r.id as string,
      postId: (post?.id ?? r.post_id) as string,
      postTitle: (post?.title ?? "") as string,
      excerpt: (r.content as string).slice(0, 80),
      date: (r.created_at as string).split("T")[0],
    };
  });
}

async function fetchPointsHistory(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_logs")
    .select("attendance_date, points_earned")
    .eq("user_id", userId)
    .order("attendance_date", { ascending: false })
    .limit(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []).map((r) => ({
    date: r.attendance_date as string,
    points: (r.points_earned as number) ?? 10,
  }));
}

async function fetchThisMonthPoints(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data } = await supabase
    .from("attendance_logs")
    .select("points_earned")
    .eq("user_id", userId)
    .gte("attendance_date", monthStart);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []).reduce((sum: number, r: any) => sum + (r.points_earned ?? 10), 0);
}

async function fetchCounts(userId: string) {
  const supabase = await createClient();
  const [{ count: postCount }, { count: commentCount }] = await Promise.all([
    supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("community_comments").select("id", { count: "exact", head: true }).eq("author_id", userId),
  ]);
  return { postCount: postCount ?? 0, commentCount: commentCount ?? 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-24 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
      <span className={`text-xl font-extrabold leading-none tabular-nums ${accent ? "text-emerald-600" : "text-gray-900"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; saved?: string }>;
}) {
  const { locale } = await params;
  const { tab: tabParam, saved } = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";
  const activeTab = tabParam ?? "overview";

  // Auth gate — must be authenticated to view MyPage
  const supabaseUser = await getServerUser();

  if (!supabaseUser) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
            👤
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">
              {isKo ? "마이페이지" : "My Page"}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isKo
                ? "로그인 후 출석 포인트, 랭킹, 작성한 게시글을 확인할 수 있습니다."
                : "Sign in to view your attendance points, rank, and community activity."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: "🏆", label: isKo ? "포인트 & 랭킹" : "Points & Rank" },
              { icon: "📅", label: isKo ? "출석 기록" : "Attendance Log" },
              { icon: "✍️", label: isKo ? "내 게시글" : "My Posts" },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1"
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>
          <a
            href={`/${loc}/auth/login`}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            {isKo ? "로그인하기" : "Sign In"}
          </a>
          <p className="text-xs text-gray-400">
            {isKo ? "계정이 없으신가요?" : "No account yet?"}{" "}
            <a href={`/${loc}/auth/signup`} className="text-emerald-600 font-semibold hover:underline">
              {isKo ? "무료로 가입" : "Create one free"}
            </a>
          </p>
        </div>
      </main>
    );
  }

  // Authenticated — fetch all real data in parallel
  const [profileR, checkedInR, myPostsR, myCommentsR, pointsHistoryR, thisMonthPointsR, countsR] = await Promise.allSettled([
    getServerProfile(supabaseUser.id),
    hasCheckedInToday(supabaseUser.id),
    fetchMyPosts(supabaseUser.id),
    fetchMyComments(supabaseUser.id),
    fetchPointsHistory(supabaseUser.id),
    fetchThisMonthPoints(supabaseUser.id),
    fetchCounts(supabaseUser.id),
  ]);
  const profile         = profileR.status         === "fulfilled" ? profileR.value         : null;
  const checkedIn       = checkedInR.status       === "fulfilled" ? checkedInR.value       : false;
  const myPosts         = myPostsR.status         === "fulfilled" ? myPostsR.value         : [];
  const myComments      = myCommentsR.status      === "fulfilled" ? myCommentsR.value      : [];
  const pointsHistory   = pointsHistoryR.status   === "fulfilled" ? pointsHistoryR.value   : [];
  const thisMonthPoints = thisMonthPointsR.status === "fulfilled" ? thisMonthPointsR.value : 0;
  const counts          = countsR.status          === "fulfilled" ? countsR.value          : { postCount: 0, commentCount: 0 };

  const rank = profile ? getRank(profile.total_points) : null;

  const u = {
    nickname: profile?.nickname ?? supabaseUser.email?.split("@")[0] ?? "fan",
    rankBadge: rank?.badge ?? "🥉",
    rankTier: rank?.tier ?? "bronze",
    rankColor: rank?.color ?? "#cd7f32",
    rankLabel: rank ? rank.label[loc] : (isKo ? "브론즈" : "Bronze"),
    totalPoints: profile?.total_points ?? 0,
    postCount: counts.postCount,
    commentCount: counts.commentCount,
    streak: profile?.current_streak ?? 0,
    joinDate: profile?.created_at.split("T")[0] ?? "",
    email: supabaseUser.email ?? "",
    provider: (supabaseUser.app_metadata?.provider as string) ?? "email",
  };

  const attendanceWidgetProps = {
    totalDays: 0,
    currentStreak: profile?.current_streak ?? 0,
    totalPoints: profile?.total_points ?? 0,
    rankTier: (rank?.tier ?? "bronze") as import("@/lib/ranks").RankTier,
    rankLabel: rank ? rank.label[loc] : isKo ? "브론즈" : "Bronze",
    rankColor: rank?.color ?? "#cd7f32",
    rankBadge: rank?.badge ?? "🥉",
    hasCheckedInToday: checkedIn,
    progressToNextRank: profile ? getProgressToNextRank(profile.total_points) : 0,
    locale: loc,
  };

  const t = {
    en: {
      editProfile: "Edit Profile",
      posts: "Posts",
      comments: "Comments",
      liked: "Liked",
      streak: "Streak",
      overview: "Overview",
      activity: "Activity",
      stats: "Stats",
      settings: "Settings",
      attendance: "Attendance",
      pointsSummary: "Points Summary",
      totalPoints: "Total Points",
      thisMonth: "This Month",
      rank: "Rank",
      pointsHistory: "Points History",
      date: "Date",
      activityLabel: "Activity",
      pointsLabel: "Points",
      recentActivity: "Recent Activity",
      myPosts: "My Posts",
      myComments: "My Comments",
      views: "views",
      favoriteLeague: "Favourite League",
      accountInfo: "Account Info",
      email: "Email",
      memberSince: "Member Since",
      provider: "Provider",
      nickname: "Nickname",
      save: "Save",
      saved: "Saved!",
      profileSettings: "Profile Settings",
    },
    ko: {
      editProfile: "프로필 편집",
      posts: "게시글",
      comments: "댓글",
      liked: "좋아요",
      streak: "연속 출석",
      overview: "개요",
      activity: "활동",
      stats: "통계",
      settings: "설정",
      attendance: "출석 체크",
      pointsSummary: "포인트 요약",
      totalPoints: "총 포인트",
      thisMonth: "이번 달",
      rank: "등급",
      pointsHistory: "포인트 내역",
      date: "날짜",
      activityLabel: "활동",
      pointsLabel: "포인트",
      recentActivity: "최근 활동",
      myPosts: "내 게시글",
      myComments: "내 댓글",
      views: "조회",
      favoriteLeague: "관심 리그",
      accountInfo: "계정 정보",
      email: "이메일",
      memberSince: "가입일",
      provider: "로그인 방식",
      nickname: "닉네임",
      save: "저장",
      saved: "저장됨!",
      profileSettings: "프로필 설정",
    },
  };

  const tx = t[loc];

  const tabs = [
    { key: "overview",  label: tx.overview },
    { key: "activity",  label: tx.activity },
    { key: "stats",     label: tx.stats },
    { key: "settings",  label: tx.settings },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* 1. Profile header card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Rank color stripe */}
          <div style={{ height: 4, backgroundColor: u.rankColor }} />

          <div className="p-7">
            <div className="flex flex-wrap items-start gap-6 mb-6">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl shrink-0"
                style={{ border: `3px solid ${u.rankColor}` }}
              >
                {u.rankBadge}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <h1 className="text-xl font-extrabold text-gray-900">{u.nickname}</h1>
                  <span
                    className="text-xs font-bold rounded-full px-2.5 py-0.5 border"
                    style={{ color: u.rankColor, backgroundColor: `${u.rankColor}18`, borderColor: `${u.rankColor}40` }}
                  >
                    {u.rankBadge} {u.rankLabel}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                    {u.totalPoints.toLocaleString()} pt
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-4">{u.rankLabel}</div>
                <div className="flex gap-5 flex-wrap">
                  {[
                    { value: u.totalPoints.toLocaleString(), label: tx.totalPoints, accent: true },
                    { value: u.postCount, label: tx.posts, accent: false },
                    { value: u.commentCount, label: tx.comments, accent: false },
                    { value: `🔥 ${u.streak}`, label: tx.streak, accent: false },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col gap-0.5">
                      <span className={`text-lg font-extrabold ${s.accent ? "text-emerald-600" : "text-gray-900"}`}>{s.value}</span>
                      <span className="text-xs text-gray-400">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit button → goes to settings tab */}
              <a
                href={`/${loc}/mypage?tab=settings`}
                className="self-start px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap no-underline"
              >
                ✏️ {tx.editProfile}
              </a>
            </div>
          </div>

          {/* 2. Tabs row */}
          <nav className="flex border-t border-gray-100 pl-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tabs.map((tab) => (
              <a
                key={tab.key}
                href={`/${loc}/mypage?tab=${tab.key}`}
                className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "text-gray-900 border-emerald-600"
                    : "text-gray-500 border-transparent hover:text-gray-800"
                }`}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / main column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
              <>
                {/* 3. Attendance widget */}
                <section>
                  <h2 className="text-sm font-bold text-gray-900 mb-3">{tx.attendance}</h2>
                  <AttendanceWidget {...attendanceWidgetProps} />
                </section>

                {/* 4. Points summary */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.pointsSummary}</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2.5 mb-5">
                      <StatCard label={tx.totalPoints} value={u.totalPoints} accent />
                      <StatCard label={tx.thisMonth} value={thisMonthPoints} />
                      <StatCard label={tx.rank} value={u.rankLabel} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                        {tx.pointsHistory}
                      </h3>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                        <div className="grid gap-0 border-b border-gray-200" style={{ gridTemplateColumns: "110px 1fr 60px", padding: "8px 14px" }}>
                          <span className="text-xs font-semibold text-gray-400">{tx.date}</span>
                          <span className="text-xs font-semibold text-gray-400">{tx.activityLabel}</span>
                          <span className="text-xs font-semibold text-gray-400 text-right">{tx.pointsLabel}</span>
                        </div>
                        {pointsHistory.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400">
                            {isKo ? "출석 기록이 없습니다." : "No attendance records yet."}
                          </div>
                        ) : pointsHistory.map((h, idx) => (
                          <div
                            key={idx}
                            className={`grid items-center${idx < pointsHistory.length - 1 ? " border-b border-gray-100" : ""}`}
                            style={{ gridTemplateColumns: "110px 1fr 60px", padding: "9px 14px" }}
                          >
                            <span className="text-xs text-gray-500">{h.date}</span>
                            <span className="text-xs text-gray-800">
                              {isKo ? "일일 출석" : "Daily Check-in"}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 text-right">+{h.points}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Recent activity preview */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900">{tx.recentActivity}</h2>
                    <a href={`/${loc}/mypage?tab=activity`} className="text-xs text-emerald-600 font-semibold hover:underline no-underline">
                      {isKo ? "전체 보기" : "View all"}
                    </a>
                  </div>
                  <div className="p-5 flex flex-col gap-5">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">{tx.myPosts}</h3>
                      <div className="flex flex-col gap-1.5">
                        {myPosts.slice(0, 3).length === 0 ? (
                          <p className="text-xs text-gray-400 py-3 text-center">
                            {isKo ? "작성한 게시글이 없습니다." : "No posts yet."}
                          </p>
                        ) : myPosts.slice(0, 3).map((p) => (
                          <a
                            key={p.id}
                            href={`/${loc}/community/post/${p.id}`}
                            className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 hover:border-gray-200 hover:bg-white transition-colors gap-3 no-underline"
                          >
                            <span className="text-sm text-gray-800 truncate flex-1">{p.title}</span>
                            <div className="flex gap-2.5 shrink-0">
                              <span className="text-xs text-gray-400">👁 {p.views.toLocaleString()}</span>
                              <span className="text-xs text-gray-400">▲ {p.likes}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ── Activity tab ── */}
            {activeTab === "activity" && (
              <>
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.myPosts}</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col gap-1.5">
                      {myPosts.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">
                          {isKo ? "작성한 게시글이 없습니다." : "No posts yet."}
                        </p>
                      ) : myPosts.map((p) => (
                        <a
                          key={p.id}
                          href={`/${loc}/community/post/${p.id}`}
                          className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 hover:border-gray-200 hover:bg-white transition-colors gap-3 no-underline"
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-sm text-gray-800 truncate">{p.title}</span>
                            <span className="text-xs text-gray-400">{p.date}</span>
                          </div>
                          <div className="flex gap-2.5 shrink-0">
                            <span className="text-xs text-gray-400">👁 {p.views.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">▲ {p.likes}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.myComments}</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col gap-1.5">
                      {myComments.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">
                          {isKo ? "작성한 댓글이 없습니다." : "No comments yet."}
                        </p>
                      ) : myComments.map((c) => (
                        <a
                          key={c.id}
                          href={`/${loc}/community/post/${c.postId}`}
                          className="block bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2.5 hover:border-gray-200 hover:bg-white transition-colors no-underline"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-gray-400 truncate">↩ {c.postTitle}</div>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">{c.date}</span>
                          </div>
                          <div className="text-sm text-gray-800 truncate">&ldquo;{c.excerpt}&rdquo;</div>
                        </a>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ── Stats tab ── */}
            {activeTab === "stats" && (
              <>
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.pointsSummary}</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      <StatCard label={tx.totalPoints} value={u.totalPoints} accent />
                      <StatCard label={tx.thisMonth} value={thisMonthPoints} />
                      <StatCard label={tx.rank} value={u.rankLabel} />
                      <StatCard label={tx.streak} value={`🔥 ${u.streak}`} />
                      <StatCard label={tx.posts} value={u.postCount} />
                      <StatCard label={tx.comments} value={u.commentCount} />
                    </div>

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                      {tx.pointsHistory}
                    </h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                      <div className="grid gap-0 border-b border-gray-200" style={{ gridTemplateColumns: "110px 1fr 60px", padding: "8px 14px" }}>
                        <span className="text-xs font-semibold text-gray-400">{tx.date}</span>
                        <span className="text-xs font-semibold text-gray-400">{tx.activityLabel}</span>
                        <span className="text-xs font-semibold text-gray-400 text-right">{tx.pointsLabel}</span>
                      </div>
                      {pointsHistory.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">
                          {isKo ? "출석 기록이 없습니다." : "No attendance records yet."}
                        </div>
                      ) : pointsHistory.map((h, idx) => (
                        <div
                          key={idx}
                          className={`grid items-center${idx < pointsHistory.length - 1 ? " border-b border-gray-100" : ""}`}
                          style={{ gridTemplateColumns: "110px 1fr 60px", padding: "9px 14px" }}
                        >
                          <span className="text-xs text-gray-500">{h.date}</span>
                          <span className="text-xs text-gray-800">
                            {isKo ? "일일 출석" : "Daily Check-in"}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 text-right">+{h.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ── Settings tab ── */}
            {activeTab === "settings" && (
              <>
                {/* Profile settings */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.profileSettings}</h2>
                  </div>
                  <div className="p-5">
                    {saved && (
                      <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700">
                        ✓ {tx.saved}
                      </div>
                    )}
                    <form action={updateNickname} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500" htmlFor="nickname">
                          {tx.nickname}
                        </label>
                        <input
                          id="nickname"
                          name="nickname"
                          type="text"
                          defaultValue={u.nickname}
                          maxLength={20}
                          required
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        {tx.save}
                      </button>
                    </form>
                  </div>
                </section>

                {/* Account info */}
                <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">{tx.accountInfo}</h2>
                  </div>
                  <div className="px-5 py-1">
                    {[
                      { label: tx.email, value: u.email },
                      {
                        label: tx.memberSince,
                        value: new Date(u.joinDate).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      },
                      { label: tx.provider, value: u.provider },
                    ].map((row, idx, arr) => (
                      <div
                        key={row.label}
                        className={`flex justify-between items-center gap-2 py-2.5${idx < arr.length - 1 ? " border-b border-gray-100" : ""}`}
                      >
                        <span className="text-xs text-gray-500">{row.label}</span>
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-35">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">

            {/* Favourite league */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-900">{tx.favoriteLeague}</h3>
              </div>
              <a
                href={`/${loc}/league/premier-league`}
                className="block px-4 py-4 hover:bg-gray-50 transition-colors no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-3xl shrink-0" style={{ width: 52, height: 52 }}>
                    🏴󠁧󠁢󠁥󠁮󠁧󠁿
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">
                      {isKo ? "프리미어리그" : "Premier League"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isKo ? "잉글랜드 · 2025/26 시즌" : "England · 2025/26 Season"}
                    </div>
                  </div>
                </div>
              </a>
            </section>

            {/* Account info in sidebar for non-settings tabs */}
            {activeTab !== "settings" && (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-xs font-bold text-gray-900">{tx.accountInfo}</h3>
                </div>
                <div className="px-4 py-1">
                  {[
                    { label: tx.email, value: u.email },
                    {
                      label: tx.memberSince,
                      value: new Date(u.joinDate).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                    },
                    { label: tx.provider, value: u.provider },
                  ].map((row, idx, arr) => (
                    <div
                      key={row.label}
                      className={`flex justify-between items-center gap-2 py-2.5${idx < arr.length - 1 ? " border-b border-gray-100" : ""}`}
                    >
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-35">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ad slot */}
            <AdSidebar slot="mypage-sidebar" />
          </div>
        </div>
      </div>
    </main>
  );
}
