"use client";

interface FooterProps {
  locale: "ko" | "en";
}

interface FooterLink {
  label: string;
  href: string;
}

const buildContent = (locale: string) => ({
  en: {
    tagline:
      "Your daily football dashboard. Live scores, AI-powered analysis, and fan discussion for every major league.",
    sections: {
      Leagues: [
        { label: "Premier League",     href: `/${locale}/league/premier-league` },
        { label: "La Liga",            href: `/${locale}/league/la-liga` },
        { label: "Bundesliga",         href: `/${locale}/league/bundesliga` },
        { label: "Serie A",            href: `/${locale}/league/serie-a` },
        { label: "Ligue 1",            href: `/${locale}/league/ligue-1` },
        { label: "Champions League",   href: `/${locale}/league/champions-league` },
      ] as FooterLink[],
      Features: [
        { label: "Live Scores",        href: `/${locale}/#matches` },
        { label: "AI Match Analysis",  href: `/${locale}/analysis` },
        { label: "Standings",          href: `/${locale}/#standings` },
        { label: "Community",          href: `/${locale}/community` },
        { label: "Attendance",         href: `/${locale}/attendance` },
      ] as FooterLink[],
      Company: [
        { label: "About KickVista",    href: "#" },
        { label: "Contact",            href: "mailto:support@kickvista.io" },
        { label: "Privacy Policy",     href: `/${locale}/privacy` },
        { label: "Terms of Service",   href: `/${locale}/terms` },
        { label: "Advertise",          href: "mailto:ads@kickvista.io" },
      ] as FooterLink[],
    },
    copyright:
      "© 2026 KickVista. All rights reserved. Football data is provided for entertainment purposes only.",
    policy: [
      { label: "Privacy", href: `/${locale}/privacy` },
      { label: "Terms",   href: `/${locale}/terms` },
      { label: "Cookies", href: `/${locale}/privacy#cookies` },
    ] as FooterLink[],
  },
  ko: {
    tagline:
      "매일 완성되는 축구 허브. 라이브 스코어, AI 분석, 주요 리그 팬 커뮤니티를 한 곳에서.",
    sections: {
      리그: [
        { label: "프리미어리그",         href: `/${locale}/league/premier-league` },
        { label: "라리가",               href: `/${locale}/league/la-liga` },
        { label: "분데스리가",            href: `/${locale}/league/bundesliga` },
        { label: "세리에 A",             href: `/${locale}/league/serie-a` },
        { label: "리그 1",               href: `/${locale}/league/ligue-1` },
        { label: "UEFA 챔피언스리그",     href: `/${locale}/league/champions-league` },
      ] as FooterLink[],
      기능: [
        { label: "라이브 스코어",         href: `/${locale}/#matches` },
        { label: "AI 경기 분석",          href: `/${locale}/analysis` },
        { label: "순위표",               href: `/${locale}/#standings` },
        { label: "커뮤니티",             href: `/${locale}/community` },
        { label: "출석 체크",             href: `/${locale}/attendance` },
      ] as FooterLink[],
      회사: [
        { label: "KickVista 소개",       href: "#" },
        { label: "문의하기",             href: "mailto:support@kickvista.io" },
        { label: "개인정보처리방침",       href: `/${locale}/privacy` },
        { label: "이용약관",             href: `/${locale}/terms` },
        { label: "광고 문의",             href: "mailto:ads@kickvista.io" },
      ] as FooterLink[],
    },
    copyright:
      "© 2026 KickVista. All rights reserved. 축구 데이터는 오락 목적으로 제공됩니다.",
    policy: [
      { label: "개인정보",  href: `/${locale}/privacy` },
      { label: "이용약관",  href: `/${locale}/terms` },
      { label: "쿠키",      href: `/${locale}/privacy#cookies` },
    ] as FooterLink[],
  },
});

const SOCIAL_LINKS = [
  { icon: "𝕏", label: "X / Twitter",  href: "#" },
  { icon: "📘", label: "Facebook",     href: "#" },
  { icon: "📸", label: "Instagram",    href: "#" },
  { icon: "▶️", label: "YouTube",      href: "#" },
];

export default function Footer({ locale }: FooterProps) {
  const all = buildContent(locale);
  const c = all[locale];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <a href={`/${locale}`} className="flex items-center gap-2 mb-4 no-underline">
              {/* Data Prism symbol — muted monochrome for footer */}
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden>
                <defs>
                  <linearGradient id="ft-sym" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#022C22" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.7"/>
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="15.5" fill="url(#ft-sym)"/>
                <polygon points="16,9 22.66,13.84 20.11,21.66 11.89,21.66 9.34,13.84"
                         fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2"/>
                <line x1="16"    y1="9"     x2="16"   y2="1.5"  stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                <line x1="22.66" y1="13.84" x2="30"   y2="11.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                <line x1="20.11" y1="21.66" x2="24.5" y2="28"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                <line x1="11.89" y1="21.66" x2="7.5"  y2="28"   stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                <line x1="9.34"  y1="13.84" x2="2"    y2="11.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                <circle cx="16"    cy="9"     r="1.3" fill="#F59E0B" opacity="0.7"/>
                <circle cx="22.66" cy="13.84" r="1.3" fill="#F59E0B" opacity="0.7"/>
                <circle cx="20.11" cy="21.66" r="1.3" fill="#F59E0B" opacity="0.7"/>
                <circle cx="11.89" cy="21.66" r="1.3" fill="#F59E0B" opacity="0.7"/>
                <circle cx="9.34"  cy="13.84" r="1.3" fill="#F59E0B" opacity="0.7"/>
              </svg>
              <span className="text-lg font-black" style={{ letterSpacing: "-0.025em" }}>
                <span style={{ color: "#022C22" }}>Kick</span><span style={{ color: "#10B981" }}>Vista</span>
              </span>
            </a>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">{c.tagline}</p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 transition-colors no-underline"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(c.sections).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {(links as FooterLink[]).map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-gray-700 transition-colors no-underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">{c.copyright}</p>
          <div className="flex items-center gap-4">
            {(c.policy as FooterLink[]).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors no-underline"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
