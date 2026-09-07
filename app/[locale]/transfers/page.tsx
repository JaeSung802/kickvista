import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSlot from "@/components/ads/AdSlot";
import TransferTicker from "@/components/transfers/TransferTicker";
import { fetchRecentTransfers, type APITransferItem } from "@/lib/transfers/api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata({
    locale: locale as Locale,
    title: locale === "ko" ? "이적 소식 — 최신 선수 이적 뉴스" : "Transfer News — Latest Football Transfers",
    description: locale === "ko"
      ? "최신 축구 선수 이적 소식을 KickVista에서 확인하세요."
      : "Follow the latest football transfer news on KickVista.",
    path: "/transfers",
  });
}

// ── Relative date helper ────────────────────────────────────────────────────
function relativeDate(dateStr: string, isKo: boolean): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return isKo ? "방금 전" : "Just now";
  if (diffHours < 24) return isKo ? `${diffHours}시간 전` : `${diffHours}h ago`;
  if (diffDays === 0) return isKo ? "오늘" : "Today";
  if (diffDays === 1) return isKo ? "어제" : "Yesterday";
  if (diffDays < 7) return isKo ? `${diffDays}일 전` : `${diffDays}d ago`;
  if (diffDays < 30) return isKo ? `${Math.floor(diffDays / 7)}주 전` : `${Math.floor(diffDays / 7)}w ago`;
  const months = Math.floor(diffDays / 30);
  return isKo ? `${months}개월 전` : `${months}mo ago`;
}

// ── Fee badge renderer ──────────────────────────────────────────────────────
function FeeBadge({ fee, isKo }: { fee: string; isKo: boolean }) {
  const normalized = fee.trim();

  if (normalized === "Free") {
    return (
      <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        {isKo ? "무료 이적" : "Free"}
      </span>
    );
  }
  if (normalized === "미공개" || normalized === "N/A" || normalized === "") {
    return (
      <span className="text-xs font-medium text-gray-400">
        {isKo ? "비공개" : "Undisclosed"}
      </span>
    );
  }
  if (normalized.toLowerCase() === "loan" || normalized === "임대") {
    return (
      <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        {isKo ? "임대" : "Loan"}
      </span>
    );
  }
  // Monetary amount (e.g. €150M)
  return (
    <span className="text-sm font-black text-gray-900">{normalized}</span>
  );
}

// ── Transfer status badge styles ────────────────────────────────────────────
const STATUS_STYLES: Record<string, { label: string; labelKo: string; bg: string; text: string; border: string }> = {
  confirmed: { label: "Confirmed",  labelKo: "확정",     bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  rumour:    { label: "Rumour",     labelKo: "루머",     bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  imminent:  { label: "Imminent",   labelKo: "임박",     bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  rejected:  { label: "Rejected",   labelKo: "거절",     bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

// ── Mock data (rumours & imminent — API doesn't provide these) ──────────────
interface TransferItem {
  id: number;
  player: string;
  playerKo: string;
  fromTeam: string;
  fromTeamKo: string;
  fromFlag: string;
  toTeam: string;
  toTeamKo: string;
  toFlag: string;
  fee: string;
  status: "confirmed" | "rumour" | "imminent" | "rejected";
  window: string;
  windowKo: string;
  date: string;
  age: number;
  nationality: string;
  nationalityKo: string;
  position: string;
  positionKo: string;
  source?: string;
}

const MOCK_RUMOURS: TransferItem[] = [
  {
    id: 1,  player: "Erling Haaland 🇳🇴",  playerKo: "얼링 홀란드 🇳🇴",
    fromTeam: "Man City",       fromTeamKo: "맨체스터 시티",    fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Real Madrid",    toTeamKo:   "레알 마드리드",    toFlag:   "🇪🇸",
    fee: "€250M", status: "imminent", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-02", age: 25, nationality: "Norway", nationalityKo: "노르웨이",
    position: "FWD", positionKo: "공격수", source: "Marca",
  },
  {
    id: 2,  player: "Vinicius Jr 🇧🇷",     playerKo: "비니시우스 주니오르 🇧🇷",
    fromTeam: "Real Madrid",    fromTeamKo: "레알 마드리드",    fromFlag: "🇪🇸",
    toTeam:   "Al Nassr",       toTeamKo:   "알나스르",         toFlag:   "🇸🇦",
    fee: "€300M+", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-02", age: 25, nationality: "Brazil", nationalityKo: "브라질",
    position: "FWD", positionKo: "공격수", source: "Marca",
  },
  {
    id: 4,  player: "Lee Kang-in 🇰🇷",     playerKo: "이강인 🇰🇷",
    fromTeam: "Paris SG",       fromTeamKo: "파리 생제르맹",    fromFlag: "🇫🇷",
    toTeam:   "Arsenal",        toTeamKo:   "아스날",           toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€70M", status: "imminent", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-01", age: 25, nationality: "South Korea", nationalityKo: "대한민국",
    position: "MID", positionKo: "미드필더", source: "David Ornstein",
  },
  {
    id: 5,  player: "Kim Min-jae 🇰🇷",    playerKo: "김민재 🇰🇷",
    fromTeam: "Bayern Munich",  fromTeamKo: "바이에른 뮌헨",    fromFlag: "🇩🇪",
    toTeam:   "Man United",     toTeamKo:   "맨체스터 유나이티드", toFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€55M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-01", age: 29, nationality: "South Korea", nationalityKo: "대한민국",
    position: "DEF", positionKo: "수비수", source: "David Ornstein",
  },
  {
    id: 6,  player: "Jude Bellingham 🏴󠁧󠁢󠁥󠁮󠁧󠁿", playerKo: "주드 벨링엄 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fromTeam: "Real Madrid",    fromTeamKo: "레알 마드리드",    fromFlag: "🇪🇸",
    toTeam:   "Man City",       toTeamKo:   "맨체스터 시티",    toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€180M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-01", age: 22, nationality: "England", nationalityKo: "잉글랜드",
    position: "MID", positionKo: "미드필더", source: "The Athletic",
  },
  {
    id: 7,  player: "Pedri 🇪🇸",            playerKo: "페드리 🇪🇸",
    fromTeam: "Barcelona",      fromTeamKo: "바르셀로나",       fromFlag: "🇪🇸",
    toTeam:   "Liverpool",      toTeamKo:   "리버풀",           toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€90M", status: "imminent", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-31", age: 23, nationality: "Spain", nationalityKo: "스페인",
    position: "MID", positionKo: "미드필더", source: "Fabrizio Romano",
  },
  {
    id: 8,  player: "Victor Osimhen 🇳🇬",  playerKo: "빅터 오시멘 🇳🇬",
    fromTeam: "Galatasaray",    fromTeamKo: "갈라타사라이",     fromFlag: "🇹🇷",
    toTeam:   "Chelsea",        toTeamKo:   "첼시",             toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€75M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-31", age: 27, nationality: "Nigeria", nationalityKo: "나이지리아",
    position: "FWD", positionKo: "공격수", source: "Sky Sports",
  },
  {
    id: 10, player: "Gavi 🇪🇸",             playerKo: "가비 🇪🇸",
    fromTeam: "Barcelona",      fromTeamKo: "바르셀로나",       fromFlag: "🇪🇸",
    toTeam:   "Bayern Munich",  toTeamKo:   "바이에른 뮌헨",    toFlag:   "🇩🇪",
    fee: "€80M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-30", age: 21, nationality: "Spain", nationalityKo: "스페인",
    position: "MID", positionKo: "미드필더", source: "Bild",
  },
  {
    id: 12, player: "Lamine Yamal 🇪🇸",    playerKo: "라민 야말 🇪🇸",
    fromTeam: "Barcelona",      fromTeamKo: "바르셀로나",       fromFlag: "🇪🇸",
    toTeam:   "Man City",       toTeamKo:   "맨체스터 시티",    toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€200M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-28", age: 18, nationality: "Spain", nationalityKo: "스페인",
    position: "FWD", positionKo: "공격수", source: "The Athletic",
  },
  {
    id: 14, player: "Rodri 🇪🇸",           playerKo: "로드리 🇪🇸",
    fromTeam: "Man City",       fromTeamKo: "맨체스터 시티",    fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Barcelona",      toTeamKo:   "바르셀로나",       toFlag:   "🇪🇸",
    fee: "Free", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-25", age: 29, nationality: "Spain", nationalityKo: "스페인",
    position: "MID", positionKo: "미드필더", source: "Marca",
  },
];

// ── Page ────────────────────────────────────────────────────────────────────
export default async function TransfersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isKo = locale === "ko";

  // Fetch live API data (server-side, cached 1 hour)
  const apiTransfers: APITransferItem[] = await fetchRecentTransfers();
  const hasLiveData = apiTransfers.length > 0;

  const labels = {
    title:        isKo ? "이적 소식" : "Transfer News",
    subtitle:     isKo ? "최신 선수 이적 및 계약 정보" : "Latest player transfers & contract news",
    age:          isKo ? "나이" : "Age",
    confirmed:    isKo ? "확정" : "Confirmed",
    recent:       isKo ? "최근 이적" : "Recent Transfers",
    rumours:      isKo ? "루머 & 임박" : "Rumours & Imminent",
    live:         isKo ? "실시간" : "LIVE",
    noData:       isKo ? "이적 데이터를 불러오는 중입니다." : "Loading transfer data...",
  };

  // Ticker: API confirmed + mock rumours
  const tickerItems = [
    ...apiTransfers.map((t) => ({
      player: t.playerName,
      playerKo: t.playerName,
      fromTeam: t.fromTeam,
      fromTeamKo: t.fromTeam,
      toTeam: t.toTeam,
      toTeamKo: t.toTeam,
      fee: t.fee,
      status: "confirmed" as const,
    })),
    ...MOCK_RUMOURS.map((t) => ({
      player: t.player,
      playerKo: t.playerKo,
      fromTeam: t.fromTeam,
      fromTeamKo: t.fromTeamKo,
      toTeam: t.toTeam,
      toTeamKo: t.toTeamKo,
      fee: t.fee,
      status: t.status,
      source: t.source,
    })),
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Live transfer ticker */}
      <TransferTicker items={tickerItems} locale={locale as "ko" | "en"} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3L4 7l4 4"/>
                <path d="M4 7h16"/>
                <path d="M16 21l4-4-4-4"/>
                <path d="M20 17H4"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900">{labels.title}</h1>
                {hasLiveData && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {labels.live}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{labels.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* ── Section 1: Recent Confirmed Transfers (API live data) ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                <h2 className="text-base font-bold text-gray-900">{labels.recent}</h2>
                {hasLiveData && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    API-Football
                  </span>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {hasLiveData ? (
                  apiTransfers.map((transfer, idx) => (
                    <div
                      key={`${transfer.playerId}-${transfer.date}-${idx}`}
                      className={`px-5 py-4 ${idx < apiTransfers.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Player avatar + info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://media.api-sports.io/football/players/${transfer.playerId}.png`}
                            alt={transfer.playerName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200 shrink-0"
                            onError={undefined}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm">{transfer.playerName}</span>
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                                style={{ background: STATUS_STYLES.confirmed.bg, color: STATUS_STYLES.confirmed.text, borderColor: STATUS_STYLES.confirmed.border }}
                              >
                                {isKo ? STATUS_STYLES.confirmed.labelKo : STATUS_STYLES.confirmed.label}
                              </span>
                            </div>

                            {/* Transfer route */}
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className="text-gray-500">
                                {transfer.fromFlag} {transfer.fromTeam}
                              </span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                              </svg>
                              <span className="font-semibold text-gray-900">
                                {transfer.toFlag} {transfer.toTeam}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Fee + date */}
                        <div className="shrink-0 text-right">
                          <div className="mb-0.5">
                            <FeeBadge fee={transfer.fee} isKo={isKo} />
                          </div>
                          <div className="text-xs text-gray-400">{relativeDate(transfer.date, isKo)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-gray-400">
                    {labels.noData}
                  </div>
                )}
              </div>
            </section>

            {/* ── Section 2: Rumours & Imminent (mock data) ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-5 rounded-full bg-amber-500 shrink-0" />
                <h2 className="text-base font-bold text-gray-900">{labels.rumours}</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {MOCK_RUMOURS.map((transfer, idx) => {
                  const s = STATUS_STYLES[transfer.status];
                  return (
                    <div
                      key={transfer.id}
                      className={`px-5 py-4 ${idx < MOCK_RUMOURS.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">
                              {isKo ? transfer.playerKo : transfer.player}
                            </span>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                              style={{ background: s.bg, color: s.text, borderColor: s.border }}
                            >
                              {isKo ? s.labelKo : s.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-gray-500">
                              {transfer.fromFlag} {isKo ? transfer.fromTeamKo : transfer.fromTeam}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            <span className="font-semibold text-gray-900">
                              {transfer.toFlag} {isKo ? transfer.toTeamKo : transfer.toTeam}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                            <span>{isKo ? transfer.positionKo : transfer.position}</span>
                            <span>·</span>
                            <span>{isKo ? transfer.nationalityKo : transfer.nationality}</span>
                            <span>·</span>
                            <span>{labels.age} {transfer.age}</span>
                            <span>·</span>
                            <span>{isKo ? transfer.windowKo : transfer.window}</span>
                            {transfer.source && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                                  📰 {transfer.source}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="mb-0.5">
                            <FeeBadge fee={transfer.fee} isKo={isKo} />
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{relativeDate(transfer.date, isKo)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Stats summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{isKo ? "이적 현황" : "Transfer Summary"}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: isKo ? "확정" : "Confirmed",
                    count: hasLiveData ? apiTransfers.length : 0,
                    color: "text-emerald-600",
                  },
                  {
                    label: isKo ? "임박" : "Imminent",
                    count: MOCK_RUMOURS.filter((t) => t.status === "imminent").length,
                    color: "text-amber-600",
                  },
                  {
                    label: isKo ? "루머" : "Rumours",
                    count: MOCK_RUMOURS.filter((t) => t.status === "rumour").length,
                    color: "text-gray-600",
                  },
                  {
                    label: isKo ? "총계" : "Total",
                    count: (hasLiveData ? apiTransfers.length : 0) + MOCK_RUMOURS.length,
                    color: "text-gray-900",
                  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <div className={`text-2xl font-black ${color}`}>{count}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {hasLiveData && (
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  {isKo ? "확정 데이터: API-Football 실시간" : "Confirmed data: API-Football live"}
                </p>
              )}
            </div>

            <AdSlot slotId="transfers-sidebar" size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
