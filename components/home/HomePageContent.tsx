/**
 * HomePageContent — Server Component (assembler)
 *
 * Portal-style 2-column layout:
 * - Left (2/3): Today's matches + Community hot posts
 * - Right (1/3): Standings mini + AI Analysis CTA + Notices
 *
 * Visually distinct from league pages via dark hero + portal layout.
 */

import type { Locale } from "@/lib/i18n";
import type { MatchViewModel } from "@/lib/football/adapters";
import type { StandingRowViewModel } from "@/lib/football/adapters";
import type { PostListItem } from "@/lib/community/actions";

import NoticeWidget from "./NoticeWidget";
import AdBanner from "@/components/ads/AdBanner";
import AdSidebar from "@/components/ads/AdSidebar";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { LeagueLogo } from "@/components/ui/LeagueLogo";
import StandingsMiniClient from "./StandingsMiniClient";
import { WorldCupGroupsDynamic, KoreaMatchScheduleDynamic } from "@/components/worldcup/WorldCupLoaders";
import { isWorldCupVisible } from "@/lib/worldcup/visibility";

export type StandingsMap = Partial<Record<string, StandingRowViewModel[]>>;

interface HomePageContentProps {
  locale: Locale;
  matches: MatchViewModel[];
  standingsData: StandingsMap;
  hotPosts: PostListItem[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {href && linkLabel && (
        <a href={href} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          {linkLabel} →
        </a>
      )}
    </div>
  );
}

// ─── Today's Matches compact list ─────────────────────────────────────────────

function MatchRow({ match, locale }: { match: MatchViewModel; locale: Locale }) {
  const isLive     = match.status === "live";
  const isFinished = match.status === "finished";
  const homeWins   = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWins   = (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors">
      {/* League flag */}
      <span className="text-sm shrink-0 w-5">{match.leagueFlag}</span>

      {/* Home team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <TeamLogo logo={match.homeLogo} name={match.homeTeam} size={18} />
        <span className={`text-xs truncate ${homeWins ? "font-bold text-gray-900" : "text-gray-600"}`}>
          {match.homeTeam}
        </span>
      </div>

      {/* Score / time */}
      <div className="shrink-0 flex items-center justify-center w-20">
        {isLive ? (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            {match.homeScore}–{match.awayScore}
          </span>
        ) : isFinished ? (
          <span className="text-xs font-black text-gray-800 tabular-nums">
            {match.homeScore}–{match.awayScore}
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
            {match.time ?? "—"}
          </span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className={`text-xs truncate text-right ${awayWins ? "font-bold text-gray-900" : "text-gray-600"}`}>
          {match.awayTeam}
        </span>
        <TeamLogo logo={match.awayLogo} name={match.awayTeam} size={18} />
      </div>
    </div>
  );
}

// ─── Community post row ───────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { labelKo: string; labelEn: string; color: string; bg: string }> = {
  "match-discussion": { labelKo: "경기 토론",   labelEn: "Match",         color: "#059669", bg: "#ecfdf5" },
  "transfer-news":    { labelKo: "이적 뉴스",   labelEn: "Transfer",      color: "#d97706", bg: "#fffbeb" },
  "tactics":          { labelKo: "전술 분석",   labelEn: "Tactics",       color: "#7c3aed", bg: "#f5f3ff" },
  "highlights":       { labelKo: "하이라이트",  labelEn: "Clips",         color: "#dc2626", bg: "#fef2f2" },
  "predictions":      { labelKo: "예측",        labelEn: "Predict",       color: "#0891b2", bg: "#ecfeff" },
  "general":          { labelKo: "일반",        labelEn: "General",       color: "#6b7280", bg: "#f9fafb" },
  "notice":           { labelKo: "공지사항",    labelEn: "Notice",        color: "#059669", bg: "#ecfdf5" },
  "worldcup-2026":    { labelKo: "2026 월드컵", labelEn: "2026 World Cup", color: "#dc2626", bg: "#fef2f2" },
};

function PostRow({ post, locale }: { post: PostListItem; locale: Locale }) {
  const isKo = locale === "ko";
  const meta = CATEGORY_META[post.category] ?? CATEGORY_META["general"];

  return (
    <a
      href={`/${locale}/community/post/${post.id}`}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      {post.isHot && <span className="shrink-0 text-xs mt-0.5">🔥</span>}
      <span
        className="shrink-0 inline-block text-[11px] font-semibold rounded px-1.5 py-0.5 mt-0.5"
        style={{ color: meta.color, backgroundColor: meta.bg }}
      >
        {isKo ? meta.labelKo : meta.labelEn}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
          {post.title}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
          <span>{post.authorBadge} {post.authorName}</span>
          <span>💬 {post.commentCount}</span>
          <span>👁 {post.viewCount.toLocaleString()}</span>
          <span className="ml-auto">{post.timeAgo}</span>
        </div>
      </div>
    </a>
  );
}

// ─── League grouping helpers ──────────────────────────────────────────────────

const CDN = "https://media.api-sports.io/football/leagues";

const LEAGUE_LOGO_MAP: Record<string, string> = {
  "premier-league":    `${CDN}/39.png`,
  "la-liga":           `${CDN}/140.png`,
  "bundesliga":        `${CDN}/78.png`,
  "serie-a":           `${CDN}/135.png`,
  "ligue-1":           `${CDN}/61.png`,
  "champions-league":  `${CDN}/2.png`,
  "europa-league":     `${CDN}/3.png`,
  "k-league-1":        `${CDN}/292.png`,
};

const LEAGUE_PRIORITY: Record<string, number> = {
  "premier-league":   1,
  "la-liga":          2,
  "bundesliga":       3,
  "serie-a":          4,
  "ligue-1":          5,
  "champions-league": 6,
  "europa-league":    7,
};

/** KST 오늘 날짜 YYYY-MM-DD */
function kstToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}

/** YYYY-MM-DD → "오늘" / "3월 25일 (화)" / "Tue, Mar 25" */
function formatDateLabel(dateKey: string, locale: Locale, isToday: boolean): string {
  if (isToday) return locale === "ko" ? "오늘" : "Today";
  const [y, mo, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short", day: "numeric", weekday: "short",
  }).format(new Date(y, mo - 1, d));
}

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  isToday: boolean;
  matches: MatchViewModel[];
}

interface LeagueGroup {
  leagueSlug: string;
  leagueName: string;
  leagueFlag: string;
  leagueLogo?: string;
  dayGroups: DayGroup[];
  allMatches: MatchViewModel[];
}

function groupMatchesByLeague(matches: MatchViewModel[], locale: Locale): LeagueGroup[] {
  const today = kstToday();
  const leagueMap = new Map<string, MatchViewModel[]>();
  for (const m of matches) {
    if (!leagueMap.has(m.leagueSlug)) leagueMap.set(m.leagueSlug, []);
    leagueMap.get(m.leagueSlug)!.push(m);
  }

  return Array.from(leagueMap.entries())
    .map(([slug, ms]) => {
      const sorted = [...ms].sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (b.status === "live" && a.status !== "live") return 1;
        return (a.date ?? "").localeCompare(b.date ?? "") || (a.time ?? "").localeCompare(b.time ?? "");
      });

      // 날짜별 서브 그룹핑
      const dayMap = new Map<string, MatchViewModel[]>();
      for (const m of sorted) {
        const key = m.date ?? "unknown";
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key)!.push(m);
      }

      const dayGroups: DayGroup[] = Array.from(dayMap.entries()).map(([dateKey, dayMatches]) => ({
        dateKey,
        dateLabel: formatDateLabel(dateKey, locale, dateKey === today),
        isToday: dateKey === today,
        matches: dayMatches,
      }));

      return {
        leagueSlug: slug,
        leagueName: ms[0].league,
        leagueFlag: ms[0].leagueFlag,
        leagueLogo: LEAGUE_LOGO_MAP[slug],
        dayGroups,
        allMatches: sorted,
      };
    })
    .sort((a, b) => (LEAGUE_PRIORITY[a.leagueSlug] ?? 99) - (LEAGUE_PRIORITY[b.leagueSlug] ?? 99));
}

// ─── Standings mini sidebar ───────────────────────────────────────────────────
const LEAGUE_TABS = [
  { key: "premier-league", labelKo: "EPL",  labelEn: "EPL",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", href: "premier-league", logo: `${CDN}/39.png`  },
  { key: "la-liga",        labelKo: "라리가", labelEn: "Liga", flag: "🇪🇸",          href: "la-liga",        logo: `${CDN}/140.png` },
  { key: "bundesliga",     labelKo: "분데",  labelEn: "BL",   flag: "🇩🇪",          href: "bundesliga",     logo: `${CDN}/78.png`  },
  { key: "serie-a",        labelKo: "세리에", labelEn: "SA",   flag: "🇮🇹",          href: "serie-a",        logo: `${CDN}/135.png` },
];

function StandingsMini({
  standingsData,
  locale,
}: {
  standingsData: StandingsMap;
  locale: Locale;
}) {
  const isKo = locale === "ko";
  // Pick first available league
  const activeKey = LEAGUE_TABS.find((t) => standingsData[t.key])?.key ?? "premier-league";
  const rows = (standingsData[activeKey] ?? []).slice(0, 6);
  const activeTab = LEAGUE_TABS.find((t) => t.key === activeKey);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab && (
            <LeagueLogo logo={activeTab.logo} name={activeTab.labelEn} flag={activeTab.flag} size={20} />
          )}
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {isKo ? "리그 순위" : "Standings"}
          </h3>
        </div>
        {/* League switcher tabs — logo pills */}
        <div className="flex items-center gap-1.5">
          {LEAGUE_TABS.map((tab) =>
            standingsData[tab.key] ? (
              <a
                key={tab.key}
                href={`/${locale}/league/${tab.href}`}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all ${
                  tab.key === activeKey
                    ? "bg-emerald-50 ring-1 ring-emerald-400"
                    : "hover:bg-gray-100"
                }`}
                title={isKo ? tab.labelKo : tab.labelEn}
              >
                <LeagueLogo
                  logo={tab.logo}
                  name={isKo ? tab.labelKo : tab.labelEn}
                  flag={tab.flag}
                  size={22}
                  isActive={tab.key === activeKey}
                />
              </a>
            ) : null
          )}
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">{isKo ? "데이터 없음" : "No data"}</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {rows.map((row) => (
            <div key={row.pos} className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{row.pos}</span>
              <TeamLogo logo={row.logo} name={row.team} size={16} />
              <span className="flex-1 text-xs text-gray-700 font-medium truncate min-w-0">{row.displayName}</span>
              <span className="text-xs font-black text-gray-900 tabular-nums">{row.pts}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-gray-100">
        <a href={`/${locale}/league/${activeKey}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
          {isKo ? "전체 순위 보기 →" : "Full table →"}
        </a>
      </div>
    </div>
  );
}

// ─── Quick links bar ──────────────────────────────────────────────────────────

const LEAGUE_QUICK = [
  { href: "epl",              flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", en: "PL",   ko: "PL",   logo: `${CDN}/39.png`  },
  { href: "la-liga",          flag: "🇪🇸",          en: "Liga", ko: "라리가", logo: `${CDN}/140.png` },
  { href: "bundesliga",       flag: "🇩🇪",          en: "BL",   ko: "분데",   logo: `${CDN}/78.png`  },
  { href: "serie-a",          flag: "🇮🇹",          en: "SA",   ko: "세리에", logo: `${CDN}/135.png` },
  { href: "ligue-1",          flag: "🇫🇷",          en: "L1",   ko: "리그1",  logo: `${CDN}/61.png`  },
  { href: "champions-league", flag: "🌍",           en: "UCL",  ko: "UCL",   logo: `${CDN}/2.png`   },
  { href: "k-league-1",       flag: "🇰🇷",          en: "K리그", ko: "K리그", logo: `${CDN}/292.png` },
];

export function QuickLinksBar({ locale }: { locale: Locale }) {
  const isKo = locale === "ko";
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0.5 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
          {LEAGUE_QUICK.map((l) => (
            <a
              key={l.href}
              href={`/${locale}/league/${l.href}`}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap group"
            >
              <LeagueLogo logo={l.logo} name={isKo ? l.ko : l.en} flag={l.flag} size={22} className="group-hover:scale-110" />
              <span>{isKo ? l.ko : l.en}</span>
            </a>
          ))}
          <span className="w-px h-4 bg-gray-200 shrink-0 mx-1" />
          <a
            href={`/${locale}/analysis`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-emerald-700 transition-colors whitespace-nowrap"
          >
            🤖 {isKo ? "AI 분석" : "AI Analysis"}
          </a>
          <a
            href={`/${locale}/community`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-emerald-700 transition-colors whitespace-nowrap"
          >
            💬 {isKo ? "커뮤니티" : "Community"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function HomePageContent({
  locale,
  matches,
  standingsData,
  hotPosts,
}: HomePageContentProps) {
  const isKo = locale === "ko";
  const adBanner = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000";
  const adRect   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE ?? "1111111111";

  const liveMatches  = matches.filter((m) => m.status === "live");
  const otherMatches = matches.filter((m) => m.status !== "live");
  const leagueGroups = groupMatchesByLeague([...liveMatches, ...otherMatches], locale);
  const showWorldCup = isWorldCupVisible();

  return (
    <>
      {/* ── Top ad ── */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <AdBanner slot={adBanner} />
        </div>
      </div>

      {/* ── Main 2-col portal layout ── */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT — main content (2/3) ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* World Cup Group Standings — 기간 한정 노출 */}
              {showWorldCup && (
                <section>
                  <SectionHeader
                    title={isKo ? "🏆 2026 월드컵 조편성" : "🏆 2026 World Cup Groups"}
                    href={`/${locale}/community?category=worldcup-2026`}
                    linkLabel={isKo ? "월드컵 커뮤니티" : "WC Community"}
                  />
                  <WorldCupGroupsDynamic isKo={isKo} />
                </section>
              )}

              {/* Today's Matches — grouped by league */}
              <section id="matches">
                <SectionHeader
                  title={isKo ? "⚽ 오늘의 경기" : "⚽ Today's Matches"}
                  href={`/${locale}/league/premier-league`}
                  linkLabel={isKo ? "전체 리그" : "All leagues"}
                />

                {leagueGroups.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl py-12 text-center shadow-sm">
                    <span className="text-3xl">⚽</span>
                    <p className="text-sm text-gray-400 mt-2">
                      {isKo ? "오늘 예정된 경기가 없습니다" : "No matches scheduled today"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {leagueGroups.map((group) => (
                      <div
                        key={group.leagueSlug}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        {/* League header */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <LeagueLogo
                            logo={group.leagueLogo ?? group.leagueFlag}
                            name={group.leagueName}
                            flag={group.leagueFlag}
                            size={20}
                          />
                          <span className="text-sm font-bold text-gray-700 flex-1 min-w-0 truncate">
                            {group.leagueName}
                          </span>
                          {group.allMatches.some((m) => m.status === "live") && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                              </span>
                              LIVE
                            </span>
                          )}
                          <a
                            href={`/${locale}/league/${group.leagueSlug}`}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 shrink-0"
                          >
                            {isKo ? "전체 →" : "All →"}
                          </a>
                        </div>

                        {/* Match rows — 날짜별 서브 그룹 */}
                        <div className="divide-y divide-gray-50">
                          {group.dayGroups.map((dayGroup) => (
                            <div key={dayGroup.dateKey}>
                              {/* 날짜 구분선 */}
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50/60 border-b border-gray-100">
                                <span className={`text-[11px] font-bold ${dayGroup.isToday ? "text-emerald-600" : "text-gray-400"}`}>
                                  {dayGroup.dateLabel}
                                </span>
                                {dayGroup.isToday && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 leading-none">
                                    TODAY
                                  </span>
                                )}
                              </div>
                              {dayGroup.matches.map((match) => (
                                <MatchRow key={match.id} match={match} locale={locale} />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Mid ad */}
              <AdBanner slot={adBanner} />

              {/* Community Hot Posts */}
              <section>
                <SectionHeader
                  title={isKo ? "🔥 커뮤니티 인기 글" : "🔥 Hot Community Posts"}
                  href={`/${locale}/community`}
                  linkLabel={isKo ? "커뮤니티 전체" : "View all"}
                />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {hotPosts.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      {isKo ? "아직 게시글이 없습니다" : "No posts yet — be the first!"}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {hotPosts.map((post) => (
                        <PostRow key={post.id} post={post} locale={locale} />
                      ))}
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <a href={`/${locale}/community`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      {isKo ? "전체 커뮤니티 보기 →" : "Browse all discussions →"}
                    </a>
                    <a href={`/${locale}/community/write`} className="text-xs text-gray-400 hover:text-gray-600">
                      ✏️ {isKo ? "글쓰기" : "New post"}
                    </a>
                  </div>
                </div>
              </section>

              <AdBanner slot={adBanner} />
            </div>

            {/* ── RIGHT — sidebar (1/3) ── */}
            <div className="flex flex-col gap-5">

              {/* Korea Match Schedule — 기간 한정 노출 */}
              {showWorldCup && <KoreaMatchScheduleDynamic isKo={isKo} />}

              {/* League standings mini */}
              <StandingsMiniClient standingsData={standingsData} locale={locale} />

              {/* AI Analysis CTA */}
              <a
                href={`/${locale}/analysis`}
                className="block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {isKo ? "AI 경기 분석" : "AI Match Analysis"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isKo ? "데이터 기반 인사이트" : "Data-driven insights"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {isKo
                      ? "팀 폼, 상대 전적, 통계 트렌드를 분석한 AI 프리뷰 및 리캡."
                      : "AI-generated previews and recaps based on team form, H2H and statistical trends."}
                  </p>
                  <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors">
                    {isKo ? "분석 보기 →" : "View analysis →"}
                  </span>
                </div>
              </a>

              {/* Notice widget */}
              <NoticeWidget locale={locale} />

              {/* Attendance CTA */}
              <a
                href={`/${locale}/attendance`}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 hover:bg-amber-100 transition-colors"
              >
                <span className="text-2xl shrink-0">🎯</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-amber-800">
                    {isKo ? "출석 체크" : "Daily Check-in"}
                  </div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    {isKo ? "포인트를 모아 랭킹에 도전하세요" : "Collect points and climb the rankings"}
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-700 shrink-0">
                  {isKo ? "참여" : "Go"} →
                </span>
              </a>

              {/* Sticky ad */}
              <AdSidebar slot={adRect} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
