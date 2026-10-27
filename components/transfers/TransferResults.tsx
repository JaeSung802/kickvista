import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { LEAGUE_BY_SLUG } from "@/lib/football/constants";
import { TEAM_REGISTRY, getTeamNameKo, type TeamEntry } from "@/lib/football/teamRegistry";
import {
  PAGE_SIZE, applyView, formatPlainDate, kstToday, pageCount, transfersHref,
  type TransferItem, type TransferKind, type TransferParams, type TransferTeam,
} from "@/lib/football/transfers";
import { loadTransferScope, scopeTeams } from "@/lib/football/transfers-query";
import TeamLogo from "./TeamLogo";

// ─── names, links, labels ─────────────────────────────────────────────────────

const BY_ID = new Map<number, TeamEntry>(Object.values(TEAM_REGISTRY).map((t) => [t.id, t]));

function teamName(t: TransferTeam, isKo: boolean): string {
  const reg = BY_ID.get(t.id);
  if (isKo) return reg?.nameKo ?? getTeamNameKo(t.name) ?? t.name;
  return t.name;
}
/** Korean names used by search in addition to the provider's names. */
function koNames(t: TransferTeam): string[] {
  const n = BY_ID.get(t.id)?.nameKo ?? getTeamNameKo(t.name);
  return n ? [n] : [];
}

const KIND: Record<TransferKind, { ko: string; en: string; cls: string }> = {
  fee:           { ko: "이적료",    en: "Fee",           cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  transfer:      { ko: "이적",      en: "Transfer",      cls: "bg-teal-50 text-teal-700 border-teal-200" },
  free:          { ko: "자유 계약", en: "Free transfer", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  loan:          { ko: "임대",      en: "Loan",          cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "loan-return": { ko: "임대 복귀", en: "End of loan",   cls: "bg-violet-50 text-violet-700 border-violet-200" },
  undisclosed:   { ko: "금액 미공개", en: "Undisclosed fee", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  unknown:       { ko: "정보 없음", en: "Not available", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  other:         { ko: "기타",      en: "Other",         cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

/** What the fee column says. A fee string that could not be read is shown as given, never as a number. */
function feeText(t: TransferItem, isKo: boolean): { main: string; note: string | null } {
  if (t.kind === "fee") return t.fee ? { main: t.fee.label, note: null } : { main: t.rawType ?? "", note: isKo ? "금액 형식 확인 불가" : "Amount format not recognised" };
  if (t.kind === "other") return { main: t.rawType ?? "", note: isKo ? "공급자 표기 그대로" : "As given by the provider" };
  return { main: isKo ? KIND[t.kind].ko : KIND[t.kind].en, note: null };
}

function kstDateTime(iso: string, isKo: boolean): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString();
  return `${formatPlainDate(d.slice(0, 10), isKo)} ${d.slice(11, 16)} KST`;
}

const T = {
  ko: {
    count: (n: number) => `${n.toLocaleString("ko-KR")}건`,
    partialTitle: (failed: number, total: number) => `팀 ${total}개 중 ${failed}개의 기록을 불러오지 못했습니다.`,
    partialBody: "아래 목록은 불러온 팀의 기록만 담고 있어 전체가 아닙니다. 그래서 건수를 표시하지 않습니다.",
    failedTeams: "불러오지 못한 팀",
    errorTitle: "이적 기록을 불러오지 못했습니다.",
    errorBody: (n: number) => `선택한 범위의 팀 ${n}개 모두 데이터 공급자 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.`,
    retry: "다시 시도",
    unavailableTitle: "지금은 이적 기록을 제공할 수 없습니다.",
    unavailableBody: "이적 데이터 공급자가 연결되어 있지 않습니다.",
    emptyTitle: "조건에 맞는 이적이 없습니다.",
    emptyBody: "기간을 늘리거나 유형·검색어를 지워 보세요.",
    clearSearch: "검색어 지우기",
    longerPeriod: "최근 2년으로 보기",
    searchScope: (q: string, scope: string) => `‘${q}’ 검색 결과 — ${scope}에서 불러온 기록 안에서만 찾았습니다.`,
    feeSort: "이적료순은 유로(€)로 표시된 금액끼리만 비교합니다. 다른 통화(£, $)와 금액을 알 수 없는 이적은 그 뒤에 최신순으로 이어집니다. 환율 변환은 하지 않습니다.",
    lastFetched: (t: string) => `마지막 데이터 조회: ${t} (가장 오래 전에 조회한 팀 기준)`,
    dropped: (n: number) => `날짜가 없거나 이전 팀과 새 팀이 같은 기록 ${n}건은 제외했습니다.`,
    date: "이적일", player: "선수", move: "이동", type: "유형·이적료",
    upcoming: "예정",
    merged: (n: number) => `같은 이적으로 보이는 공급자 기록 ${n}건을 묶어 표시`,
    noType: "유형 없음",
    noFee: "금액 미표기",
    noName: "이름 정보 없음",
    noTeam: "팀 정보 없음",
    prev: "이전", next: "다음", pagination: "페이지",
    page: (a: number, b: number) => `${a} / ${b} 페이지`,
    pageNoTotal: (a: number) => `${a} 페이지`,
    teamLink: (n: string) => `${n} 팀 페이지`,
    loading: "이적 기록을 불러오는 중…",
  },
  en: {
    count: (n: number) => `${n.toLocaleString("en-GB")} transfers`,
    partialTitle: (failed: number, total: number) => `Records for ${failed} of ${total} teams could not be loaded.`,
    partialBody: "The list below only covers the teams that loaded, so it is not complete and no total is shown.",
    failedTeams: "Teams not loaded",
    errorTitle: "Transfer records could not be loaded.",
    errorBody: (n: number) => `The data provider did not answer for any of the ${n} teams in this selection. Try again in a moment.`,
    retry: "Try again",
    unavailableTitle: "Transfer records are not available right now.",
    unavailableBody: "No transfer data provider is connected.",
    emptyTitle: "No transfers match these filters.",
    emptyBody: "Try a longer period, or clear the type or search.",
    clearSearch: "Clear search",
    longerPeriod: "Show the last 2 years",
    searchScope: (q: string, scope: string) => `Results for “${q}” — searched only within the records loaded for ${scope}.`,
    feeSort: "Fee order compares euro (€) amounts only. Other currencies (£, $) and transfers without a readable amount follow, newest first. No currency conversion is applied.",
    lastFetched: (t: string) => `Data last fetched: ${t} (oldest team in this view)`,
    dropped: (n: number) => `${n} records without a date, or with the same club as both teams, were left out.`,
    date: "Date", player: "Player", move: "Move", type: "Type / fee",
    upcoming: "Scheduled",
    merged: (n: number) => `${n} provider records that look like one move, grouped for display`,
    noType: "no type",
    noFee: "No fee given",
    noName: "Name not available",
    noTeam: "Team not available",
    prev: "Previous", next: "Next", pagination: "Pages",
    page: (a: number, b: number) => `Page ${a} of ${b}`,
    pageNoTotal: (a: number) => `Page ${a}`,
    teamLink: (n: string) => `${n} team page`,
    loading: "Loading transfer records…",
  },
};

/** "Premier League · 20 registered teams" style description of the loaded scope. */
export function scopeLabel(p: TransferParams, isKo: boolean): string {
  if (p.team) { const t = TEAM_REGISTRY[p.team]; return t ? (isKo ? t.nameKo : t.nameEn) : ""; }
  const n = scopeTeams(p.league, null).length;
  if (p.league === "all") return isKo ? `5개 리그 등록 팀 ${n}개` : `${n} registered teams in 5 leagues`;
  const l = LEAGUE_BY_SLUG[p.league as keyof typeof LEAGUE_BY_SLUG];
  return isKo ? `${l.nameKo} 등록 팀 ${n}개` : `${n} registered ${l.name} teams`;
}

// ─── pieces ───────────────────────────────────────────────────────────────────

function TeamCell({ team, loc }: { team: TransferTeam | null; loc: Locale }) {
  const isKo = loc === "ko";
  if (!team) return <span className="text-gray-400">{T[loc].noTeam}</span>;
  const name = teamName(team, isKo);
  const reg = BY_ID.get(team.id);
  const body = (
    <>
      <TeamLogo src={team.logo} name={name} />
      <span className="min-w-0 truncate">{name}</span>
    </>
  );
  // Only clubs with a KickVista team page are links.
  return reg
    ? <a href={`/${loc}/team/${reg.slug}`} aria-label={T[loc].teamLink(name)} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-gray-800 hover:text-emerald-700" data-transfer-team-link={reg.slug}>{body}</a>
    : <span className="inline-flex min-w-0 items-center gap-1.5 text-gray-700">{body}</span>;
}

function KindBadge({ t, loc }: { t: TransferItem; loc: Locale }) {
  const k = KIND[t.kind];
  return <span className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${k.cls}`} data-transfer-kind={t.kind}>{loc === "ko" ? k.ko : k.en}</span>;
}

function Row({ t, loc, today }: { t: TransferItem; loc: Locale; today: string }) {
  const isKo = loc === "ko";
  const fee = feeText(t, isKo);
  // Grouped provider records: every original date is shown (none is presented as "the" transfer date),
  // with a note that the grouping is for display and the original records on demand.
  const recs = t.records;
  const dates = recs ? [...new Set(recs.map((r) => r.date))] : [t.date];
  const date = (
    <span className={`tabular-nums ${recs ? "whitespace-normal" : "whitespace-nowrap"}`} data-transfer-date={t.date}>
      {dates.map((d) => formatPlainDate(d, isKo)).join(" / ")}
      {dates.some((d) => d > today) && <span className="ml-1 rounded bg-gray-100 px-1 text-[10px] font-semibold text-gray-500">{T[loc].upcoming}</span>}
      {recs && (
        <details className="mt-0.5 text-[10px] font-normal leading-tight text-gray-400" data-transfer-merged={recs.length}>
          <summary className="cursor-pointer">{T[loc].merged(recs.length)}</summary>
          <ul className="mt-0.5">
            {recs.map((r, i) => <li key={i}>{formatPlainDate(r.date, isKo)} · {r.rawType ?? T[loc].noType}</li>)}
          </ul>
        </details>
      )}
    </span>
  );
  return (
    <li className="border-b border-gray-100 last:border-b-0" data-transfer-row={t.key}>
      {/* desktop: one aligned row */}
      <div className="hidden md:grid md:grid-cols-[7.5rem_minmax(0,1.1fr)_minmax(0,2fr)_10rem] md:items-center md:gap-4 md:px-4 md:py-2.5 text-sm">
        <span className="text-xs text-gray-500">{date}</span>
        <span className="min-w-0 truncate font-semibold text-gray-900" data-transfer-player="">{t.playerName ?? <span className="font-normal text-gray-400">{T[loc].noName}</span>}</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex min-w-0 flex-1 basis-0"><TeamCell team={t.from} loc={loc} /></span>
          <span className="shrink-0 text-gray-400" aria-hidden="true">→</span>
          <span className="flex min-w-0 flex-1 basis-0"><TeamCell team={t.to} loc={loc} /></span>
        </span>
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="flex items-center gap-1.5"><KindBadge t={t} loc={loc} />{t.kind === "fee" && <span className="font-bold tabular-nums text-gray-900" data-transfer-fee="">{fee.main}</span>}{t.kind === "other" && <span className="truncate text-xs text-gray-600">{fee.main}</span>}{t.kind === "transfer" && <span className="text-xs text-gray-500">{T[loc].noFee}</span>}</span>
          {fee.note && <span className="text-[11px] text-gray-400">{fee.note}</span>}
        </span>
      </div>
      {/* mobile: player + type, direction, date + fee */}
      <div className="flex flex-col gap-1.5 px-4 py-3 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 break-words text-sm font-bold text-gray-900">{t.playerName ?? <span className="font-normal text-gray-400">{T[loc].noName}</span>}</span>
          <KindBadge t={t} loc={loc} />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 text-[13px]">
          <TeamCell team={t.from} loc={loc} />
          <span className="text-gray-400" aria-hidden="true">→</span>
          <TeamCell team={t.to} loc={loc} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-gray-500">
          {date}
          {(t.kind === "fee" || t.kind === "other") && <span className={t.kind === "fee" && t.fee ? "font-bold tabular-nums text-gray-900" : "text-gray-600"}>{fee.main}{fee.note && <span className="ml-1 font-normal text-gray-400">({fee.note})</span>}</span>}
        </div>
      </div>
    </li>
  );
}

function Box({ state, title, body, children }: { state: string; title: string; body?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div role={state === "error" || state === "unavailable" ? "alert" : "status"} data-transfers-state={state} className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-bold text-gray-800">{title}</p>
      {body && <p className="max-w-md text-[13px] leading-relaxed text-gray-500">{body}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm font-semibold">{children}</div>}
    </div>
  );
}

export function ResultsSkeleton({ loc }: { loc: Locale }) {
  return (
    <div aria-busy="true" data-transfers-state="loading" className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <p className="sr-only">{T[loc].loading}</p>
      <p className="px-4 pt-3 text-xs text-gray-400" aria-hidden="true">{T[loc].loading}</p>
      <ul className="animate-pulse motion-reduce:animate-none">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
            <span className="h-3 w-16 rounded bg-gray-100" /><span className="h-3 w-28 rounded bg-gray-100" /><span className="h-3 flex-1 rounded bg-gray-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── results ──────────────────────────────────────────────────────────────────

export default async function TransferResults({ loc, p }: { loc: Locale; p: TransferParams }) {
  const isKo = loc === "ko"; const tx = T[loc];
  const href = transfersHref(loc, p);
  const result = await loadTransferScope(scopeTeams(p.league, p.team));

  if (result.status === "unavailable") return <Box state="unavailable" title={tx.unavailableTitle} body={tx.unavailableBody} />;
  if (result.status === "error") {
    return (
      <Box state="error" title={tx.errorTitle} body={tx.errorBody(result.teams.length)}>
        <a href={href} className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">{tx.retry}</a>
      </Box>
    );
  }

  const today = kstToday();
  const view = applyView(result.items, p, today, koNames);
  const partial = result.status === "partial";
  const last = pageCount(view.length);
  if (p.page > last) redirect(transfersHref(loc, { ...p, page: last }));
  const rows = view.slice((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE);
  const scope = scopeLabel(p, isKo);

  const pageHref = (n: number) => transfersHref(loc, { ...p, page: n });
  // A partial result shows only previous/next: numbered pages would imply a complete total.
  const nums = partial ? [] : Array.from({ length: last }, (_, i) => i + 1).filter((n) => n === 1 || n === last || Math.abs(n - p.page) <= 2);

  return (
    <div className="flex flex-col gap-3" data-transfers-state={partial ? "partial" : view.length ? "ok" : "empty"} data-transfers-source={result.status}>
      {partial && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900" data-transfers-partial={`${result.failed.length}/${result.teams.length}`}>
          <p className="font-bold">{tx.partialTitle(result.failed.length, result.teams.length)}</p>
          <p className="mt-0.5">{tx.partialBody}</p>
          <p className="mt-1 text-xs text-amber-800">{tx.failedTeams}: {result.failed.map((t) => (isKo ? t.nameKo : t.nameEn)).join(", ")}</p>
          <a href={href} className="mt-1.5 inline-block text-xs font-bold text-amber-900 underline">{tx.retry}</a>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-gray-500">
        <span data-transfers-count={partial ? "" : String(view.length)}>
          {!partial && <strong className="mr-1.5 text-sm text-gray-800">{tx.count(view.length)}</strong>}
          {scope}
        </span>
        {result.oldestFetchedAt && <span data-transfers-fetched="">{tx.lastFetched(kstDateTime(result.oldestFetchedAt, isKo))}</span>}
      </div>
      {p.q && <p className="text-xs text-gray-600" data-transfers-search-scope="">{tx.searchScope(p.q, scope)}</p>}
      {p.sort === "fee" && <p className="text-xs text-gray-600" data-transfers-fee-note="">{tx.feeSort}</p>}

      {view.length === 0 ? (
        <Box state="empty" title={tx.emptyTitle} body={tx.emptyBody}>
          {p.q && <a href={transfersHref(loc, { ...p, q: "", page: 1 })} className="text-emerald-700 hover:text-emerald-800">{tx.clearSearch}</a>}
          {p.period !== "2y" && <a href={transfersHref(loc, { ...p, period: "2y", page: 1 })} className="text-emerald-700 hover:text-emerald-800">{tx.longerPeriod}</a>}
        </Box>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 md:grid md:grid-cols-[7.5rem_minmax(0,1.1fr)_minmax(0,2fr)_10rem] md:gap-4" aria-hidden="true">
            <span>{tx.date}</span><span>{tx.player}</span><span>{tx.move}</span><span>{tx.type}</span>
          </div>
          <ul data-transfers-list={`${p.page}/${last}`}>
            {rows.map((t) => <Row key={t.key} t={t} loc={loc} today={today} />)}
          </ul>
        </div>
      )}

      {last > 1 && (
        <nav aria-label={tx.pagination} className="flex flex-col items-center gap-2 pt-1" data-transfers-pagination={`${p.page}/${last}`}>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {p.page > 1 && <a href={pageHref(p.page - 1)} rel="prev" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">{tx.prev}</a>}
            {nums.map((n, i) => (
              <span key={n} className="flex items-center gap-1">
                {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-xs text-gray-400" aria-hidden="true">…</span>}
                <a href={pageHref(n)} aria-current={n === p.page ? "page" : undefined}
                  className={`min-w-[2rem] rounded-md border px-2.5 py-1.5 text-center text-xs font-semibold ${n === p.page ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:text-gray-900"}`}>{n}</a>
              </span>
            ))}
            {p.page < last && <a href={pageHref(p.page + 1)} rel="next" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">{tx.next}</a>}
          </div>
          <p className="text-xs text-gray-400">{partial ? tx.pageNoTotal(p.page) : tx.page(p.page, last)}</p>
        </nav>
      )}

      {result.dropped > 0 && <p className="text-[11px] text-gray-400" data-transfers-dropped={result.dropped}>{tx.dropped(result.dropped)}</p>}
    </div>
  );
}

