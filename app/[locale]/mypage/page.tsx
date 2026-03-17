import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSlot from "@/components/ads/AdSlot";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import type { Metadata } from "next";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { hasCheckedInToday } from "@/lib/attendance";
import { getRank, getProgressToNextRank } from "@/lib/ranks";

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  nickname: "tacticsboard_official",
  rankBadge: "👑",
  rankTier: "legend",
  rankColor: "#f59e0b",
  level: 42,
  totalPoints: 14820,
  postCount: 142,
  commentCount: 387,
  likedCount: 1204,
  streak: 15,
  joinDate: "2024-01-15",
  email: "user@example.com",
  provider: "Google",
};

const MOCK_POINTS_HISTORY = [
  { date: "2026-03-14", activity: { en: "Daily Check-in", ko: "일일 출석" }, points: +10 },
  { date: "2026-03-14", activity: { en: "Post Liked", ko: "게시글 추천 받음" }, points: +5 },
  { date: "2026-03-13", activity: { en: "Daily Check-in", ko: "일일 출석" }, points: +10 },
  { date: "2026-03-13", activity: { en: "Comment Written", ko: "댓글 작성" }, points: +3 },
  { date: "2026-03-12", activity: { en: "Daily Check-in", ko: "일일 출석" }, points: +10 },
  { date: "2026-03-12", activity: { en: "Post Written", ko: "게시글 작성" }, points: +15 },
  { date: "2026-03-11", activity: { en: "Daily Check-in", ko: "일일 출석" }, points: +10 },
];

const MOCK_RECENT_POSTS = [
  {
    id: "1",
    title: { en: "Arsenal vs Man City tactical breakdown", ko: "아스날 vs 맨시티 전술 분석" },
    date: "2026-03-12",
    views: 8420,
    likes: 312,
  },
  {
    id: "3",
    title: { en: "Why the 4-3-3 is dominating Europe this season", ko: "왜 이번 시즌 4-3-3이 유럽을 지배하나" },
    date: "2026-03-10",
    views: 5840,
    likes: 248,
  },
  {
    id: "7",
    title: { en: "Rating the Arsenal squad depth", ko: "아스날 선수단 깊이 평가" },
    date: "2026-03-06",
    views: 4230,
    likes: 198,
  },
];

const MOCK_RECENT_COMMENTS = [
  {
    id: "c1",
    postTitle: { en: "Champions League QF draw reaction", ko: "챔피언스리그 8강 추첨 반응" },
    postId: "4",
    excerpt: { en: "City vs Bayern is going to be absolute carnage", ko: "맨시티 vs 바이에른은 진짜 혈투가 될 것 같다" },
    date: "2026-03-09",
  },
  {
    id: "c2",
    postTitle: { en: "Is Yamal already the best winger?", ko: "야말은 이미 최고의 윙어인가?" },
    postId: "6",
    excerpt: { en: "The Euros performance at 16 settled the debate for me", ko: "16살에 유로 퍼포먼스가 내겐 이미 답을 줬다" },
    date: "2026-03-07",
  },
  {
    id: "c3",
    postTitle: { en: "VAR disallowed goal outrage", ko: "VAR 골 취소 분노" },
    postId: "5",
    excerpt: { en: "The daylight rule needs to be implemented ASAP", ko: "데이라이트 규칙 당장 적용해야 함" },
    date: "2026-03-08",
  },
];

const THIS_MONTH_POINTS = MOCK_POINTS_HISTORY
  .filter((h) => h.date.startsWith("2026-03"))
  .reduce((sum, h) => sum + h.points, 0);

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
    <div
      style={{
        backgroundColor: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: 1,
        minWidth: 100,
      }}
    >
      <span
        style={{
          color: accent ? "#22c55e" : "#e6edf3",
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span style={{ color: "#8b949e", fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  // Load real user data if Supabase is configured; fall back to mock
  const supabaseUser = await getServerUser();
  const [profile, checkedIn] = supabaseUser
    ? await Promise.all([
        getServerProfile(supabaseUser.id),
        hasCheckedInToday(supabaseUser.id),
      ])
    : [null, false];

  const rank = profile ? getRank(profile.total_points) : null;

  const u = profile
    ? {
        nickname: profile.nickname,
        rankBadge: rank!.badge,
        rankTier: rank!.tier,
        rankColor: rank!.color,
        level: 1,
        totalPoints: profile.total_points,
        postCount: 0,
        commentCount: 0,
        likedCount: 0,
        streak: profile.current_streak,
        joinDate: profile.created_at.split("T")[0],
        email: supabaseUser?.email ?? "",
        provider: supabaseUser?.app_metadata?.provider ?? "email",
      }
    : MOCK_USER;

  const attendanceWidgetProps = {
    totalDays: 0,
    currentStreak: profile?.current_streak ?? MOCK_USER.streak,
    totalPoints: profile?.total_points ?? MOCK_USER.totalPoints,
    rankTier: (rank?.tier ?? "silver") as import("@/lib/ranks").RankTier,
    rankLabel: rank ? rank.label[loc] : isKo ? "실버" : "Silver",
    rankColor: rank?.color ?? "#c0c0c0",
    rankBadge: rank?.badge ?? "🥈",
    hasCheckedInToday: checkedIn,
    progressToNextRank: profile ? getProgressToNextRank(profile.total_points) : 50,
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
      level: "Level",
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
      level: "레벨",
    },
  };

  const tx = t[loc];

  const ACTIVE_TAB_STYLE = {
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    color: "#e6edf3",
    textDecoration: "none",
    borderBottom: "2px solid #22c55e",
    whiteSpace: "nowrap" as const,
  };
  const INACTIVE_TAB_STYLE = {
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "#8b949e",
    textDecoration: "none",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap" as const,
  };

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* 1. Profile header card */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Rank color stripe */}
          <div style={{ height: 4, backgroundColor: u.rankColor }} />

          <div style={{ padding: "28px" }}>
            <div
              className="flex flex-wrap items-start gap-6"
              style={{ marginBottom: 24 }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#21262d",
                  border: `3px solid ${u.rankColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {u.rankBadge}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 6 }}>
                  <h1
                    style={{
                      color: "#e6edf3",
                      fontSize: 20,
                      fontWeight: 800,
                      margin: 0,
                    }}
                  >
                    {u.nickname}
                  </h1>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: u.rankColor,
                      backgroundColor: `${u.rankColor}20`,
                      border: `1px solid ${u.rankColor}40`,
                      borderRadius: 999,
                      padding: "2px 10px",
                    }}
                  >
                    {u.rankBadge} {rank ? rank.label[loc] : (isKo ? "레전드" : "Legend")}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#8b949e",
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      padding: "2px 10px",
                    }}
                  >
                    {tx.level} {u.level}
                  </span>
                </div>

                <div style={{ color: "#8b949e", fontSize: 13, marginBottom: 14 }}>
                  {isKo ? "실버 팬" : "Silver Fan"}
                </div>

                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#22c55e", fontSize: 18, fontWeight: 800 }}>
                      {u.totalPoints.toLocaleString()}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.totalPoints}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800 }}>
                      {u.postCount}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.posts}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800 }}>
                      {u.commentCount}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.comments}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800 }}>
                      {u.likedCount.toLocaleString()}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.liked}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800 }}>
                      🔥 {u.streak}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{tx.streak}</span>
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <div
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  color: "#8b949e",
                  border: "1px solid #30363d",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  whiteSpace: "nowrap" as const,
                }}
              >
                ✏️ {tx.editProfile}
              </div>
            </div>
          </div>

          {/* 2. Tabs row */}
          <nav
            style={{
              display: "flex",
              borderTop: "1px solid #30363d",
              paddingLeft: 16,
              overflowX: "auto",
            }}
          >
            <a href={`/${loc}/mypage`} style={ACTIVE_TAB_STYLE}>{tx.overview}</a>
            <a href={`/${loc}/mypage?tab=activity`} style={INACTIVE_TAB_STYLE}>{tx.activity}</a>
            <a href={`/${loc}/mypage?tab=stats`} style={INACTIVE_TAB_STYLE}>{tx.stats}</a>
            <a href={`/${loc}/mypage?tab=settings`} style={INACTIVE_TAB_STYLE}>{tx.settings}</a>
          </nav>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / main column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* 3. Attendance widget */}
            <section>
              <h2 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>
                {tx.attendance}
              </h2>
              <AttendanceWidget {...attendanceWidgetProps} />
            </section>

            {/* 4. Points summary */}
            <section
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #30363d",
                  backgroundColor: "#0d1117",
                }}
              >
                <h2 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {tx.pointsSummary}
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {/* 3 stat cards */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
                  <StatCard label={tx.totalPoints} value={u.totalPoints} accent />
                  <StatCard label={tx.thisMonth} value={THIS_MONTH_POINTS} />
                  <StatCard label={tx.rank} value={rank ? rank.label[loc] : (isKo ? "레전드" : "Legend")} />
                </div>

                {/* Points history table */}
                <div>
                  <h3 style={{ color: "#8b949e", fontSize: 12, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    {tx.pointsHistory}
                  </h3>
                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {/* Table header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 1fr 60px",
                        padding: "8px 14px",
                        borderBottom: "1px solid #21262d",
                      }}
                    >
                      <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600 }}>{tx.date}</span>
                      <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600 }}>{tx.activityLabel}</span>
                      <span style={{ color: "#484f58", fontSize: 11, fontWeight: 600, textAlign: "right" as const }}>{tx.pointsLabel}</span>
                    </div>
                    {MOCK_POINTS_HISTORY.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "110px 1fr 60px",
                          padding: "9px 14px",
                          borderBottom: idx < MOCK_POINTS_HISTORY.length - 1 ? "1px solid #21262d" : "none",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "#8b949e", fontSize: 12 }}>{h.date}</span>
                        <span style={{ color: "#c9d1d9", fontSize: 12 }}>
                          {isKo ? h.activity.ko : h.activity.en}
                        </span>
                        <span
                          style={{
                            color: "#22c55e",
                            fontSize: 12,
                            fontWeight: 700,
                            textAlign: "right" as const,
                          }}
                        >
                          +{h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Recent activity */}
            <section
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #30363d",
                  backgroundColor: "#0d1117",
                }}
              >
                <h2 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {tx.recentActivity}
                </h2>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* My posts */}
                <div>
                  <h3 style={{ color: "#8b949e", fontSize: 12, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    {tx.myPosts}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {MOCK_RECENT_POSTS.map((p) => (
                      <a
                        key={p.id}
                        href={`/${loc}/community/post/${p.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "#0d1117",
                          border: "1px solid #21262d",
                          borderRadius: 8,
                          padding: "10px 14px",
                          textDecoration: "none",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            color: "#c9d1d9",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                            flex: 1,
                          }}
                        >
                          {isKo ? p.title.ko : p.title.en}
                        </span>
                        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                          <span style={{ color: "#484f58", fontSize: 11 }}>👁 {p.views.toLocaleString()}</span>
                          <span style={{ color: "#484f58", fontSize: 11 }}>▲ {p.likes}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* My comments */}
                <div>
                  <h3 style={{ color: "#8b949e", fontSize: 12, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    {tx.myComments}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {MOCK_RECENT_COMMENTS.map((c) => (
                      <a
                        key={c.id}
                        href={`/${loc}/community/post/${c.postId}`}
                        style={{
                          backgroundColor: "#0d1117",
                          border: "1px solid #21262d",
                          borderRadius: 8,
                          padding: "10px 14px",
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        <div
                          style={{
                            color: "#8b949e",
                            fontSize: 11,
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          ↩ {isKo ? c.postTitle.ko : c.postTitle.en}
                        </div>
                        <div
                          style={{
                            color: "#c9d1d9",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          "{isKo ? c.excerpt.ko : c.excerpt.en}"
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-6">

            {/* 6. Favourite league */}
            <section
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #30363d",
                  backgroundColor: "#0d1117",
                }}
              >
                <h3 style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {tx.favoriteLeague}
                </h3>
              </div>
              <a
                href={`/${loc}/league/epl`}
                style={{
                  display: "block",
                  padding: "18px 16px",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    🏴󠁧󠁢󠁥󠁮󠁧󠁿
                  </div>
                  <div>
                    <div style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
                      {isKo ? "프리미어리그" : "Premier League"}
                    </div>
                    <div style={{ color: "#8b949e", fontSize: 12 }}>
                      {isKo ? "잉글랜드 · 2025/26 시즌" : "England · 2025/26 Season"}
                    </div>
                  </div>
                </div>
              </a>
            </section>

            {/* 7. Account info */}
            <section
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #30363d",
                  backgroundColor: "#0d1117",
                }}
              >
                <h3 style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {tx.accountInfo}
                </h3>
              </div>
              <div style={{ padding: "16px" }}>
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
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 0",
                      borderBottom: idx < arr.length - 1 ? "1px solid #21262d" : "none",
                    }}
                  >
                    <span style={{ color: "#8b949e", fontSize: 12 }}>{row.label}</span>
                    <span
                      style={{
                        color: "#c9d1d9",
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                        maxWidth: 140,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Ad slot */}
            <AdSlot slotId="mypage-sidebar" size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
