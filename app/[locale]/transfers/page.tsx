import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { TEAMS_BY_LEAGUE } from "@/lib/football/teamRegistry";
import { DEFAULTS, PERIODS, Q_MAX, SORTS, TYPE_FILTERS, readParams, transfersHref, type PeriodKey, type SortKey, type TransferParams, type TypeFilter } from "@/lib/football/transfers";
import { TRANSFER_LEAGUES, teamLeagueOf } from "@/lib/football/transfers-query";
import TransferResults, { ResultsSkeleton, scopeLabel } from "@/components/transfers/TransferResults";
import TransferFilters from "@/components/transfers/TransferFilters";

// Transfer Center: recorded transfers from API-Football for the teams KickVista registers under five
// leagues. Stays noindex until a real provider response has been checked.
// "All leagues" loads up to 96 teams on a cold cache, so the function may need longer than the default.
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata({
    locale: locale as Locale,
    title: locale === "ko" ? "이적 센터" : "Transfer Center",
    description: locale === "ko"
      ? "KickVista 등록 팀의 이적 기록을 리그·팀·기간·유형별로 살펴봅니다. 출처: API-Football."
      : "Browse recorded transfers of KickVista's registered teams by league, team, period and type. Source: API-Football.",
    path: "/transfers",
    noIndex: true,
  });
}

const L = {
  ko: {
    title: "이적 센터",
    subtitle: "API-Football 이적 기록을 KickVista 등록 팀 기준으로 모아 봅니다.",
    leagues: "리그", allLeagues: "5개 리그 전체",
    period: "기간", type: "유형", sort: "정렬",
    periods: { "30d": "30일", "90d": "90일", "180d": "6개월", "1y": "1년", "2y": "2년" } as Record<PeriodKey, string>,
    types: { all: "전체", fee: "이적료", transfer: "이적(금액 미표기)", free: "자유 계약", loan: "임대", "loan-return": "임대 복귀", none: "금액 미공개·정보 없음" } as Record<TypeFilter, string>,
    sorts: { latest: "최신순", fee: "이적료순" } as Record<SortKey, string>,
    filters: "필터", team: "팀", allTeams: "모든 팀", search: "선수·팀 검색", searchPh: "예: 손흥민, Arsenal", apply: "적용", reset: "초기화",
    about: "데이터 안내",
    aboutShort: "출처 API-Football 이적 기록. 구단 공식 발표를 확인한 정보가 아니며, 최근 이적은 늦게 반영될 수 있습니다.",
    aboutItems: [
      "출처: API-Football 이적 기록(/transfers). 구단 공식 발표를 KickVista가 직접 확인한 정보가 아닙니다.",
      "범위: KickVista에 등록된 5개 리그 팀(96개)과 연결된 이적만 보여 줍니다. 전 세계 모든 이적이 아닙니다.",
      "리그 구분: 현재 KickVista 팀 목록의 리그 기준입니다. 이적 당시 그 팀이 속했던 리그가 아니며, 등록 팀 목록은 시즌마다 자동으로 바뀌지 않습니다.",
      "반영 지연: 공급자는 주 몇 차례 갱신하고, KickVista는 팀별 기록을 최대 12시간 저장해 두고 씁니다. 최근 이적은 늦게 나타날 수 있습니다.",
      "보관 범위: 조회 시점 기준 최근 2년. 이적일은 공급자가 준 날짜 그대로이며 시각·시간대 변환이 없습니다.",
      "이적료: 공급자 표기를 그대로 해석합니다. 표기가 없으면 '정보 없음'이며, 0원이나 자유 계약으로 바꾸지 않습니다. 나이·포지션·계약 기간·기사 출처는 제공되지 않습니다.",
    ],
  },
  en: {
    title: "Transfer Center",
    subtitle: "API-Football transfer records for the teams registered on KickVista.",
    leagues: "Leagues", allLeagues: "All 5 leagues",
    period: "Period", type: "Type", sort: "Sort",
    periods: { "30d": "30 days", "90d": "90 days", "180d": "6 months", "1y": "1 year", "2y": "2 years" } as Record<PeriodKey, string>,
    types: { all: "All", fee: "Fee", transfer: "Transfer (no fee)", free: "Free transfer", loan: "Loan", "loan-return": "End of loan", none: "Undisclosed / not available" } as Record<TypeFilter, string>,
    sorts: { latest: "Latest", fee: "Highest fee" } as Record<SortKey, string>,
    filters: "Filters", team: "Team", allTeams: "All teams", search: "Search players or teams", searchPh: "e.g. Son, Arsenal", apply: "Apply", reset: "Reset",
    about: "About this data",
    aboutShort: "Source: API-Football transfer records. Not checked against club announcements; recent moves can appear late.",
    aboutItems: [
      "Source: API-Football transfer records (/transfers). KickVista has not checked them against club announcements.",
      "Coverage: only transfers involving the 96 teams KickVista registers in five leagues — not every transfer worldwide.",
      "Leagues: based on KickVista's current team list, not the league a club was in at the time of the transfer. The team list is not updated automatically each season.",
      "Delay: the provider updates a few times a week and KickVista keeps each team's records for up to 12 hours, so recent moves can appear late.",
      "Kept: the last 2 years as of each fetch. Dates are shown exactly as provided, with no time or time-zone conversion.",
      "Fees: read from the provider's text. Missing values stay 'Not available' and are never shown as zero or a free transfer. Age, position, contract length and article sources are not provided.",
    ],
  },
};

function Chip({ href, active, children, data }: { href: string; active: boolean; children: React.ReactNode; data?: string }) {
  return (
    <a href={href} aria-current={active ? "page" : undefined} data-transfers-chip={data}
      className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700"}`}>
      {children}
    </a>
  );
}

export default async function TransfersPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale; const isKo = loc === "ko"; const tx = L[loc];

  // URL first: unknown values, repeated keys, a team outside its league, a bad page → canonical URL (307).
  const { params: p, rewrite } = readParams(await searchParams, TRANSFER_LEAGUES, teamLeagueOf);
  if (rewrite) redirect(transfersHref(loc, p));

  // Every control below starts again from page 1.
  const to = (patch: Partial<TransferParams>) => transfersHref(loc, { ...p, ...patch, page: 1 });
  const teamLeagues = p.league === "all" ? TRANSFER_LEAGUES : [p.league as (typeof TRANSFER_LEAGUES)[number]];
  const leagueName = (l: (typeof TRANSFER_LEAGUES)[number]) => (isKo ? LEAGUE_BY_SLUG[l].nameKo : LEAGUE_BY_SLUG[l].name);
  type Row = { label: string; chips: { key: string; label: string; href: string; active: boolean }[] };
  const filterRows: Row[] = [
    { label: tx.period, chips: (Object.keys(PERIODS) as PeriodKey[]).map((k) => ({ key: `period:${k}`, label: tx.periods[k], href: to({ period: k }), active: p.period === k })) },
    { label: tx.type, chips: TYPE_FILTERS.map((k) => ({ key: `type:${k}`, label: tx.types[k], href: to({ type: k }), active: p.type === k })) },
  ];
  const sortRow: Row = { label: tx.sort, chips: SORTS.map((k) => ({ key: `sort:${k}`, label: tx.sorts[k], href: to({ sort: k }), active: p.sort === k })) };
  const renderRow = (row: Row, labelClass = "") => (
    <div className="flex min-w-0 items-center gap-2">
      <span className={`w-10 shrink-0 text-xs font-semibold text-gray-500 ${labelClass}`}>{row.label}</span>
      <div role="group" aria-label={row.label} className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {row.chips.map((c) => <Chip key={c.key} href={c.href} active={c.active} data={c.key}>{c.label}</Chip>)}
      </div>
    </div>
  );
  // Phones: what the collapsed panel currently holds.
  const teamEntry = p.team ? TEAMS_BY_LEAGUE[p.league]?.find((t) => t.slug === p.team) : undefined;
  const activeCount = [p.period !== DEFAULTS.period, p.type !== DEFAULTS.type, !!p.team, !!p.q].filter(Boolean).length;
  const summary = [tx.periods[p.period], tx.types[p.type], teamEntry ? (isKo ? teamEntry.nameKo : teamEntry.nameEn) : tx.allTeams, ...(p.q ? [`“${p.q}”`] : [])].join(" · ");

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-5 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-0.5 h-6 rounded-full bg-emerald-600 shrink-0" />
            <h1 className="text-2xl font-black text-gray-900">{tx.title}</h1>
          </div>
          {/* Phones skip the subtitle: the source note above the list says the same, and the list stays on the first screen */}
          <p className="hidden text-sm text-gray-500 ml-3.5 sm:block">{tx.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4">
        {/* Scope: leagues (scrolls sideways on phones) */}
        <nav aria-label={tx.leagues} className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }} data-transfers-leagues="">
          <Chip href={transfersHref(loc, { ...p, league: "all", team: null, page: 1 })} active={p.league === "all"} data="league:all">{tx.allLeagues}</Chip>
          {TRANSFER_LEAGUES.map((l) => (
            <Chip key={l} href={transfersHref(loc, { ...p, league: l, team: null, page: 1 })} active={p.league === l && !p.team} data={`league:${l}`}>{leagueName(l)}</Chip>
          ))}
        </nav>

        {/* Team + search + period + type: always shown from sm up; behind a "Filters" button on phones */}
        <TransferFilters label={tx.filters} activeCount={activeCount} summary={summary} sortRow={renderRow(sortRow, "hidden sm:inline")}>
          {/* Team + search: a plain GET form, so the URL holds the state */}
          <form action={`/${loc}/transfers`} method="get" role="search" className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-end" data-transfers-form="">
            {p.league !== DEFAULTS.league && <input type="hidden" name="league" value={p.league} />}
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-gray-600 sm:w-56">
              {tx.team}
              <select name="team" defaultValue={p.team ?? ""} className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-normal text-gray-800 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
                <option value="">{tx.allTeams}</option>
                {teamLeagues.map((l) => (
                  <optgroup key={l} label={leagueName(l)}>
                    {(TEAMS_BY_LEAGUE[l] ?? []).map((t) => <option key={t.slug} value={t.slug}>{isKo ? t.nameKo : t.nameEn}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            {/* Field order = canonical URL order (league, team, period, type, sort, q) */}
            {p.period !== DEFAULTS.period && <input type="hidden" name="period" value={p.period} />}
            {p.type !== DEFAULTS.type && <input type="hidden" name="type" value={p.type} />}
            {p.sort !== DEFAULTS.sort && <input type="hidden" name="sort" value={p.sort} />}
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-gray-600">
              {tx.search}
              <input type="search" name="q" defaultValue={p.q} maxLength={Q_MAX} placeholder={tx.searchPh} autoComplete="off"
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-normal text-gray-800 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200" />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 sm:flex-none">{tx.apply}</button>
              <a href={transfersHref(loc, { league: p.league, team: null, period: DEFAULTS.period, type: DEFAULTS.type, sort: DEFAULTS.sort, q: "", page: 1 })}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-600 hover:text-gray-900 sm:flex-none" data-transfers-reset="">{tx.reset}</a>
            </div>
          </form>
          {filterRows.map((row) => <div key={row.label}>{renderRow(row)}</div>)}
        </TransferFilters>

        <details className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm" data-transfers-about="">
          <summary className="cursor-pointer text-sm font-bold text-gray-800">
            {tx.about} <span className="font-normal text-gray-500">({scopeLabel(p, isKo)})</span>
            {/* Inside the summary so it stays visible while collapsed: source and its limits */}
            <span className="mt-1 block text-xs font-normal text-gray-600" data-transfers-source-note="">{tx.aboutShort}</span>
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 leading-relaxed">
            {tx.aboutItems.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </details>

        <Suspense key={transfersHref(loc, p)} fallback={<ResultsSkeleton loc={loc} />}>
          <TransferResults loc={loc} p={p} />
        </Suspense>
      </div>
    </main>
  );
}
