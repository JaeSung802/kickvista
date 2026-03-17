import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import AttendanceHistory from "@/components/attendance/AttendanceHistory";
import AdSlot from "@/components/ads/AdSlot";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { hasCheckedInToday, getAttendanceHistory } from "@/lib/attendance";
import { getRank, getProgressToNextRank } from "@/lib/ranks";

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
  const today = new Date("2026-03-14");
  // Deterministic pattern: checked in on most days except a few scattered misses
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
  // Force last 3 days as checked in (current streak)
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
    borderColor: "#7a4a1c",
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
    color: "#c0c0c0",
    borderColor: "#9e9e9e",
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
    color: "#ffd700",
    borderColor: "#c8a800",
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
    color: "#a8d8ea",
    borderColor: "#14b8a6",
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
    color: "#a855f7",
    borderColor: "#7c3aed",
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

// ─── Mock leaderboard ─────────────────────────────────────────────────────────

const MOCK_LEADERBOARD = [
  { rank: 1,  name: "footballking_kr",   tier: "legend",   badge: "👑", pts: 8240, streak: 127 },
  { rank: 2,  name: "premierleaguefan",  tier: "legend",   badge: "👑", pts: 7310, streak: 98  },
  { rank: 3,  name: "bundesligaboss",    tier: "legend",   badge: "👑", pts: 6890, streak: 82  },
  { rank: 4,  name: "seriea_fanatic",    tier: "platinum", badge: "💎", pts: 4670, streak: 56  },
  { rank: 5,  name: "laliganerd",        tier: "platinum", badge: "💎", pts: 3820, streak: 44  },
  { rank: 6,  name: "championsleague_x", tier: "platinum", badge: "💎", pts: 2540, streak: 31  },
  { rank: 7,  name: "kickvista_gold7",   tier: "gold",     badge: "🥇", pts: 1820, streak: 22  },
  { rank: 8,  name: "goalgetter_88",     tier: "gold",     badge: "🥇", pts: 1540, streak: 18  },
  { rank: 9,  name: "silverstreak_kr",   tier: "silver",   badge: "🥈", pts: 380,  streak: 12  },
  { rank: 10, name: "kickvista_user10",  tier: "silver",   badge: "🥈", pts: 290,  streak: 7   },
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
    perks: "Perks",
    required: "Required",
    you: "You",
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
    perks: "혜택",
    required: "필요 포인트",
    you: "나",
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

  let widgetProps = {
    totalDays: 45,
    currentStreak: 3,
    totalPoints: 350,
    rankTier: "silver" as import("@/lib/ranks").RankTier,
    rankLabel: isKo ? "실버" : "Silver",
    rankColor: "#c0c0c0",
    rankBadge: "🥈",
    hasCheckedInToday: false,
    progressToNextRank: 50,
    locale: loc,
  };

  if (supabaseUser) {
    const [profile, checkedIn, history] = await Promise.all([
      getServerProfile(supabaseUser.id),
      hasCheckedInToday(supabaseUser.id),
      getAttendanceHistory(supabaseUser.id),
    ]);

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

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* ── Page hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          borderBottom: "1px solid #21262d",
        }}
        className="py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 999,
              padding: "5px 14px",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14 }}>🏆</span>
            <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>
              {t.systemBadge}
            </span>
          </div>
          <h1
            style={{
              color: "#e6edf3",
              fontSize: 32,
              fontWeight: 900,
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            {t.pageTitle}
          </h1>
          <p style={{ color: "#8b949e", fontSize: 15, margin: 0 }}>
            {t.pageSubtitle}
          </p>
        </div>
      </div>

      {/* ── Top ad ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdSlot slotId="attendance-top" size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Two-column grid: main + sidebar ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* LEFT: Widget + History */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Attendance widget */}
            <div>
              <h2
                style={{
                  color: "#e6edf3",
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 16px",
                }}
              >
                {t.checkInTitle}
              </h2>
              <AttendanceWidget {...widgetProps} />
            </div>

            {/* Attendance history */}
            <div>
              <h2
                style={{
                  color: "#e6edf3",
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 16px",
                }}
              >
                {t.historyTitle}
              </h2>
              <AttendanceHistory history={realHistory} locale={loc} />
            </div>
          </div>

          {/* RIGHT: Points system + Ad */}
          <div className="flex flex-col gap-6">
            {/* Points system card */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid #21262d",
                  backgroundColor: "#0d1117",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>💡</span>
                <h3
                  style={{
                    color: "#e6edf3",
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {t.pointsSystemTitle}
                </h3>
              </div>
              <div style={{ padding: "16px 18px" }}>
                {[
                  { label: t.basePoints, color: "#22c55e", icon: "✓" },
                  { label: t.streak3, color: "#3b82f6", icon: "🔥" },
                  { label: t.streak7, color: "#f59e0b", icon: "🔥" },
                  { label: t.streak14, color: "#f97316", icon: "🔥" },
                  { label: t.streak30, color: "#a855f7", icon: "👑" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid #21262d",
                    }}
                  >
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" as const }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        color: item.color,
                        fontSize: 13,
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar ad */}
            <AdSlot slotId="attendance-sidebar" size="rectangle" />
          </div>
        </div>

        {/* ── Rank tiers section (full width) ─────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                color: "#e6edf3",
                fontSize: 22,
                fontWeight: 900,
                margin: "0 0 6px",
              }}
            >
              {t.ranksTitle}
            </h2>
            <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>
              {t.ranksSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RANK_TIERS.map((rank) => {
              const isCurrentRank = rank.tier === "silver";
              return (
                <div
                  key={rank.tier}
                  style={{
                    backgroundColor: "#161b22",
                    border: `1px solid ${isCurrentRank ? rank.color + "80" : rank.borderColor + "40"}`,
                    borderRadius: 12,
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: 10,
                    position: "relative" as const,
                    overflow: "hidden",
                    boxShadow: isCurrentRank
                      ? `0 0 20px ${rank.color}30, 0 0 40px ${rank.color}15`
                      : "none",
                  }}
                >
                  {/* Current rank ribbon */}
                  {isCurrentRank && (
                    <div
                      style={{
                        position: "absolute" as const,
                        top: 0,
                        right: 0,
                        backgroundColor: rank.color,
                        color: "#0d1117",
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderBottomLeftRadius: 8,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {t.currentBadge}
                    </div>
                  )}

                  {/* Badge */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      backgroundColor: "#0d1117",
                      border: `2px solid ${rank.color}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                    }}
                  >
                    {rank.badge}
                  </div>

                  {/* Tier name */}
                  <div style={{ textAlign: "center" as const }}>
                    <div
                      style={{
                        color: rank.color,
                        fontSize: 14,
                        fontWeight: 800,
                        marginBottom: 3,
                      }}
                    >
                      {isKo ? rank.colorKo : rank.colorEn}
                    </div>
                    <div
                      style={{
                        color: "#484f58",
                        fontSize: 11,
                        backgroundColor: "#0d1117",
                        border: "1px solid #21262d",
                        borderRadius: 4,
                        padding: "2px 8px",
                        display: "inline-block",
                      }}
                    >
                      {isKo ? rank.requireKo : rank.requireEn}
                    </div>
                  </div>

                  {/* Perks */}
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                      width: "100%",
                    }}
                  >
                    {(isKo ? rank.perksKo : rank.perksEn).map((perk) => (
                      <li
                        key={perk}
                        style={{
                          color: "#8b949e",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 5,
                          marginBottom: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            color: rank.color,
                            fontSize: 9,
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
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
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                color: "#e6edf3",
                fontSize: 22,
                fontWeight: 900,
                margin: "0 0 6px",
              }}
            >
              {t.leaderboardTitle}
            </h2>
            <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>
              {t.leaderboardSubtitle}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 80px 80px 80px",
                gap: 0,
                padding: "10px 20px",
                backgroundColor: "#0d1117",
                borderBottom: "1px solid #21262d",
              }}
            >
              {[t.rank, t.user, t.tier, t.streak, t.points].map((h) => (
                <span
                  key={h}
                  style={{
                    color: "#484f58",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {MOCK_LEADERBOARD.map((entry, idx) => {
              const medalColors: Record<number, string> = {
                1: "#ffd700",
                2: "#c0c0c0",
                3: "#cd7f32",
              };
              const rankDisplay =
                entry.rank <= 3
                  ? (["🥇", "🥈", "🥉"] as const)[entry.rank - 1]
                  : String(entry.rank);
              return (
                <div
                  key={entry.rank}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 80px 80px 80px",
                    gap: 0,
                    padding: "13px 20px",
                    borderBottom:
                      idx < MOCK_LEADERBOARD.length - 1
                        ? "1px solid #21262d"
                        : "none",
                    backgroundColor:
                      entry.rank <= 3 ? "rgba(255,215,0,0.03)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      color: medalColors[entry.rank] ?? "#484f58",
                      fontSize: entry.rank <= 3 ? 16 : 13,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {rankDisplay}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {entry.badge}
                    </span>
                    <span
                      style={{
                        color: "#e6edf3",
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <span
                    style={{
                      color: "#8b949e",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {entry.tier}
                  </span>
                  <span
                    style={{
                      color: "#f59e0b",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {entry.streak}
                    <span
                      style={{ color: "#484f58", fontWeight: 400, marginLeft: 3 }}
                    >
                      {t.days}
                    </span>
                  </span>
                  <span
                    style={{
                      color: "#22c55e",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {entry.pts.toLocaleString()}
                    <span
                      style={{ color: "#484f58", fontWeight: 400, marginLeft: 3 }}
                    >
                      {t.pts}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bottom ad ───────────────────────────────────────────────── */}
        <AdSlot slotId="attendance-bottom" size="leaderboard" />
      </div>
    </main>
  );
}
