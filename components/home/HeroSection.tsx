/**
 * HeroSection — Server Component
 *
 * "Emerald Data Prism" brand identity: deep→vibrant emerald gradient
 * with geometric polygon network decoration and gold accent CTAs.
 */

import type { Locale } from "@/lib/i18n";

interface HeroSectionProps {
  locale: Locale;
}

const content = {
  en: {
    badge:    "Live · Free · AI-Powered",
    heading1: "Football, Scores &",
    heading2: "Analysis",
    heading3: "All in One Place",
    subtext:
      "Live scores, league standings, AI match insights, and fan community — Premier League, La Liga, Bundesliga, Serie A and more.",
    ctaPrimary:   "Today's Matches",
    ctaSecondary: "AI Analysis",
    ctaCommunity: "Community",
    stats: [
      { value: "6",      label: "Major Leagues"   },
      { value: "98+",    label: "Matches / Week"  },
      { value: "Live",   label: "Score Updates"   },
      { value: "Free",   label: "No Sign-up"      },
    ],
  },
  ko: {
    badge:    "실시간 · 무료 · AI 분석",
    heading1: "축구의 모든 것,",
    heading2: "스코어·분석·커뮤니티",
    heading3: "한 곳에서",
    subtext:
      "라이브 스코어, 리그 순위, AI 경기 분석, 팬 커뮤니티 — 프리미어리그, 라리가, 분데스리가, 세리에A를 한 번에.",
    ctaPrimary:   "오늘의 경기",
    ctaSecondary: "AI 분석",
    ctaCommunity: "커뮤니티",
    stats: [
      { value: "6",      label: "주요 리그"         },
      { value: "98+",    label: "경기 / 주"          },
      { value: "실시간", label: "스코어 업데이트"    },
      { value: "무료",   label: "회원가입 불필요"    },
    ],
  },
};

export default function HeroSection({ locale }: HeroSectionProps) {
  const c = content[locale];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #011710 0%, #022C22 40%, #064E3B 100%)",
      }}
    >
      {/* Gold top accent line */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: "linear-gradient(90deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)" }}
      />

      {/* ── Geometric data-network decoration ────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Large pentagon (scaled logo symbol) — right side */}
        <svg
          className="absolute hidden lg:block"
          style={{ right: -60, top: "50%", transform: "translateY(-50%)", opacity: 0.07 }}
          width="460" height="460" viewBox="0 0 460 460" fill="none"
          aria-hidden
        >
          {/* Pentagon: r=200 from (230,230) */}
          <polygon points="230,30 420,177 350,397 110,397 40,177"
                   stroke="#6ee7b7" strokeWidth="2" fill="none"/>
          <line x1="230" y1="30"  x2="230" y2="0"   stroke="#F59E0B" strokeWidth="1.5"/>
          <line x1="420" y1="177" x2="459" y2="164" stroke="#F59E0B" strokeWidth="1.5"/>
          <line x1="350" y1="397" x2="385" y2="450" stroke="#F59E0B" strokeWidth="1.5"/>
          <line x1="110" y1="397" x2="75"  y2="450" stroke="#F59E0B" strokeWidth="1.5"/>
          <line x1="40"  y1="177" x2="1"   y2="164" stroke="#F59E0B" strokeWidth="1.5"/>
          <circle cx="230" cy="30"  r="5" fill="#F59E0B"/>
          <circle cx="420" cy="177" r="5" fill="#F59E0B"/>
          <circle cx="350" cy="397" r="5" fill="#F59E0B"/>
          <circle cx="110" cy="397" r="5" fill="#F59E0B"/>
          <circle cx="40"  cy="177" r="5" fill="#F59E0B"/>
          {/* Inner connections */}
          <line x1="230" y1="30"  x2="350" y2="397" stroke="#6ee7b7" strokeWidth="0.5"/>
          <line x1="420" y1="177" x2="110" y2="397" stroke="#6ee7b7" strokeWidth="0.5"/>
          <line x1="350" y1="397" x2="40"  y2="177" stroke="#6ee7b7" strokeWidth="0.5"/>
          <line x1="110" y1="397" x2="420" y2="177" stroke="#6ee7b7" strokeWidth="0.5"/>
          <line x1="40"  y1="177" x2="230" y2="30"  stroke="#6ee7b7" strokeWidth="0.5"/>
        </svg>

        {/* Small floating nodes — scattered */}
        <div className="absolute" style={{ left: "8%",  top: "20%", width: 5, height: 5, borderRadius: "50%", background: "rgba(245,158,11,0.35)" }}/>
        <div className="absolute" style={{ left: "15%", top: "70%", width: 3, height: 3, borderRadius: "50%", background: "rgba(110,231,183,0.4)" }}/>
        <div className="absolute" style={{ left: "30%", top: "15%", width: 4, height: 4, borderRadius: "50%", background: "rgba(245,158,11,0.25)" }}/>
        <div className="absolute" style={{ right: "10%", top: "75%", width: 4, height: 4, borderRadius: "50%", background: "rgba(110,231,183,0.3)" }}/>

        {/* Subtle horizontal rule */}
        <div className="absolute" style={{ left: 0, right: 0, bottom: "28%", height: 1, background: "rgba(255,255,255,0.03)" }}/>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 sm:pt-16 sm:pb-14">
        <div className="max-w-2xl">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-5"
            style={{
              color: "#F59E0B",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#F59E0B" }}/>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#F59E0B" }}/>
            </span>
            {c.badge}
          </span>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            {c.heading1}
            <br />
            <span style={{ color: "#6ee7b7" }}>{c.heading2}</span>
            <br />
            {c.heading3}
          </h1>

          {/* Sub-text */}
          <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: "rgba(110,231,183,0.8)" }}>
            {c.subtext}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {/* Primary — emerald gradient with gold border */}
            <a
              href={`/${locale}/#matches`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #022C22, #10B981)",
                color: "#fff",
                border: "1.5px solid rgba(245,158,11,0.5)",
              }}
              onMouseEnter={undefined}
            >
              ⚽ {c.ctaPrimary}
            </a>

            {/* AI Analysis — gold accent */}
            <a
              href={`/${locale}/analysis`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors"
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.35)",
              }}
            >
              🤖 {c.ctaSecondary}
            </a>

            {/* Community — emerald ghost */}
            <a
              href={`/${locale}/community`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors"
              style={{
                background: "rgba(110,231,183,0.1)",
                color: "rgba(110,231,183,0.9)",
                border: "1px solid rgba(110,231,183,0.25)",
              }}
            >
              💬 {c.ctaCommunity}
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="mt-10 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6"
          style={{ borderTop: "1px solid rgba(5,150,105,0.4)" }}
        >
          {c.stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-sm mt-0.5" style={{ color: "rgba(110,231,183,0.7)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
