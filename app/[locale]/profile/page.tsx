import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSlot from "@/components/ads/AdSlot";

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
    categoryColor: "#22c55e",
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

  const user = MOCK_USER;
  const xpPercent = Math.round((user.xpCurrent / user.xpMax) * 100);

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* Profile hero */}
      <div
        style={{
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          borderBottom: "1px solid #21262d",
        }}
        className="py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* User info */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#161b22",
                  border: `3px solid ${user.rankColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  flexShrink: 0,
                }}
              >
                {user.avatar}
              </div>

              {/* Details */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1
                    style={{
                      color: "#e6edf3",
                      fontSize: 22,
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {user.nickname}
                  </h1>
                  {/* Rank badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: `${user.rankColor}20`,
                      border: `1px solid ${user.rankColor}50`,
                      borderRadius: 999,
                      padding: "2px 10px",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{user.rankBadge}</span>
                    <span style={{ color: user.rankColor, fontSize: 12, fontWeight: 700 }}>
                      {isKo ? user.rankLabelKo : user.rankLabel}
                    </span>
                  </span>
                  {/* Level badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      backgroundColor: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 999,
                      padding: "2px 10px",
                      color: "#22c55e",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {t.level} {user.level}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4" style={{ marginTop: 4 }}>
                  <span style={{ color: "#8b949e", fontSize: 13 }}>
                    📅 {t.joinedOn}: {user.joinDate}
                  </span>
                  <span style={{ color: "#8b949e", fontSize: 13 }}>
                    {isKo ? user.favoriteLeagueKo : user.favoriteLeague}
                  </span>
                </div>

                {/* XP progress */}
                <div style={{ marginTop: 10, maxWidth: 280 }}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 5 }}
                  >
                    <span style={{ color: "#484f58", fontSize: 11 }}>
                      {t.xp}: {user.xpCurrent.toLocaleString()} / {user.xpMax.toLocaleString()}
                    </span>
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{xpPercent}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      backgroundColor: "#21262d",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${xpPercent}%`,
                        background: "linear-gradient(90deg, #22c55e, #4ade80)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`/${loc}/profile/edit`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  backgroundColor: "#161b22",
                  color: "#e6edf3",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  textDecoration: "none",
                  border: "1px solid #30363d",
                  transition: "border-color 0.15s",
                }}
              >
                ✏️ {t.editProfile}
              </a>
              <a
                href={`/${loc}/profile/settings`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  backgroundColor: "#161b22",
                  color: "#8b949e",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  textDecoration: "none",
                  border: "1px solid #30363d",
                }}
              >
                ⚙️ {t.settings}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ borderBottom: "1px solid #21262d" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-wrap items-center gap-0"
            style={{ overflowX: "auto" }}
          >
            {[
              { label: t.points,         value: user.totalPoints.toLocaleString(), color: "#22c55e" },
              { label: t.totalAttendance, value: `${user.totalAttendance} ${t.days}`,  color: "#e6edf3" },
              { label: t.streak,          value: `🔥 ${user.currentStreak} ${t.days}`, color: "#f59e0b" },
              { label: t.longestStreak,   value: `${user.longestStreak} ${t.days}`,    color: "#e6edf3" },
            ].map((stat, idx, arr) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "16px 32px",
                  borderRight: idx < arr.length - 1 ? "1px solid #21262d" : "none",
                }}
              >
                <span style={{ color: stat.color, fontSize: 20, fontWeight: 800 }}>
                  {stat.value}
                </span>
                <span style={{ color: "#8b949e", fontSize: 11 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* This month's attendance */}
            <section>
              <h2
                style={{
                  color: "#e6edf3",
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 16px",
                }}
              >
                {t.attendanceTitle}
              </h2>
              <div
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 12,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center" as const,
                        color: "#484f58",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                  }}
                >
                  {/* Padding for first day of month (March 2026 starts on Sunday) */}
                  {MONTHLY_ATTENDANCE.map((day) => (
                    <div
                      key={day.date}
                      title={day.date}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: day.checked ? "#22c55e" : "#21262d",
                        color: day.checked ? "#0d1117" : "#484f58",
                        border: day.checked ? "none" : "1px solid #30363d",
                      }}
                    >
                      {new Date(day.date).getDate()}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#22c55e" }}
                    />
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{t.checked}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: "#21262d",
                        border: "1px solid #30363d",
                      }}
                    />
                    <span style={{ color: "#8b949e", fontSize: 11 }}>{t.missed}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Posts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800, margin: 0 }}>
                  {t.postsTitle}
                </h2>
                <a
                  href={`/${loc}/community`}
                  style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  {t.viewAllPosts}
                </a>
              </div>
              <div
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {MOCK_RECENT_POSTS.map((post, idx) => (
                  <a
                    key={post.id}
                    href={`/${loc}/community/${post.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "14px 18px",
                      borderBottom: idx < MOCK_RECENT_POSTS.length - 1 ? "1px solid #21262d" : "none",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: post.categoryColor,
                            backgroundColor: `${post.categoryColor}18`,
                            border: `1px solid ${post.categoryColor}40`,
                            borderRadius: 4,
                            padding: "2px 7px",
                          }}
                        >
                          {post.category}
                        </span>
                        <span style={{ color: "#484f58", fontSize: 11 }}>
                          {isKo ? post.timeAgoKo : post.timeAgo}
                        </span>
                      </div>
                      <span style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>
                        {isKo ? post.titleKo : post.titleEn}
                      </span>
                    </div>
                    <span style={{ color: "#484f58", fontSize: 12, flexShrink: 0 }}>
                      💬 {post.comments}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            {/* Recent Comments */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800, margin: 0 }}>
                  {t.commentsTitle}
                </h2>
                <a
                  href={`/${loc}/community`}
                  style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                  {t.viewAllComments}
                </a>
              </div>
              <div
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {MOCK_RECENT_COMMENTS.map((comment, idx) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "14px 18px",
                      borderBottom: idx < MOCK_RECENT_COMMENTS.length - 1 ? "1px solid #21262d" : "none",
                    }}
                  >
                    <p
                      style={{ color: "#484f58", fontSize: 12, margin: "0 0 4px" }}
                    >
                      💬 {isKo ? comment.postTitleKo : comment.postTitleEn}
                    </p>
                    <p
                      style={{
                        color: "#8b949e",
                        fontSize: 13,
                        margin: "0 0 6px",
                        lineHeight: 1.6,
                      }}
                    >
                      {isKo ? comment.commentKo : comment.commentEn}
                    </p>
                    <span style={{ color: "#484f58", fontSize: 11 }}>
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
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h3
                style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, margin: 0 }}
              >
                {isKo ? "프로필 정보" : "Profile Details"}
              </h3>
              {[
                { label: t.favoriteLeague, value: isKo ? user.favoriteLeagueKo : user.favoriteLeague },
                { label: t.favoriteTeam,   value: isKo ? user.favoriteTeamKo : user.favoriteTeam },
                { label: t.rank,           value: `${user.rankBadge} ${isKo ? user.rankLabelKo : user.rankLabel}` },
                { label: t.level,          value: `⚡ ${user.level}` },
                { label: t.joinedOn,       value: user.joinDate },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    paddingBottom: 12,
                    borderBottom: "1px solid #21262d",
                  }}
                >
                  <span style={{ color: "#484f58", fontSize: 11 }}>{label}</span>
                  <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {[
                { label: isKo ? "출석 체크 페이지" : "Attendance Page", href: `/${loc}/attendance`, icon: "📅" },
                { label: isKo ? "AI 분석 보기" : "View AI Analysis",   href: `/${loc}/analysis`,   icon: "✨" },
                { label: isKo ? "커뮤니티"       : "Community",          href: `/${loc}/community`,  icon: "💬" },
                { label: isKo ? "계정 설정"       : "Account Settings",  href: `/${loc}/profile/settings`, icon: "⚙️" },
              ].map(({ label, href, icon }, idx, arr) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: idx < arr.length - 1 ? "1px solid #21262d" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                    {label}
                  </span>
                  <span style={{ color: "#484f58", fontSize: 12, marginLeft: "auto" }}>→</span>
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
