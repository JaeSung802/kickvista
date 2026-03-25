import type { LeagueSlug } from "@/lib/football/types";
import { LEAGUE_BY_SLUG, currentFootballSeason } from "@/lib/football/constants";
import { LeagueLogo } from "@/components/ui/LeagueLogo";

// Compute season labels dynamically so they update automatically each season
// e.g. March 2026 → currentFootballSeason() = 2025 → "2025/26"
const _sy = currentFootballSeason();
const EURO_SEASON = `${_sy}/${(_sy + 1).toString().slice(2)}`; // "2025/26"
const CAL_SEASON  = String(_sy + 1);                            // "2026"

interface LeagueHeaderProps {
  slug: LeagueSlug;
  locale: "ko" | "en";
  /** Index of the active tab: 0=overview 1=fixtures 2=results 3=standings */
  activeTab?: number;
}

const leagueData: Partial<Record<
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
>> = {
  "premier-league": {
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    nameEn: "Premier League",
    nameKo: "프리미어리그",
    countryEn: "England",
    countryKo: "잉글랜드",
    season: EURO_SEASON,
    accentColor: "#3d195b",
  },
  "la-liga": {
    emoji: "🇪🇸",
    nameEn: "La Liga",
    nameKo: "라 리가",
    countryEn: "Spain",
    countryKo: "스페인",
    season: EURO_SEASON,
    accentColor: "#c8102e",
  },
  "bundesliga": {
    emoji: "🇩🇪",
    nameEn: "Bundesliga",
    nameKo: "분데스리가",
    countryEn: "Germany",
    countryKo: "독일",
    season: EURO_SEASON,
    accentColor: "#d20515",
  },
  "serie-a": {
    emoji: "🇮🇹",
    nameEn: "Serie A",
    nameKo: "세리에 A",
    countryEn: "Italy",
    countryKo: "이탈리아",
    season: EURO_SEASON,
    accentColor: "#1f4e8c",
  },
  "ligue-1": {
    emoji: "🇫🇷",
    nameEn: "Ligue 1",
    nameKo: "리그 1",
    countryEn: "France",
    countryKo: "프랑스",
    season: EURO_SEASON,
    accentColor: "#003087",
  },
  "champions-league": {
    emoji: "⭐",
    nameEn: "UEFA Champions League",
    nameKo: "UEFA 챔피언스리그",
    countryEn: "Europe",
    countryKo: "유럽",
    season: EURO_SEASON,
    accentColor: "#1e3a8a",
  },
  "europa-league": {
    emoji: "🟠",
    nameEn: "UEFA Europa League",
    nameKo: "UEFA 유로파리그",
    countryEn: "Europe",
    countryKo: "유럽",
    season: EURO_SEASON,
    accentColor: "#f97316",
  },
  "eredivisie": {
    emoji: "🇳🇱",
    nameEn: "Eredivisie",
    nameKo: "에레디비시",
    countryEn: "Netherlands",
    countryKo: "네덜란드",
    season: EURO_SEASON,
    accentColor: "#f97316",
  },
  "primeira-liga": {
    emoji: "🇵🇹",
    nameEn: "Primeira Liga",
    nameKo: "프리메이라리가",
    countryEn: "Portugal",
    countryKo: "포르투갈",
    season: EURO_SEASON,
    accentColor: "#059669",
  },
  "saudi-pro-league": {
    emoji: "🇸🇦",
    nameEn: "Saudi Pro League",
    nameKo: "사우디 프로리그",
    countryEn: "Saudi Arabia",
    countryKo: "사우디아라비아",
    season: EURO_SEASON,
    accentColor: "#064E3B",
  },
  "mls": {
    emoji: "🇺🇸",
    nameEn: "MLS",
    nameKo: "MLS",
    countryEn: "USA",
    countryKo: "미국",
    season: CAL_SEASON,
    accentColor: "#1d4ed8",
  },
  "k-league-1": {
    emoji: "🇰🇷",
    nameEn: "K League 1",
    nameKo: "K리그1",
    countryEn: "South Korea",
    countryKo: "대한민국",
    season: CAL_SEASON,
    accentColor: "#003087",
  },
  "j1-league": {
    emoji: "🇯🇵",
    nameEn: "J1 League",
    nameKo: "J1 리그",
    countryEn: "Japan",
    countryKo: "일본",
    season: CAL_SEASON,
    accentColor: "#c92424",
  },
  "liga-mx": {
    emoji: "🇲🇽",
    nameEn: "Liga MX",
    nameKo: "리가 MX",
    countryEn: "Mexico",
    countryKo: "멕시코",
    season: EURO_SEASON,
    accentColor: "#006847",
  },
  "super-lig": {
    emoji: "🇹🇷",
    nameEn: "Süper Lig",
    nameKo: "쉬페르 리그",
    countryEn: "Turkey",
    countryKo: "튀르키예",
    season: EURO_SEASON,
    accentColor: "#c0392b",
  },
  "brasileirao": {
    emoji: "🇧🇷",
    nameEn: "Brasileirão",
    nameKo: "브라질레이랑",
    countryEn: "Brazil",
    countryKo: "브라질",
    season: CAL_SEASON,
    accentColor: "#059669",
  },
  "scottish-premiership": {
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    nameEn: "Scottish Premiership",
    nameKo: "스코티시 프리미어십",
    countryEn: "Scotland",
    countryKo: "스코틀랜드",
    season: EURO_SEASON,
    accentColor: "#003380",
  },
};

const tabs = {
  en: ["Overview", "Fixtures", "Results", "Standings"],
  ko: ["개요", "일정", "결과", "순위표"],
};

const tabPaths = ["", "fixtures", "results", "standings"];

const FALLBACK_LEAGUE = {
  emoji: "⚽",
  nameEn: "Football League",
  nameKo: "축구 리그",
  countryEn: "International",
  countryKo: "국제",
  season: EURO_SEASON,
  accentColor: "#059669",
};

export default function LeagueHeader({ slug, locale, activeTab = 0 }: LeagueHeaderProps) {
  const staticData = leagueData[slug] ?? FALLBACK_LEAGUE;
  // Merge real logo from LEAGUE_BY_SLUG (has CDN URLs) into local data
  const constants = LEAGUE_BY_SLUG[slug];
  const accentColor = staticData.accentColor;
  const logoUrl = constants?.logo ?? null;
  const flagEmoji = constants?.flag ?? staticData.emoji;

  const isKo = locale === "ko";
  const name = isKo ? staticData.nameKo : staticData.nameEn;
  const country = isKo ? staticData.countryKo : staticData.countryEn;
  const seasonLabel = isKo ? `${staticData.season} 시즌` : `${staticData.season} Season`;
  const tabLabels = tabs[locale];

  return (
    <header className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Accent color stripe */}
      <div style={{ height: 4, backgroundColor: accentColor }} />

      {/* Main content */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-4 mb-5">
          {/* League logo */}
          {logoUrl ? (
            <LeagueLogo
              logo={logoUrl}
              name={name}
              flag={flagEmoji}
              size={56}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-4xl shrink-0 border border-gray-100"
              style={{ backgroundColor: accentColor + "12" }}
            >
              {flagEmoji}
            </div>
          )}

          {/* League info */}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black text-gray-900 leading-tight m-0">
              {name}
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                {flagEmoji} {country}
              </span>

              <span className="text-gray-200 text-xs">·</span>

              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                {seasonLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex border-t border-gray-100 -mx-6 px-6 gap-0 overflow-x-auto">
          {tabLabels.map((label, idx) => {
            const tabSlug = tabPaths[idx];
            const href = tabSlug
              ? `/${locale}/league/${slug}/${tabSlug}`
              : `/${locale}/league/${slug}`;

            const isActive = idx === activeTab;
            return (
              <a
                key={label}
                href={href}
                className={`inline-block px-4 py-3 text-sm font-semibold no-underline border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-emerald-700 border-emerald-600"
                    : "text-gray-500 border-transparent hover:text-emerald-700 hover:border-emerald-400"
                }`}
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
