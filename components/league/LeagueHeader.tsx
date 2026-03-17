"use client";

type LeagueSlug =
  | "premier-league"
  | "la-liga"
  | "bundesliga"
  | "serie-a"
  | "ligue-1"
  | "champions-league";

interface LeagueHeaderProps {
  slug: LeagueSlug;
  locale: "ko" | "en";
}

const leagueData: Record<
  LeagueSlug,
  {
    emoji: string;
    nameEn: string;
    nameKo: string;
    countryEn: string;
    countryKo: string;
    season: string;
    accentColor: string;
  }
> = {
  "premier-league": {
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    nameEn: "Premier League",
    nameKo: "프리미어리그",
    countryEn: "England",
    countryKo: "잉글랜드",
    season: "2025/26",
    accentColor: "#3d195b",
  },
  "la-liga": {
    emoji: "🇪🇸",
    nameEn: "La Liga",
    nameKo: "라 리가",
    countryEn: "Spain",
    countryKo: "스페인",
    season: "2025/26",
    accentColor: "#c8102e",
  },
  "bundesliga": {
    emoji: "🇩🇪",
    nameEn: "Bundesliga",
    nameKo: "분데스리가",
    countryEn: "Germany",
    countryKo: "독일",
    season: "2025/26",
    accentColor: "#d20515",
  },
  "serie-a": {
    emoji: "🇮🇹",
    nameEn: "Serie A",
    nameKo: "세리에 A",
    countryEn: "Italy",
    countryKo: "이탈리아",
    season: "2025/26",
    accentColor: "#1f4e8c",
  },
  "ligue-1": {
    emoji: "🇫🇷",
    nameEn: "Ligue 1",
    nameKo: "리그 1",
    countryEn: "France",
    countryKo: "프랑스",
    season: "2025/26",
    accentColor: "#003087",
  },
  "champions-league": {
    emoji: "⭐",
    nameEn: "UEFA Champions League",
    nameKo: "UEFA 챔피언스리그",
    countryEn: "Europe",
    countryKo: "유럽",
    season: "2025/26",
    accentColor: "#1e3a8a",
  },
};

const tabs = {
  en: ["Overview", "Fixtures", "Standings", "Analysis"],
  ko: ["개요", "일정", "순위표", "분석"],
};

const tabSlugs = ["overview", "fixtures", "standings", "analysis"];

export default function LeagueHeader({ slug, locale }: LeagueHeaderProps) {
  const league = leagueData[slug];
  const isKo = locale === "ko";
  const name = isKo ? league.nameKo : league.nameEn;
  const country = isKo ? league.countryKo : league.countryEn;
  const seasonLabel = isKo ? `${league.season} 시즌` : `${league.season} Season`;
  const tabLabels = tabs[locale];

  return (
    <header
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Accent color stripe */}
      <div style={{ height: 4, backgroundColor: league.accentColor }} />

      {/* Main content */}
      <div style={{ padding: "24px 24px 0" }}>
        <div className="flex items-center gap-5" style={{ marginBottom: 20 }}>
          {/* League emoji */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              flexShrink: 0,
            }}
          >
            {league.emoji}
          </div>

          {/* League info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h1
              style={{
                color: "#e6edf3",
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  color: "#8b949e",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🌍 {country}
              </span>

              <span style={{ color: "#30363d", fontSize: 12 }}>·</span>

              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 5,
                  padding: "2px 8px",
                }}
              >
                {seasonLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav
          style={{
            display: "flex",
            borderTop: "1px solid #30363d",
            marginLeft: -24,
            marginRight: -24,
            paddingLeft: 24,
            gap: 0,
            overflowX: "auto",
          }}
        >
          {tabLabels.map((label, idx) => {
            const tabSlug = tabSlugs[idx];
            const href = `/${locale}/leagues/${slug}/${tabSlug}`;

            return (
              <a
                key={tabSlug}
                href={href}
                style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#8b949e",
                  textDecoration: "none",
                  borderBottom: "2px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e6edf3";
                  e.currentTarget.style.borderBottomColor = "#30363d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#8b949e";
                  e.currentTarget.style.borderBottomColor = "transparent";
                }}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
