"use client";

interface CommunityHighlightsProps {
  locale: "ko" | "en";
}

type Post = {
  id: string;
  titleEn: string;
  titleKo: string;
  category: string;
  categoryKo: string;
  comments: number;
  views: number;
  timeAgo: string;
  timeAgoKo: string;
};

const mockPosts: Post[] = [
  {
    id: "1",
    titleEn: "Arsenal vs Man City tactical breakdown — Arteta outsmarts Guardiola",
    titleKo: "아스날 vs 맨시티 전술 분석 — 아르테타가 과르디올라를 앞섰다",
    category: "Match Discussion",
    categoryKo: "경기 토론",
    comments: 87,
    views: 8420,
    timeAgo: "2h ago",
    timeAgoKo: "2시간 전",
  },
  {
    id: "2",
    titleEn: "BREAKING: Star midfielder linked with shock Premier League move",
    titleKo: "속보: 스타 미드필더, 충격적인 프리미어리그 이적설",
    category: "Transfer News",
    categoryKo: "이적 뉴스",
    comments: 143,
    views: 14230,
    timeAgo: "4h ago",
    timeAgoKo: "4시간 전",
  },
  {
    id: "3",
    titleEn: "Why the 4-3-3 is dominating Europe this season",
    titleKo: "왜 이번 시즌 유럽에서 4-3-3이 지배적인가",
    category: "Tactics",
    categoryKo: "전술 분석",
    comments: 62,
    views: 5840,
    timeAgo: "6h ago",
    timeAgoKo: "6시간 전",
  },
  {
    id: "4",
    titleEn: "Champions League QF draw: Man City vs Bayern is the tie of the round",
    titleKo: "챔피언스리그 8강 추첨: 맨시티 vs 바이에른이 최고의 빅매치",
    category: "Champions League",
    categoryKo: "챔피언스리그",
    comments: 234,
    views: 21400,
    timeAgo: "1d ago",
    timeAgoKo: "1일 전",
  },
];

// Two-color system: football content gets green accent, news/transfer gets blue
const categoryStyle: Record<string, { color: string; bg: string; border: string }> = {
  "Match Discussion": { color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  "Transfer News":    { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  "Tactics":          { color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  "Champions League": { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
};

const DEFAULT_STYLE = { color: "#8b949e", bg: "rgba(139,148,158,0.08)", border: "rgba(139,148,158,0.2)" };

export default function CommunityHighlights({ locale }: CommunityHighlightsProps) {
  const isKo    = locale === "ko";
  const heading = isKo ? "커뮤니티 하이라이트"         : "Community Highlights";
  const sub     = isKo ? "지금 팬들이 이야기하는 것들"  : "What the community is talking about";
  const viewAll = isKo ? "커뮤니티 전체 보기"           : "View Community →";

  return (
    <section id="community" className="py-10" style={{ borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-title-bar" />
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{heading}</h2>
              <p style={{ color: "#8b949e" }} className="text-xs mt-0.5">{sub}</p>
            </div>
          </div>
          <a
            href={`/${locale}/community`}
            className="text-sm font-medium transition-opacity"
            style={{ color: "#22c55e" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {viewAll}
          </a>
        </div>

        {/* Post list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          {mockPosts.map((post, idx) => {
            const style    = categoryStyle[post.category] ?? DEFAULT_STYLE;
            const catLabel = isKo ? post.categoryKo : post.category;
            const title    = isKo ? post.titleKo   : post.titleEn;
            const timeAgo  = isKo ? post.timeAgoKo : post.timeAgo;

            return (
              <a
                key={post.id}
                href={`/${locale}/community/post/${post.id}`}
                className="block transition-colors"
                style={{
                  padding: "14px 18px",
                  borderBottom: idx < mockPosts.length - 1 ? "1px solid #21262d" : "none",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1c2128")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Category + time */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: style.color,
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderRadius: 4,
                      padding: "2px 7px",
                    }}
                  >
                    {catLabel}
                  </span>
                  <span style={{ color: "#484f58", fontSize: 11 }}>{timeAgo}</span>
                </div>

                {/* Title */}
                <p
                  style={{
                    color: "#c9d1d9",
                    fontSize: 14,
                    fontWeight: 500,
                    margin: "0 0 8px",
                    lineHeight: 1.5,
                  }}
                >
                  {title}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <span style={{ color: "#8b949e", fontSize: 11 }}>
                    <span style={{ marginRight: 3 }}>💬</span>{post.comments}
                  </span>
                  <span style={{ color: "#8b949e", fontSize: 11 }}>
                    <span style={{ marginRight: 3 }}>👁</span>{post.views.toLocaleString()}
                  </span>
                  {post.views >= 10000 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: 4,
                        padding: "1px 6px",
                      }}
                    >
                      HOT
                    </span>
                  )}
                </div>
              </a>
            );
          })}

          {/* Footer CTA */}
          <div style={{ padding: "12px 18px", borderTop: "1px solid #21262d" }}>
            <a
              href={`/${locale}/community`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: "1px solid #30363d", color: "#8b949e", textDecoration: "none" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
                e.currentTarget.style.color = "#e6edf3";
                e.currentTarget.style.background = "rgba(34,197,94,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#30363d";
                e.currentTarget.style.color = "#8b949e";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {viewAll}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
