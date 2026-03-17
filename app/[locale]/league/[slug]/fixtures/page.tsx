import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildLeagueMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug } from "@/lib/football/types";
import { queryLeagueFixtures } from "@/lib/football/query";
import { fixturesToMatches } from "@/lib/football/adapters";
import LeagueHeader from "@/components/league/LeagueHeader";
import FixturesTabView from "@/components/match/FixturesTabView";
import AdSlot from "@/components/ads/AdSlot";
import {
  ALL_VALID_LEAGUE_URL_SLUGS,
  LEAGUE_URL_REDIRECTS,
  resolveLeagueUrlSlug,
} from "@/lib/football/slugs";

function isValidLeagueUrlSlug(value: string): boolean {
  return ALL_VALID_LEAGUE_URL_SLUGS.includes(value);
}

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  return locales.flatMap((locale) =>
    ALL_VALID_LEAGUE_URL_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) return {};
  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const base         = buildLeagueMetadata(loc, internalSlug);
  const suffix       = loc === "ko" ? " – 경기 일정" : " – Fixtures";
  return {
    ...base,
    title: typeof base.title === "string" ? base.title + suffix : base.title,
  };
}

const labels = {
  en: {
    pageTitle:    "Fixtures",
    pageSubtitle: "All scheduled, live, and completed matches",
    liveNow:      "Live now",
    round:        "Round",
  },
  ko: {
    pageTitle:    "경기 일정",
    pageSubtitle: "예정, 라이브, 완료된 모든 경기",
    liveNow:      "라이브 진행 중",
    round:        "라운드",
  },
};

export default async function LeagueFixturesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) notFound();

  if (LEAGUE_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/league/${LEAGUE_URL_REDIRECTS[slug]}/fixtures`);
  }

  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const t            = labels[loc];

  // Fetch all fixtures for the league via the provider abstraction
  const fixtures = await queryLeagueFixtures(internalSlug);
  const matches  = fixturesToMatches(fixtures, loc);

  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* League header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <LeagueHeader slug={internalSlug} locale={loc} />
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdSlot slotId={`league-${slug}-fixtures-top`} size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Page title bar */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 style={{ color: "#e6edf3", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {t.pageTitle}
            </h1>
            <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>{t.pageSubtitle}</p>
          </div>
          {liveCount > 0 && (
            <div
              className="flex items-center gap-2"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 999,
                padding: "6px 14px",
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: "#22c55e" }}
              />
              <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
                {liveCount} {t.liveNow}
              </span>
            </div>
          )}
        </div>

        {/* Tab-filtered match grid — client component handles interactivity */}
        <FixturesTabView matches={matches} locale={loc} />

        {/* Bottom ad */}
        <div className="mt-10">
          <AdSlot slotId={`league-${slug}-fixtures-bottom`} size="leaderboard" />
        </div>
      </div>
    </main>
  );
}
