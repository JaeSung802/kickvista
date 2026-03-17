"use client";

import type { LeagueSlug } from "@/lib/football/types";
import { resolveLeagueUrlSlug } from "@/lib/football/slugs";

interface LeagueCardsProps {
  locale: "ko" | "en";
  /**
   * Live match counts per league, keyed by slug.
   * When provided (from a Server Component that called `countLiveByLeague`),
   * the real count overrides the hardcoded mock count on each card.
   */
  liveCounts?: Partial<Record<LeagueSlug, number>>;
}

const leagues = [
  {
    slug:      "epl",
    nameEn:    "Premier League",
    nameKo:    "프리미어리그",
    countryEn: "England",
    countryKo: "잉글랜드",
    flag:      "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    matches:   3,
  },
  {
    slug:      "la-liga",
    nameEn:    "La Liga",
    nameKo:    "라리가",
    countryEn: "Spain",
    countryKo: "스페인",
    flag:      "🇪🇸",
    matches:   2,
  },
  {
    slug:      "bundesliga",
    nameEn:    "Bundesliga",
    nameKo:    "분데스리가",
    countryEn: "Germany",
    countryKo: "독일",
    flag:      "🇩🇪",
    matches:   4,
  },
  {
    slug:      "serie-a",
    nameEn:    "Serie A",
    nameKo:    "세리에 A",
    countryEn: "Italy",
    countryKo: "이탈리아",
    flag:      "🇮🇹",
    matches:   1,
  },
  {
    slug:      "ligue-1",
    nameEn:    "Ligue 1",
    nameKo:    "리그 1",
    countryEn: "France",
    countryKo: "프랑스",
    flag:      "🇫🇷",
    matches:   2,
  },
  {
    slug:      "champions-league",
    nameEn:    "Champions League",
    nameKo:    "챔피언스리그",
    countryEn: "Europe",
    countryKo: "유럽",
    flag:      "🌍",
    matches:   5,
  },
];

const labels = {
  en: {
    sectionTitle: "Top Leagues",
    viewAll:      "All leagues →",
    live:         "live",
  },
  ko: {
    sectionTitle: "주요 리그",
    viewAll:      "전체 리그 →",
    live:         "라이브",
  },
};

export default function LeagueCards({ locale, liveCounts }: LeagueCardsProps) {
  const t = labels[locale];

  return (
    <section id="leagues" className="py-8" style={{ borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="section-title-bar" />
            <h2 className="text-lg font-bold text-white">{t.sectionTitle}</h2>
          </div>
          <a
            href={`/${locale}/leagues`}
            className="text-sm font-medium transition-colors"
            style={{ color: "#22c55e" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {t.viewAll}
          </a>
        </div>

        {/* Cards — horizontal scroll on mobile, grid on sm+ */}
        <div className="flex gap-3 overflow-x-auto snap-x pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0" style={{ scrollbarWidth: "none" as const }}>
          {leagues.map((league) => {
            const name    = locale === "ko" ? league.nameKo    : league.nameEn;
            const country = locale === "ko" ? league.countryKo : league.countryEn;

            return (
              <a
                key={league.slug}
                href={`/${locale}/league/${league.slug}`}
                className="relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-150 snap-start shrink-0 w-36 sm:w-auto"
                style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#1c2128";
                  el.style.borderColor = "rgba(34,197,94,0.3)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "#161b22";
                  el.style.borderColor = "#30363d";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
                  style={{ background: "rgba(34,197,94,0.2)" }}
                />

                {/* Flag */}
                <span className="text-3xl">{league.flag}</span>

                {/* Name + country */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-white leading-tight">{name}</p>
                  <p style={{ color: "#484f58" }} className="text-xs mt-0.5">{country}</p>
                </div>

                {/* Live badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  {liveCounts?.[resolveLeagueUrlSlug(league.slug) as LeagueSlug] ?? league.matches} {t.live}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
