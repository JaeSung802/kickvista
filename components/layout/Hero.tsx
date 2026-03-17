"use client";

interface HeroProps {
  locale: "ko" | "en";
}

const TICKER_ITEMS = [
  { teams: "Arsenal 2–1 Man City",      statusEn: "LIVE 67'", statusKo: "라이브 67'", league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", isLive: true  },
  { teams: "Real Madrid 1–1 Barcelona", statusEn: "LIVE 45'", statusKo: "라이브 45'", league: "🇪🇸",          isLive: true  },
  { teams: "Bayern vs Dortmund",        statusEn: "18:30",    statusKo: "18:30",      league: "🇩🇪",          isLive: false },
  { teams: "PSG vs Marseille",          statusEn: "20:45",    statusKo: "20:45",      league: "🇫🇷",          isLive: false },
  { teams: "Juventus 0–2 Inter",        statusEn: "FT",       statusKo: "종료",       league: "🇮🇹",          isLive: false },
  { teams: "Liverpool 3–1 Chelsea",     statusEn: "FT",       statusKo: "종료",       league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",       isLive: false },
];

const content = {
  en: {
    badge:     "Live · AI-Powered · Free",
    headline1: "The Football Platform",
    headline2: "Built for Real Fans",
    subtext:
      "Live scores, standings, AI match analysis, and community — all in one place. Free, fast, bilingual.",
    ctaLive: "Live Scores",
    ctaAI:   "AI Analysis",
    stats: [
      { value: "6",    label: "Major Leagues"  },
      { value: "14+",  label: "Matches Today"  },
      { value: "30s",  label: "Live Updates"   },
      { value: "Free", label: "Open Access"    },
    ],
    tickerLabel: "LIVE",
  },
  ko: {
    badge:     "라이브 · AI 분석 · 무료",
    headline1: "진짜 팬을 위한",
    headline2: "축구 플랫폼",
    subtext:
      "라이브 스코어, 리그 순위, AI 분석, 팬 커뮤니티를 한 곳에서. 무료, 빠르고, 두 언어 지원.",
    ctaLive: "라이브 스코어",
    ctaAI:   "AI 분석",
    stats: [
      { value: "6",    label: "주요 리그"        },
      { value: "14+",  label: "오늘의 경기"      },
      { value: "30초", label: "실시간 업데이트"  },
      { value: "무료", label: "자유 이용"        },
    ],
    tickerLabel: "라이브",
  },
};

export default function Hero({ locale }: HeroProps) {
  const c = content[locale];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(34,197,94,0.07) 0%, transparent 65%), #0d1117",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #22c55e 30%, #22c55e 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      {/* Faint grid overlay — football pitch feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%)",
        }}
      />

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="flex flex-col items-center text-center gap-5">

          {/* Live badge */}
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.22)",
              color: "#4ade80",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block live-dot"
              style={{ background: "#22c55e" }}
            />
            {c.badge}
          </div>

          {/* Headline */}
          <div className="flex flex-col items-center gap-1">
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight leading-none"
              style={{ color: "#e6edf3" }}
            >
              {c.headline1}
            </h1>
            <span
              className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight leading-none"
              style={{
                background: "linear-gradient(90deg, #22c55e 0%, #4ade80 60%, #86efac 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {c.headline2}
            </span>
          </div>

          {/* Subtext */}
          <p
            className="max-w-md text-sm sm:text-base leading-relaxed"
            style={{ color: "#8b949e" }}
          >
            {c.subtext}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            <a
              href={`/${locale}/#matches`}
              className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: "#22c55e",
                color: "#052e0f",
                boxShadow: "0 0 20px rgba(34,197,94,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4ade80";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(34,197,94,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#22c55e";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(34,197,94,0.25)";
              }}
            >
              ⚽ {c.ctaLive}
            </a>
            <a
              href={`/${locale}/analysis`}
              className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid #30363d",
                color: "#e6edf3",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)";
                e.currentTarget.style.background = "rgba(34,197,94,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#30363d";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              ✦ {c.ctaAI}
            </a>
          </div>

          {/* Stats strip */}
          <div
            className="grid grid-cols-4 gap-px w-full max-w-xl mt-6 rounded-xl overflow-hidden"
            style={{ border: "1px solid #21262d", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
          >
            {c.stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center py-3 px-2"
                style={{
                  background: "#0d1117",
                  borderRight: i < c.stats.length - 1 ? "1px solid #21262d" : "none",
                }}
              >
                <span
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: "#e6edf3" }}
                >
                  {stat.value}
                </span>
                <span className="text-xs font-medium mt-0.5" style={{ color: "#8b949e" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live ticker */}
      <div
        style={{
          borderTop: "1px solid #1a2030",
          borderBottom: "1px solid #1a2030",
          background: "#080c12",
        }}
      >
        <div className="flex items-center">
          {/* Label pill */}
          <div
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-black tracking-widest z-10 self-stretch"
            style={{
              background: "#22c55e",
              color: "#052e0f",
              letterSpacing: "0.08em",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block live-dot shrink-0"
              style={{ background: "#064e1c" }}
            />
            {c.tickerLabel}
          </div>

          {/* Scrolling items */}
          <div className="ticker-viewport">
            <div className="ticker-track gap-8 px-6 py-2">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center gap-2 shrink-0"
                  style={{ textDecoration: "none" }}
                >
                  <span className="text-sm leading-none">{item.league}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#c9d1d9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#4ade80")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c9d1d9")}
                  >
                    {item.teams}
                  </span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={
                      item.isLive
                        ? { background: "rgba(34,197,94,0.14)", color: "#22c55e" }
                        : locale === "ko"
                          ? item.statusKo === "종료"
                            ? { background: "#0d1117", color: "#484f58" }
                            : { background: "#0d1117", color: "#8b949e" }
                          : item.statusEn === "FT"
                            ? { background: "#0d1117", color: "#484f58" }
                            : { background: "#0d1117", color: "#8b949e" }
                    }
                  >
                    {locale === "ko" ? item.statusKo : item.statusEn}
                  </span>
                  <span style={{ color: "#1a2030" }} className="text-sm select-none">|</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
