"use client";

import { TEAM_REGISTRY } from "@/lib/football/teamRegistry";
import { canonicalTeamUrl } from "@/lib/football/slugs";

const FEATURED_SLUGS = [
  "arsenal", "man-city", "liverpool", "chelsea", "man-united", "tottenham",
  "real-madrid", "barcelona", "bayern-munich", "dortmund", "paris-sg", "inter-milan",
];

interface PopularTeamsSectionProps {
  locale: "ko" | "en";
}

export default function PopularTeamsSection({ locale }: PopularTeamsSectionProps) {
  const isKo = locale === "ko";

  return (
    <section
      className="py-10"
      style={{ borderTop: "1px solid #21262d" }}
      aria-label={isKo ? "인기 팀" : "Popular Teams"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-title-bar" />
            <div>
              <h2
                style={{ color: "#e6edf3", fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}
              >
                {isKo ? "인기 팀 커뮤니티" : "Popular Team Communities"}
              </h2>
              <p style={{ color: "#8b949e", fontSize: 12, margin: "3px 0 0" }}>
                {isKo
                  ? "좋아하는 팀 팬들과 이야기 나눠보세요"
                  : "Chat with fans of your favourite club"}
              </p>
            </div>
          </div>
        </div>

        {/* Team grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {FEATURED_SLUGS.map((slug) => {
            const team = TEAM_REGISTRY[slug];
            if (!team) return null;
            const name = isKo ? team.nameKo : team.nameEn;
            return (
              <a
                key={slug}
                href={`/${locale}/team/${canonicalTeamUrl(slug)}/community`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 10,
                  textDecoration: "none",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.35)";
                  (e.currentTarget as HTMLElement).style.background  = "#1c2128";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#30363d";
                  (e.currentTarget as HTMLElement).style.background  = "#161b22";
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{team.flag}</span>
                <span
                  style={{
                    color: "#c9d1d9",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
