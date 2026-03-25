import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return buildMetadata({
    locale: loc,
    title:
      loc === "ko"
        ? query
          ? `"${query}" 검색 결과`
          : "검색"
        : query
        ? `Search results for "${query}"`
        : "Search",
    description:
      loc === "ko"
        ? "킥비스타에서 리그, 팀, 경기를 검색하세요."
        : "Search for leagues, teams, and matches on KickVista.",
    path: "/search",
    noIndex: true, // search results pages should not be indexed
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const loc   = locale as Locale;
  const isKo  = loc === "ko";
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const labels = {
    ko: {
      heading:        "검색",
      placeholder:    "리그, 팀, 경기 검색...",
      searchBtn:      "검색",
      noResults:      "검색 결과가 없습니다",
      noResultsHint:  `"${query}"에 대한 결과를 찾지 못했습니다. 다른 검색어를 입력해 보세요.`,
      emptyHint:      "리그명, 팀명, 또는 선수 이름으로 검색해 보세요.",
      backHome:       "홈으로 돌아가기",
      suggestions:    "이런 건 어떠세요?",
      suggestionItems: [
        { label: "프리미어리그 순위",    href: `/${loc}/league/premier-league/standings` },
        { label: "라리가 경기 일정",      href: `/${loc}/league/la-liga/fixtures` },
        { label: "AI 경기 분석",          href: `/${loc}/analysis` },
        { label: "팬 커뮤니티",           href: `/${loc}/community` },
      ],
    },
    en: {
      heading:        "Search",
      placeholder:    "Search leagues, teams, matches...",
      searchBtn:      "Search",
      noResults:      "No results found",
      noResultsHint:  `We couldn't find anything for "${query}". Try a different search term.`,
      emptyHint:      "Try searching for a league, team, or player name.",
      backHome:       "Back to Home",
      suggestions:    "Try these instead",
      suggestionItems: [
        { label: "Premier League Standings", href: `/${loc}/league/premier-league/standings` },
        { label: "La Liga Fixtures",          href: `/${loc}/league/la-liga/fixtures` },
        { label: "AI Match Analysis",         href: `/${loc}/analysis` },
        { label: "Fan Community",             href: `/${loc}/community` },
      ],
    },
  };

  const tx = labels[loc];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Search header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-black text-gray-900 mb-5">{tx.heading}</h1>

          {/* Search bar */}
          <form action={`/${loc}/search`} method="GET">
            <div className="flex gap-2">
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder={tx.placeholder}
                autoFocus
                className="flex-1 h-11 px-4 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
              <button
                type="submit"
                className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
              >
                {tx.searchBtn}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* No results / empty state */}
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-4xl">
            {query ? "🔍" : "⚽"}
          </div>

          {/* Heading + hint */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-gray-900">
              {query ? tx.noResults : tx.heading}
            </h2>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              {query ? tx.noResultsHint : tx.emptyHint}
            </p>
          </div>

          {/* Return to Home — primary CTA */}
          <a
            href={`/${loc}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-7 py-3 rounded-xl transition-colors shadow-sm"
          >
            ← {tx.backHome}
          </a>

          {/* Suggestion links */}
          <div className="w-full max-w-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {tx.suggestions}
            </p>
            <div className="flex flex-col gap-2">
              {tx.suggestionItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors no-underline group"
                >
                  <span>{item.label}</span>
                  <span className="text-gray-300 group-hover:text-emerald-500 transition-colors">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
