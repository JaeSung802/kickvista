"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import UserMenu from "@/components/auth/UserMenu";

interface NavbarProps {
  locale: "ko" | "en";
  user?: {
    nickname: string;
    points: number;
    rankBadge: string;
    avatarUrl?: string;
    avatarBorderColor?: string;
    titleBadge?: string;
  } | null;
  dict?: {
    home?: string;
    leagues?: string;
    matches?: string;
    standings?: string;
    aiPicks?: string;
    teams?: string;
    community?: string;
    notice?: string;
    attendance?: string;
    transfers?: string;
  };
}

const defaultLabels = {
  en: {
    home:       "Home",
    leagues:    "Leagues",
    matches:    "Matches",
    standings:  "Standings",
    aiPicks:    "AI Picks",
    teams:      "Teams",
    community:  "Community",
    notice:     "📢 Notices",
    attendance: "Attendance",
    transfers:  "Transfer News",
  },
  ko: {
    home:       "홈",
    leagues:    "리그",
    matches:    "경기",
    standings:  "순위",
    aiPicks:    "AI 분석",
    teams:      "팀",
    community:  "커뮤니티",
    notice:     "📢 공지사항",
    attendance: "출석",
    transfers:  "이적 소식",
  },
};

export default function Navbar({ locale, user, dict }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const labels = { ...defaultLabels[locale], ...dict };

  const navLinks = [
    { label: labels.home,       href: `/${locale}` },
    { label: labels.leagues,    href: `/${locale}/leagues` },
    { label: labels.matches,    href: `/${locale}/league/epl` },
    { label: labels.standings,  href: `/${locale}/league/epl/standings` },
    { label: labels.aiPicks,    href: `/${locale}/analysis` },
    { label: labels.transfers,  href: `/${locale}/transfers` },
    { label: labels.teams,      href: `/${locale}/team` },
    { label: labels.community,  href: `/${locale}/community` },
    { label: labels.notice,     href: `/${locale}/notice` },
    { label: labels.attendance, href: `/${locale}/attendance` },
  ];

  function isActive(href: string) {
    const path    = href.split("#")[0].replace(/\/$/, "") || `/${locale}`;
    const current = pathname.replace(/\/$/, "") || `/${locale}`;
    if (path === `/${locale}`) return current === `/${locale}`;
    return current.startsWith(path);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: 56 }}>

          {/* Logo */}
          <a
            href={`/${locale}`}
            className="flex items-center gap-2 shrink-0 no-underline"
          >
            {/* Data Prism symbol */}
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <defs>
                <linearGradient id="kv-sym" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#kv-sym)"/>
              <polygon points="16,9 22.66,13.84 20.11,21.66 11.89,21.66 9.34,13.84"
                       fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2"/>
              <line x1="16"    y1="9"     x2="16"   y2="1.5"  stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="22.66" y1="13.84" x2="30"   y2="11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="20.11" y1="21.66" x2="24.5" y2="28"   stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="11.89" y1="21.66" x2="7.5"  y2="28"   stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="9.34"  y1="13.84" x2="2"    y2="11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <circle cx="16"    cy="9"     r="1.4" fill="#F59E0B"/>
              <circle cx="22.66" cy="13.84" r="1.4" fill="#F59E0B"/>
              <circle cx="20.11" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="11.89" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="9.34"  cy="13.84" r="1.4" fill="#F59E0B"/>
            </svg>
            {/* Wordmark */}
            <span className="text-lg font-black" style={{ letterSpacing: "-0.025em" }}>
              <span style={{ color: "#022C22" }}>Kick</span><span style={{ color: "#10B981" }}>Vista</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${active
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right: locale + coin badge + auth + mobile toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LocaleSwitcher currentLocale={locale} className="hidden sm:inline-flex" />

            {/* Coin badge — visible when logged in */}
            {user && (
              <a
                href={`/${locale}/settings#point-shop`}
                className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 no-underline hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                }}
                title={locale === "ko" ? "포인트 상점" : "Point Shop"}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>🪙</span>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: "#b45309" }}
                >
                  {user.points.toLocaleString()}
                </span>
              </a>
            )}

            <div className="hidden sm:inline-flex flex-shrink-0">
              <UserMenu
                user={user ?? null}
                locale={locale}
              />
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`
                    px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              );
            })}

            {/* Mobile auth */}
            <div className="flex items-center gap-3 pt-3 mt-1 border-t border-gray-200">
              <LocaleSwitcher currentLocale={locale} />
              <UserMenu user={user ?? null} locale={locale} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
