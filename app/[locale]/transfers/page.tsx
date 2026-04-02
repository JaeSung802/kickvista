import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import AdSlot from "@/components/ads/AdSlot";
import TransferTicker from "@/components/transfers/TransferTicker";

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

// Relative date helper
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

// Transfer status badge styles
const STATUS_STYLES: Record<string, { label: string; labelKo: string; bg: string; text: string; border: string }> = {
  confirmed: { label: "Confirmed",  labelKo: "확정",     bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  rumour:    { label: "Rumour",     labelKo: "루머",     bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  imminent:  { label: "Imminent",   labelKo: "임박",     bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  rejected:  { label: "Rejected",   labelKo: "거절",     bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

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

const MOCK_TRANSFERS: TransferItem[] = [
  // ── 2026-04-02 ──────────────────────────────────────────────────────────
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

  // ── 2026-04-01 ──────────────────────────────────────────────────────────
  {
    id: 3,  player: "Bukayo Saka 🏴󠁧󠁢󠁥󠁮󠁧󠁿",  playerKo: "부카요 사카 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fromTeam: "Arsenal",        fromTeamKo: "아스날",           fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Arsenal",        toTeamKo:   "아스날",           toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "Extension", status: "confirmed", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-04-01", age: 24, nationality: "England", nationalityKo: "잉글랜드",
    position: "FWD", positionKo: "공격수", source: "David Ornstein",
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

  // ── 2026-03-31 ──────────────────────────────────────────────────────────
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

  // ── 2026-03-30 ──────────────────────────────────────────────────────────
  {
    id: 9,  player: "Florian Wirtz 🇩🇪",  playerKo: "플로리안 비르츠 🇩🇪",
    fromTeam: "Bayer Leverkusen", fromTeamKo: "바이어 레버쿠젠", fromFlag: "🇩🇪",
    toTeam:   "Liverpool",      toTeamKo:   "리버풀",           toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€150M", status: "confirmed", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-30", age: 22, nationality: "Germany", nationalityKo: "독일",
    position: "MID", positionKo: "미드필더", source: "Fabrizio Romano",
  },
  {
    id: 10, player: "Gavi 🇪🇸",             playerKo: "가비 🇪🇸",
    fromTeam: "Barcelona",      fromTeamKo: "바르셀로나",       fromFlag: "🇪🇸",
    toTeam:   "Bayern Munich",  toTeamKo:   "바이에른 뮌헨",    toFlag:   "🇩🇪",
    fee: "€80M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-30", age: 21, nationality: "Spain", nationalityKo: "스페인",
    position: "MID", positionKo: "미드필더", source: "Bild",
  },

  // ── 2026-03-28 ──────────────────────────────────────────────────────────
  {
    id: 11, player: "Phil Foden 🏴󠁧󠁢󠁥󠁮󠁧󠁿",   playerKo: "필 포든 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fromTeam: "Man City",       fromTeamKo: "맨체스터 시티",    fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Man City",       toTeamKo:   "맨체스터 시티",    toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "Extension", status: "confirmed", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-28", age: 25, nationality: "England", nationalityKo: "잉글랜드",
    position: "MID", positionKo: "미드필더", source: "Sky Sports",
  },
  {
    id: 12, player: "Lamine Yamal 🇪🇸",    playerKo: "라민 야말 🇪🇸",
    fromTeam: "Barcelona",      fromTeamKo: "바르셀로나",       fromFlag: "🇪🇸",
    toTeam:   "Man City",       toTeamKo:   "맨체스터 시티",    toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€200M", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-28", age: 18, nationality: "Spain", nationalityKo: "스페인",
    position: "FWD", positionKo: "공격수", source: "The Athletic",
  },

  // ── 2026-03-25 ──────────────────────────────────────────────────────────
  {
    id: 13, player: "Marcus Rashford 🏴󠁧󠁢󠁥󠁮󠁧󠁿", playerKo: "마커스 래쉬포드 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fromTeam: "Aston Villa",    fromTeamKo: "애스턴 빌라",      fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Aston Villa",    toTeamKo:   "애스턴 빌라",      toFlag:   "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    fee: "€35M", status: "confirmed", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-25", age: 28, nationality: "England", nationalityKo: "잉글랜드",
    position: "FWD", positionKo: "공격수", source: "BBC Sport",
  },
  {
    id: 14, player: "Rodri 🇪🇸",           playerKo: "로드리 🇪🇸",
    fromTeam: "Man City",       fromTeamKo: "맨체스터 시티",    fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "Barcelona",      toTeamKo:   "바르셀로나",       toFlag:   "🇪🇸",
    fee: "Free", status: "rumour", window: "Summer 2026", windowKo: "2026 여름",
    date: "2026-03-25", age: 29, nationality: "Spain", nationalityKo: "스페인",
    position: "MID", positionKo: "미드필더", source: "Marca",
  },

  // ── 2025-07-01 ──────────────────────────────────────────────────────────
  {
    id: 15, player: "Heung-Min Son 🇰🇷",   playerKo: "손흥민 🇰🇷",
    fromTeam: "Tottenham",      fromTeamKo: "토트넘",           fromFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    toTeam:   "LAFC",           toTeamKo:   "LAFC",             toFlag:   "🇺🇸",
    fee: "Free", status: "confirmed", window: "Summer 2025", windowKo: "2025 여름",
    date: "2025-07-01", age: 33, nationality: "South Korea", nationalityKo: "대한민국",
    position: "FWD", positionKo: "공격수", source: "Sky Sports",
  },
];

export default async function TransfersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isKo = locale === "ko";

  const labels = {
    title:        isKo ? "이적 소식" : "Transfer News",
    subtitle:     isKo ? "최신 선수 이적 및 계약 정보" : "Latest player transfers & contract news",
    player:       isKo ? "선수" : "Player",
    from:         isKo ? "이전 클럽" : "From",
    to:           isKo ? "새 클럽" : "To",
    fee:          isKo ? "이적료" : "Fee",
    status:       isKo ? "상태" : "Status",
    window:       isKo ? "이적 시장" : "Window",
    age:          isKo ? "나이" : "Age",
    position:     isKo ? "포지션" : "Position",
    nationality:  isKo ? "국적" : "Nationality",
    confirmed:    isKo ? "확정" : "Confirmed",
    recent:       isKo ? "최근 이적" : "Recent Transfers",
    rumours:      isKo ? "루머 & 임박" : "Rumours & Imminent",
  };

  const confirmed = MOCK_TRANSFERS.filter((t) => t.status === "confirmed");
  const pending   = MOCK_TRANSFERS.filter((t) => t.status !== "confirmed");

  const tickerItems = MOCK_TRANSFERS.map((t) => ({
    player:     t.player,
    playerKo:   t.playerKo,
    fromTeam:   t.fromTeam,
    fromTeamKo: t.fromTeamKo,
    toTeam:     t.toTeam,
    toTeamKo:   t.toTeamKo,
    fee:        t.fee,
    status:     t.status,
    source:     t.source,
  }));

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
              <h1 className="text-2xl font-black text-gray-900">{labels.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{labels.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {[
              { title: labels.recent, items: confirmed },
              { title: labels.rumours, items: pending },
            ].map(({ title, items }) => (
              <section key={title}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1 h-5 rounded-full bg-emerald-600 shrink-0" />
                  <h2 className="text-base font-bold text-gray-900">{title}</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {items.map((transfer, idx) => {
                    const s = STATUS_STYLES[transfer.status];
                    return (
                      <div
                        key={transfer.id}
                        className={`px-5 py-4 ${idx < items.length - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Player info */}
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

                            {/* Transfer route */}
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

                            {/* Meta */}
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

                          {/* Fee badge */}
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-black text-gray-900">{transfer.fee}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{relativeDate(transfer.date, isKo)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Stats summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{isKo ? "이적 현황" : "Transfer Summary"}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: isKo ? "확정" : "Confirmed", count: MOCK_TRANSFERS.filter(t => t.status === "confirmed").length, color: "text-emerald-600" },
                  { label: isKo ? "임박" : "Imminent",  count: MOCK_TRANSFERS.filter(t => t.status === "imminent").length,  color: "text-amber-600" },
                  { label: isKo ? "루머" : "Rumours",   count: MOCK_TRANSFERS.filter(t => t.status === "rumour").length,    color: "text-gray-600" },
                  { label: isKo ? "총계" : "Total",     count: MOCK_TRANSFERS.length,                                       color: "text-gray-900" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <div className={`text-2xl font-black ${color}`}>{count}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <AdSlot slotId="transfers-sidebar" size="rectangle" />
          </div>
        </div>
      </div>
    </main>
  );
}
