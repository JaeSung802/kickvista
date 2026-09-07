import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import { queryHomeMatches, queryStandings } from "@/lib/football/query";
import { fixturesToMatches, standingsToRows } from "@/lib/football/adapters";

import { listHotPosts } from "@/lib/community/hotPosts";
import { QuickLinksBar } from "@/components/home/HomePageContent";
import HomePageContent, { type StandingsMap } from "@/components/home/HomePageContent";

// 홈 화면의 기본 재검증 주기: 5분
// API-Football 요청은 provider에 설정된 개별 next.revalidate 캐시를 따른다.
export const revalidate = 300;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({ locale: loc });
}

// ─── Async data fetcher (runs inside Suspense) ────────────────────────────────

async function HomeContent({ locale }: { locale: Locale }) {
  // allSettled: a slow or failing API (standings, hot posts) never blocks the
  // rest of the page — each result is checked individually.
  const [
    fixturesResult,
    plResult,
    laLigaResult,
    bundesResult,
    serieAResult,
    hotPostsResult,
  ] = await Promise.allSettled([
    queryHomeMatches(),
    queryStandings("premier-league"),
    queryStandings("la-liga"),
    queryStandings("bundesliga"),
    queryStandings("serie-a"),
    listHotPosts({ limit: 12 }),
  ]);

  const fixtures    = fixturesResult.status  === "fulfilled" ? fixturesResult.value  : [];
  const plStandings = plResult.status        === "fulfilled" ? plResult.value        : null;
  const laLiga      = laLigaResult.status    === "fulfilled" ? laLigaResult.value    : null;
  const bundesliga  = bundesResult.status    === "fulfilled" ? bundesResult.value    : null;
  const serieA      = serieAResult.status    === "fulfilled" ? serieAResult.value    : null;
  const hotPosts    = hotPostsResult.status  === "fulfilled" ? hotPostsResult.value.posts : [];

  const standingsData: StandingsMap = {
    ...(plStandings && { "premier-league": standingsToRows(plStandings) }),
    ...(laLiga      && { "la-liga":        standingsToRows(laLiga) }),
    ...(bundesliga  && { "bundesliga":     standingsToRows(bundesliga) }),
    ...(serieA      && { "serie-a":        standingsToRows(serieA) }),
  };

  return (
    <HomePageContent
      locale={locale}
      matches={fixturesToMatches(fixtures, locale)}
      standingsData={standingsData}
      hotPosts={hotPosts}
    />
  );
}

// ─── Skeleton shown while HomeContent loads ───────────────────────────────────

function HomeContentSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
          {/* Left league rail skeleton — xl only */}
          <div className="hidden xl:block xl:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="shimmer h-10 w-full" />
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100">
                  <div className="shimmer h-5 w-5 rounded shrink-0" />
                  <div className="shimmer h-3 flex-1 rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* Center column skeleton */}
          <div className="lg:col-span-2 xl:col-span-6 flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="shimmer h-10 w-full" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
                    <div className="shimmer h-4 w-4 rounded-full shrink-0" />
                    <div className="shimmer h-3 flex-1 rounded" />
                    <div className="shimmer h-5 w-16 rounded mx-2" />
                    <div className="shimmer h-3 flex-1 rounded" />
                    <div className="shimmer h-4 w-4 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Right column skeleton */}
          <div className="lg:col-span-1 xl:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="shimmer h-10 w-full" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-50">
                  <div className="shimmer h-3 w-4 rounded shrink-0" />
                  <div className="shimmer h-4 w-4 rounded-full shrink-0" />
                  <div className="shimmer h-3 flex-1 rounded" />
                  <div className="shimmer h-3 w-6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc    = locale as Locale;
  const jsonLd = websiteJsonLd(loc);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* QuickLinksBar — hidden at xl where the league rail takes over */}
      <div className="xl:hidden">
        <QuickLinksBar locale={loc} />
      </div>
      {/* Data-dependent section streams in behind the skeleton */}
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent locale={loc} />
      </Suspense>
    </>
  );
}
