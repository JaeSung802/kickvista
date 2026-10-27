/**
 * Transfer Center — pure data rules (no I/O). The server side lives in transfers-query.ts.
 *
 * Source: API-Football GET /transfers?team=<id> (one call per team). Per the official spec each
 * response item is { player: { id, name }, update, transfers: [{ date: "YYYY-MM-DD", type,
 * teams: { in, out } }] } — dates are not ordered and `type` is free text: the spec shows only
 * "Free", "N/A" and null. Fee strings ("€ 25M") and loan wording are parsed defensively here and
 * were checked against two real responses (teams 42 and 541, 2026-10-27, samples/transfers-team-*.json):
 * besides "Loan", "N/A", "Free", "Free agent", "Return from loan" and "€ 12M" they contain "Transfer",
 * "12M €" (currency after the amount), "€ Free", "€ N/A", "21.4M" (no currency), "-", null, "Swap" and
 * "Raise". Anything not recognised keeps its raw text.
 *
 * Nothing is invented: no age, position, contract length, article source or "official" status.
 * Dates stay plain "YYYY-MM-DD" strings (no time, no time-zone conversion).
 */

export interface TransferTeam { id: number; name: string; logo: string | null }

export type TransferKind =
  | "fee"          // a fee string ("€ 25M", "25M €"); `fee` is null when the amount could not be read safely
  | "transfer"     // "Transfer": a permanent move without a fee value
  | "free"         // free transfer
  | "loan"
  | "loan-return"  // back from / end of loan
  | "undisclosed"  // the provider says the fee is undisclosed
  | "unknown"      // "N/A", empty or missing
  | "other";       // any other text — shown as given

export type FeeCurrency = "EUR" | "GBP" | "USD";
export interface TransferFee { currency: FeeCurrency; amount: number; label: string }

export interface TransferItem {
  key: string;                 // player | date | from | to  (dedupe key)
  playerId: number | null;
  playerName: string | null;
  date: string;                // YYYY-MM-DD as given by the provider
  from: TransferTeam | null;   // teams.out
  to: TransferTeam | null;     // teams.in
  kind: TransferKind;
  fee: TransferFee | null;     // only when the amount and currency were read safely
  rawType: string | null;      // the provider's text, kept for "other" and unreadable fees
  // Set only when near-identical provider records were grouped for display: every original record
  // (date + type text as given), oldest first. `date` above is then the earliest of them and is used
  // only for ordering and period filters — it is not presented as the confirmed transfer date.
  records?: { date: string; rawType: string | null }[];
}

// ─── type / fee ───────────────────────────────────────────────────────────────

const CURRENCY: Record<string, FeeCurrency> = { "€": "EUR", "£": "GBP", "$": "USD" };
const UNIT: Record<string, number> = { K: 1e3, M: 1e6 };

/** Reads the provider's `type` text. A missing value is "unknown" — never 0 or "free". */
export function parseTransferType(raw: unknown): { kind: TransferKind; fee: TransferFee | null; rawType: string | null } {
  if (raw === null || raw === undefined) return { kind: "unknown", fee: null, rawType: null };
  const text = String(raw).trim();
  // "€ Free" / "€ N/A" carry a currency sign in front of a word: read the word.
  const word = text.replace(/^[€£$]\s*(?=[A-Za-z/])/, "");
  if (!word || /^(n\/a|na|-|\?)$/i.test(word)) return { kind: "unknown", fee: null, rawType: text || null };
  if (/^free( transfer| agent)?$/i.test(word)) return { kind: "free", fee: null, rawType: text };
  if (/^(back from loan|end of loan|loan return|return(ed)? from loan)$/i.test(word)) return { kind: "loan-return", fee: null, rawType: text };
  if (/^loan$/i.test(word)) return { kind: "loan", fee: null, rawType: text };
  if (/^undisclosed( fee)?$/i.test(word)) return { kind: "undisclosed", fee: null, rawType: text };
  if (/^transfer$/i.test(word)) return { kind: "transfer", fee: null, rawType: text };
  // Only "<sign> <digits>[.<digits>]<K|M>" or "<digits>[.<digits>]<K|M> <sign>" is read as a number;
  // "€ 2,5M", "€ 500000", "€ 1.2B" or an amount without a currency ("21.4M") stay unread.
  const m = text.match(/^([€£$])\s?(\d{1,4}(?:\.\d{1,3})?)\s?([KM])$/i) ?? text.match(/^()(\d{1,4}(?:\.\d{1,3})?)\s?([KM])\s?([€£$])$/i);
  if (m) {
    const sign = m[1] || m[4];
    const amount = Math.round(Number(m[2]) * UNIT[m[3].toUpperCase()]);
    if (Number.isFinite(amount) && amount > 0) return { kind: "fee", fee: { currency: CURRENCY[sign], amount, label: `${sign}${m[2]}${m[3].toUpperCase()}` }, rawType: text };
  }
  if (/^[€£$]/.test(text) || /[€£$]$/.test(text) || /^\d+(?:[.,]\d+)?\s?[KM]$/i.test(text)) return { kind: "fee", fee: null, rawType: text };
  return { kind: "other", fee: null, rawType: text };
}

// ─── dates (plain strings) ────────────────────────────────────────────────────

/** True for a real calendar date written as YYYY-MM-DD. */
export function isPlainDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Shifts a YYYY-MM-DD string by whole days with UTC arithmetic (no local time zone involved). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Today's date in Korea as YYYY-MM-DD (the site's reference day for periods). */
export function kstToday(now: number = Date.now()): string {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10);
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Formats a YYYY-MM-DD string without creating a Date (so the day can never shift). */
export function formatPlainDate(date: string, isKo: boolean): string {
  const [y, m, d] = date.split("-");
  return isKo ? `${y}.${m}.${d}` : `${Number(d)} ${MONTHS_EN[Number(m) - 1]} ${y}`;
}

// ─── normalising one team's response ──────────────────────────────────────────

/** How far back a team's transfers are kept after a fetch (the longest period on offer). */
export const RETENTION_DAYS = 730;

function team(x: unknown): TransferTeam | null {
  const t = x as { id?: unknown; name?: unknown; logo?: unknown } | null | undefined;
  if (!t || typeof t.id !== "number" || !Number.isInteger(t.id) || t.id <= 0) return null;
  const name = typeof t.name === "string" && t.name.trim() ? t.name.trim() : null;
  if (!name) return null;
  const logo = typeof t.logo === "string" && /^https:\/\/media(-\d)?\.api-sports\.io\//.test(t.logo) ? t.logo : null;
  return { id: t.id, name, logo };
}

export interface NormalizeStats { kept: number; noDate: number; sameTeam: number; notThisTeam: number; tooOld: number }

/**
 * Turns one `/transfers?team=` response into items that involve that team and are not older than
 * `cutoff` (YYYY-MM-DD). Rows without a valid date, or whose in/out team is the same club, are
 * dropped and counted. A missing player name or team is kept as null (shown as "not available").
 */
export function normalizeTeamTransfers(response: unknown, teamId: number, cutoff: string): { items: TransferItem[]; stats: NormalizeStats } {
  const stats: NormalizeStats = { kept: 0, noDate: 0, sameTeam: 0, notThisTeam: 0, tooOld: 0 };
  const items: TransferItem[] = [];
  if (!Array.isArray(response)) return { items, stats };
  for (const entry of response) {
    const e = entry as { player?: { id?: unknown; name?: unknown }; transfers?: unknown };
    const playerId = typeof e?.player?.id === "number" && Number.isInteger(e.player.id) && e.player.id > 0 ? e.player.id : null;
    const playerName = typeof e?.player?.name === "string" && e.player.name.trim() ? e.player.name.trim() : null;
    if (!Array.isArray(e?.transfers)) continue;
    for (const tr of e.transfers) {
      const t = tr as { date?: unknown; type?: unknown; teams?: { in?: unknown; out?: unknown } };
      if (!isPlainDate(t?.date)) { stats.noDate++; continue; }
      const to = team(t.teams?.in), from = team(t.teams?.out);
      if (to && from && to.id === from.id) { stats.sameTeam++; continue; }
      if (to?.id !== teamId && from?.id !== teamId) { stats.notThisTeam++; continue; }
      if (t.date < cutoff) { stats.tooOld++; continue; }
      const { kind, fee, rawType } = parseTransferType(t.type);
      const who = playerId !== null ? `p${playerId}` : `n:${playerName ?? "?"}`;
      items.push({ key: `${who}|${t.date}|${from?.id ?? "?"}|${to?.id ?? "?"}`, playerId, playerName, date: t.date, from, to, kind, fee, rawType });
      stats.kept++;
    }
  }
  return { items, stats };
}

// ─── merging teams ────────────────────────────────────────────────────────────

const RANK: Record<TransferKind, number> = { fee: 4, loan: 3, "loan-return": 3, free: 3, transfer: 2, undisclosed: 2, other: 1, unknown: 0 };
const rank = (t: TransferItem) => RANK[t.kind] + (t.fee ? 1 : 0);

/**
 * One row per player + date + from + to. The same move reported by both clubs is merged (the more
 * informative type wins); a later loan return or a second move of the same player has a different
 * date or direction and stays a separate row.
 */
export function dedupeTransfers(lists: TransferItem[][]): TransferItem[] {
  const byKey = new Map<string, TransferItem>();
  for (const list of lists) for (const t of list) {
    const prev = byKey.get(t.key);
    if (!prev || rank(t) > rank(prev)) byKey.set(t.key, t);
  }
  return mergeNearDuplicates([...byKey.values()]);
}

/** Dates up to this many days apart can be one record written twice by the provider. */
export const NEAR_DUPLICATE_DAYS = 3;
const dayNo = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86_400_000;

/** What a record says about the move: kind + readable fee, or the raw text when nothing else could be read. */
const info = (t: TransferItem) =>
  `${t.kind}|${t.fee ? `${t.fee.currency}${t.fee.amount}` : t.kind === "fee" || t.kind === "other" ? (t.rawType ?? "") : ""}`;

/**
 * The provider sometimes records one move twice, a day or two apart (seen in real responses:
 * "Transfer" on 07-12 and 07-13 for the same player, clubs and direction; "Return from loan" then "N/A").
 * Records are grouped for display only when
 *  - the player id, from-club id and to-club id are all valid and equal,
 *  - every date in the group is at most NEAR_DUPLICATE_DAYS after the group's first date (no chaining:
 *    days 1, 3, 5 give [1, 3] and [5]), and
 *  - they say the same thing (same kind and, for fees, the same amount and currency; for unread fees and
 *    "other", the same text). A record with no information ("unknown") can join any group.
 * Conflicting records (different fee, currency or type) stay separate rows; nothing is chosen or dropped.
 * Every original record is kept in `records`; opposite directions and moves to other clubs never group.
 */
export function mergeNearDuplicates(list: TransferItem[]): TransferItem[] {
  const groups = new Map<string, TransferItem[]>();
  const out: TransferItem[] = [];
  for (const t of list) {
    if (t.playerId === null || !t.from || !t.to) { out.push(t); continue; }
    const g = `${t.playerId}|${t.from.id}|${t.to.id}`;
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(t);
  }
  for (const rows of groups.values()) {
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
    const clusters: TransferItem[][] = [];
    for (const t of rows) {
      const c = clusters.at(-1);
      const fits = c && dayNo(t.date) - dayNo(c[0].date) <= NEAR_DUPLICATE_DAYS
        && c.every((x) => x.kind === "unknown" || t.kind === "unknown" || info(x) === info(t));
      if (fits) c.push(t); else clusters.push([t]);
    }
    for (const c of clusters) {
      if (c.length === 1) { out.push(c[0]); continue; }
      // All informative records in a group say the same thing; show that one (or "unknown" if none has information).
      const shown = c.find((x) => x.kind !== "unknown") ?? c[0];
      out.push({ ...shown, date: c[0].date, key: c[0].key, records: c.map((x) => ({ date: x.date, rawType: x.rawType })) });
    }
  }
  return out;
}

// ─── filters, sort, paging ────────────────────────────────────────────────────

export const PERIODS = { "30d": 30, "90d": 90, "180d": 180, "1y": 365, "2y": RETENTION_DAYS } as const;
export type PeriodKey = keyof typeof PERIODS;
export const TYPE_FILTERS = ["all", "fee", "transfer", "free", "loan", "loan-return", "none"] as const;
export type TypeFilter = (typeof TYPE_FILTERS)[number];
export const SORTS = ["latest", "fee"] as const;
export type SortKey = (typeof SORTS)[number];
export const PAGE_SIZE = 20;

export function matchesType(t: TransferItem, f: TypeFilter): boolean {
  if (f === "all") return true;
  if (f === "none") return t.kind === "unknown" || t.kind === "undisclosed" || t.kind === "other";
  return t.kind === f;
}

/** Lower-case, accents removed — "Hernán" matches "hernan". */
export function fold(s: string): string {
  return s.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("en");
}

const byLatest = (a: TransferItem, b: TransferItem) =>
  b.date.localeCompare(a.date)
  || (a.playerName ?? "￿").localeCompare(b.playerName ?? "￿", "en")
  || (a.playerId ?? 0) - (b.playerId ?? 0)
  || a.key.localeCompare(b.key);

/** Fees compared as numbers: euro amounts only (no exchange rates). Everything else follows, newest first. */
export const isComparableFee = (t: TransferItem) => t.kind === "fee" && t.fee?.currency === "EUR";

export function sortTransfers(list: TransferItem[], sort: SortKey): TransferItem[] {
  const out = [...list];
  if (sort === "latest") return out.sort(byLatest);
  return out.sort((a, b) => {
    const ca = isComparableFee(a), cb = isComparableFee(b);
    if (ca !== cb) return ca ? -1 : 1;
    if (ca && cb && a.fee!.amount !== b.fee!.amount) return b.fee!.amount - a.fee!.amount;
    return byLatest(a, b);
  });
}

export interface ViewQuery { period: PeriodKey; type: TypeFilter; q: string; sort: SortKey }

/** Applies period (from `today` back N days; later-dated rows included), type and search, then sorts. */
export function applyView(list: TransferItem[], v: ViewQuery, today: string, extraNames?: (t: TransferTeam) => string[]): TransferItem[] {
  const from = addDays(today, -PERIODS[v.period]);
  const needle = v.q ? fold(v.q) : "";
  const hay = (t: TransferItem) => [t.playerName, t.from?.name, t.to?.name,
    ...(t.from && extraNames ? extraNames(t.from) : []), ...(t.to && extraNames ? extraNames(t.to) : [])].filter(Boolean).map((s) => fold(s as string));
  return sortTransfers(list.filter((t) => t.date >= from && matchesType(t, v.type) && (!needle || hay(t).some((h) => h.includes(needle)))), v.sort);
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

// ─── URL rules ────────────────────────────────────────────────────────────────

export const Q_MAX = 40;

export interface TransferParams { league: string; team: string | null; period: PeriodKey; type: TypeFilter; q: string; sort: SortKey; page: number }
export const DEFAULTS = { league: "premier-league", period: "90d" as PeriodKey, type: "all" as TypeFilter, sort: "latest" as SortKey };

/**
 * Reads the query string. Returns the normalised params and whether the URL must be rewritten
 * (unknown value, repeated key, team outside the league, page not a positive integer, long search).
 * `teamLeague` maps a team slug in scope to its league slug.
 */
export function readParams(sp: Record<string, string | string[] | undefined>, leagues: readonly string[], teamLeague: (slug: string) => string | null): { params: TransferParams; rewrite: boolean } {
  let rewrite = false;
  const one = (k: string): string | undefined => { const v = sp[k]; if (Array.isArray(v)) { rewrite = true; return v[0]; } return v; };
  const rawLeague = one("league"), rawTeam = one("team"), rawPeriod = one("period"), rawType = one("type"), rawSort = one("sort"), rawPage = one("page"), rawQ = one("q");

  let league = DEFAULTS.league;
  if (rawLeague !== undefined) { if (rawLeague === "all" || leagues.includes(rawLeague)) league = rawLeague; else rewrite = true; }
  let team: string | null = null;
  if (rawTeam !== undefined) {
    const tl = teamLeague(rawTeam);
    // The team's league is adopted silently when `league` is absent (canonical form); a written `league` is dropped below.
    if (tl) { team = rawTeam; league = tl; } else rewrite = true;
  }
  const pick = <T extends string>(raw: string | undefined, allowed: readonly T[], def: T): T => {
    if (raw === undefined) return def; if ((allowed as readonly string[]).includes(raw)) return raw as T; rewrite = true; return def;
  };
  const period = pick(rawPeriod, Object.keys(PERIODS) as PeriodKey[], DEFAULTS.period);
  const type = pick(rawType, TYPE_FILTERS, DEFAULTS.type);
  const sort = pick(rawSort, SORTS, DEFAULTS.sort);
  let page = 1;
  if (rawPage !== undefined) { if (/^[1-9]\d{0,4}$/.test(rawPage)) page = Number(rawPage); else rewrite = true; }
  let q = (rawQ ?? "").replace(/\s+/g, " ").trim();
  if (q.length > Q_MAX) q = q.slice(0, Q_MAX).trim();
  if (rawQ !== undefined && q !== rawQ) rewrite = true;
  // Defaults written out explicitly are dropped from the canonical URL.
  // A team decides its league, so `league` next to `team` is redundant.
  if (rawTeam !== undefined && rawLeague !== undefined) rewrite = true;
  if (rawPage === "1" || rawLeague === DEFAULTS.league && !rawTeam || rawPeriod === DEFAULTS.period || rawType === DEFAULTS.type || rawSort === DEFAULTS.sort || rawQ === "") rewrite = true;
  return { params: { league, team, period, type, q, sort, page }, rewrite };
}

/** Canonical URL: defaults left out; `team` implies its league, so league is omitted with a team. */
export function transfersHref(locale: string, p: TransferParams): string {
  const s = new URLSearchParams();
  if (p.team) s.set("team", p.team); else if (p.league !== DEFAULTS.league) s.set("league", p.league);
  if (p.period !== DEFAULTS.period) s.set("period", p.period);
  if (p.type !== DEFAULTS.type) s.set("type", p.type);
  if (p.sort !== DEFAULTS.sort) s.set("sort", p.sort);
  if (p.q) s.set("q", p.q);
  if (p.page > 1) s.set("page", String(p.page));
  const qs = s.toString();
  return `/${locale}/transfers${qs ? "?" + qs : ""}`;
}
