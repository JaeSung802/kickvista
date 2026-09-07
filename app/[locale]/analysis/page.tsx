import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import AnalysisCard from "@/components/analysis/AnalysisCard";
import AdBanner from "@/components/ads/AdBanner";
import { listAnalyses } from "@/lib/analysis/db";
import { getFootballProvider } from "@/lib/football/provider";
import { SUPPORTED_LEAGUES, currentFootballSeason } from "@/lib/football/constants";
import { buildSlug } from "@/lib/ai-analysis";
import type { MatchAnalysis } from "@/lib/ai-analysis";
import type { League } from "@/lib/football/types";

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
    title: loc === "ko" ? "AI 경기 분석 & 인사이트" : "AI Match Analysis & Insights",
    description:
      loc === "ko"
        ? "AI가 분석한 프리미어리그, 라리가, 분데스리가, 세리에 A 경기 인사이트 및 전술 분석."
        : "AI-powered match previews, tactical breakdowns and data insights for Premier League, La Liga, Bundesliga, Serie A and more.",
    path: "/analysis",
  });
}

// ─── Real fixture fallback (when DB has no analyses yet) ──────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getRealFixtureCards(locale: Locale): Promise<MatchAnalysis[]> {
  const provider = getFootballProvider();
  const season = currentFootballSeason();
  const isKo = locale === "ko";
  const results: MatchAnalysis[] = [];

  await Promise.all(
    SUPPORTED_LEAGUES.slice(0, 5).map(async (league: League) => {
      try {
        const [upcomingR, recentR] = await Promise.allSettled([
          provider.fetchFixturesNext(league.id, season, 2),
          provider.fetchFixturesLast(league.id, season, 2),
        ]);
        const upcoming = upcomingR.status === "fulfilled" ? upcomingR.value : [];
        const recent   = recentR.status   === "fulfilled" ? recentR.value   : [];

        const leagueName = isKo ? league.nameKo : league.name;

        for (const f of upcoming) {
          const home = f.homeTeam.name;
          const away = f.awayTeam.name;
          const matchDate = new Date(f.date).toLocaleDateString(
            isKo ? "ko-KR" : "en-GB",
            { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
          );
          results.push({
            id: `fixture-preview-${f.id}`,
            fixtureId: f.id,
            type: "preview",
            locale,
            title: isKo ? `${home} vs ${away} 프리뷰` : `${home} vs ${away} Match Preview`,
            slug: buildSlug(home, away, f.date, "preview"),
            summary: isKo
              ? `${leagueName} 경기 — ${matchDate}. AI 분석은 킥오프 24시간 전 자동으로 생성됩니다.`
              : `${leagueName} fixture on ${matchDate}. AI analysis is generated automatically 24 hours before kick-off.`,
            insight: "",
            prediction: undefined,
            keyFactors: [
              { icon: "🏟️", label: "League", labelKo: "리그", value: league.name, valueKo: league.nameKo },
              { icon: "📅", label: "Kick-off", labelKo: "킥오프", value: matchDate, valueKo: matchDate },
            ],
            tips: [],
            aiModel: "KickVista AI",
            generatedAt: f.date,
            disclaimer: isKo
              ? "AI 분석은 오락 목적으로만 제공됩니다. 과거 성과는 미래 결과를 보장하지 않습니다."
              : "AI predictions are for entertainment purposes only. Past performance does not guarantee future results.",
            isAiGenerated: false,
          });
        }

        for (const f of recent) {
          const home = f.homeTeam.name;
          const away = f.awayTeam.name;
          const score = `${f.homeScore ?? 0}–${f.awayScore ?? 0}`;
          const matchDate = new Date(f.date).toLocaleDateString(
            isKo ? "ko-KR" : "en-GB",
            { month: "long", day: "numeric" }
          );
          results.push({
            id: `fixture-recap-${f.id}`,
            fixtureId: f.id,
            type: "recap",
            locale,
            title: isKo
              ? `${home} ${score} ${away} — 경기 리캡`
              : `${home} ${score} ${away} — Match Recap`,
            slug: buildSlug(home, away, f.date, "recap"),
            summary: isKo
              ? `${leagueName} — ${matchDate}. AI 리캡이 생성되는 중입니다. 잠시 후 다시 확인하세요.`
              : `${leagueName} — ${matchDate}. AI recap is being generated. Check back shortly.`,
            insight: "",
            prediction: undefined,
            keyFactors: [
              { icon: "📊", label: "Final Score", labelKo: "최종 스코어", value: score, valueKo: score },
              { icon: "🏟️", label: "League", labelKo: "리그", value: league.name, valueKo: league.nameKo },
            ],
            tips: [],
            aiModel: "KickVista AI",
            generatedAt: f.date,
            disclaimer: isKo
              ? "AI 분석은 오락 목적으로만 제공됩니다. 과거 성과는 미래 결과를 보장하지 않습니다."
              : "AI predictions are for entertainment purposes only. Past performance does not guarantee future results.",
            isAiGenerated: false,
          });
        }
      } catch {
        // Skip leagues that fail silently
      }
    })
  );

  return results.slice(0, 12);
}

// ─── Supported leagues info ───────────────────────────────────────────────────

const ABOUT_LEAGUES = [
  { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", en: "Premier League",    ko: "프리미어리그" },
  { flag: "🇪🇸",          en: "La Liga",           ko: "라리가" },
  { flag: "🇩🇪",          en: "Bundesliga",        ko: "분데스리가" },
  { flag: "🇮🇹",          en: "Serie A",           ko: "세리에 A" },
  { flag: "🇫🇷",          en: "Ligue 1",           ko: "리그 1" },
  { flag: "🌍",           en: "Champions League",  ko: "챔피언스리그" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalysisListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const { type: typeParam } = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";
  const activeType = typeParam === "preview" || typeParam === "recap" ? typeParam : undefined;

  // Load from DB; fall back to real fixture cards if empty
  let analyses: MatchAnalysis[] = await listAnalyses(loc, activeType, 12);
  const fromDb = analyses.length > 0;

  if (!fromDb) {
    const real = await getRealFixtureCards(loc);
    analyses = activeType ? real.filter((a) => a.type === activeType) : real;
  }

  const labels = {
    en: {
      pageTitle:    "AI Match Analysis",
      pageSubtitle: "Data-driven insights for every major league fixture",
      poweredBy:    "KickVista AI",
      countBadge:   (n: number) => `${n} analyses`,
      filterAll:     "All",
      filterPreview: "Previews",
      filterRecap:   "Recaps",
      latestAnalyses: "Latest Analyses",
      aboutTitle:    "About KickVista AI",
      howItWorksTitle: "How It Works",
      howItWorksDesc:  "We analyze structured match data including team form, head-to-head records, and statistical trends to generate objective, data-driven insights.",
      supportedLeagues: "Supported Leagues",
      updateSchedule:   "Update Schedule",
      updatePreview:    "Previews published 24h before kick-off",
      updateRecap:      "Recaps generated 2h after full-time",
      updateLive:       "Live predictions refreshed every hour",
    },
    ko: {
      pageTitle:    "AI 경기 분석",
      pageSubtitle: "주요 리그 모든 경기를 위한 데이터 기반 인사이트",
      poweredBy:    "KickVista AI",
      countBadge:   (n: number) => `${n}개 분석`,
      filterAll:     "전체",
      filterPreview: "프리뷰",
      filterRecap:   "리캡",
      latestAnalyses: "최신 분석",
      aboutTitle:    "KickVista AI 소개",
      howItWorksTitle: "작동 방식",
      howItWorksDesc:  "팀 폼, 상대 전적, 통계 트렌드 등 구조화된 경기 데이터를 분석하여 객관적이고 데이터 기반의 인사이트를 제공합니다.",
      supportedLeagues: "지원 리그",
      updateSchedule:   "업데이트 일정",
      updatePreview:    "프리뷰: 킥오프 24시간 전 게재",
      updateRecap:      "리캡: 경기 종료 2시간 후 생성",
      updateLive:       "라이브 분석: 매시간 업데이트",
    },
  };

  const t = labels[loc];

  const filterTabs = [
    { label: t.filterAll,     href: `/${loc}/analysis`,              active: !activeType },
    { label: t.filterPreview, href: `/${loc}/analysis?type=preview`, active: activeType === "preview" },
    { label: t.filterRecap,   href: `/${loc}/analysis?type=recap`,   active: activeType === "recap" },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* ── Page hero ── */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold text-emerald-700">
              ✨ {t.poweredBy}
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{t.pageTitle}</h1>
              <span className="shrink-0 mt-1.5 px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full">
                {t.countBadge(analyses.length)}
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-md">{t.pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner slot="analysis" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filter tabs + section title */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <h2 className="text-xl font-extrabold text-gray-900">{t.latestAnalyses}</h2>
          <div className="flex items-center gap-1 flex-wrap bg-white border border-gray-200 rounded-lg p-1">
            {filterTabs.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab.active
                    ? "bg-emerald-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>

        {/* Analysis grid */}
        {analyses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm">
              {isKo ? "아직 분석이 없습니다." : "No analyses yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {analyses.slice(0, 3).map((item) => (
                <AnalysisCard
                  key={item.id}
                  title={item.title}
                  summary={item.summary}
                  prediction={item.prediction
                    ? { ...item.prediction, labelKo: item.prediction.label }
                    : undefined}
                  keyFactors={item.keyFactors}
                  aiModel={item.aiModel}
                  generatedAt={item.generatedAt}
                  disclaimer={item.disclaimer}
                  type={item.type}
                  locale={loc}
                  slug={item.slug}
                  isAiGenerated={item.isAiGenerated}
                  fixtureId={item.fixtureId}
                />
              ))}
            </div>

            {analyses.length > 3 && (
              <>
                <div className="my-8">
                  <AdBanner slot="analysis" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analyses.slice(3).map((item) => (
                    <AnalysisCard
                      key={item.id}
                      title={item.title}
                      summary={item.summary}
                      prediction={item.prediction
                        ? { ...item.prediction, labelKo: item.prediction.label }
                        : undefined}
                      keyFactors={item.keyFactors}
                      aiModel={item.aiModel}
                      generatedAt={item.generatedAt}
                      disclaimer={item.disclaimer}
                      type={item.type}
                      locale={loc}
                      slug={item.slug}
                      isAiGenerated={item.isAiGenerated}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* About KickVista AI */}
        <section className="mt-16 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2.5 px-7 py-5 border-b border-gray-100 bg-gray-50">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-extrabold text-gray-900">{t.aboutTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🧠</span>
                <h3 className="text-sm font-bold text-gray-800">{t.howItWorksTitle}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{t.howItWorksDesc}</p>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏆</span>
                <h3 className="text-sm font-bold text-gray-800">{t.supportedLeagues}</h3>
              </div>
              <div className="flex flex-col gap-1.5">
                {ABOUT_LEAGUES.map((league) => (
                  <div key={league.en} className="flex items-center gap-2">
                    <span className="text-sm">{league.flag}</span>
                    <span className="text-xs text-gray-500">{isKo ? league.ko : league.en}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🕐</span>
                <h3 className="text-sm font-bold text-gray-800">{t.updateSchedule}</h3>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: "🔮", text: t.updatePreview },
                  { icon: "📊", text: t.updateRecap },
                  { icon: "⚡", text: t.updateLive },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="text-xs text-gray-500 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <AdBanner slot="analysis" />
        </div>
      </div>
    </main>
  );
}
