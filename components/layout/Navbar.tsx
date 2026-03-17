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
  } | null;
  dict?: {
    home?: string;
    leagues?: string;
    matches?: string;
    standings?: string;
    aiPicks?: string;
    community?: string;
    attendance?: string;
  };
}

const defaultLabels = {
  en: {
    home:       "Home",
    leagues:    "Leagues",
    matches:    "Matches",
    standings:  "Standings",
    aiPicks:    "AI Picks",
    community:  "Community",
    attendance: "Attendance",
  },
  ko: {
    home:       "홈",
    leagues:    "리그",
    matches:    "경기",
    standings:  "순위",
    aiPicks:    "AI 분석",
    community:  "커뮤니티",
    attendance: "출석",
  },
};

export default function Navbar({ locale, user, dict }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const labels = { ...defaultLabels[locale], ...dict };

  function isActive(href: string) {
    // Strip hash anchors for comparison
    const path = href.split("#")[0].replace(/\/$/, "") || `/${locale}`;
    const current = pathname.replace(/\/$/, "") || `/${locale}`;
    if (path === `/${locale}`) return current === `/${locale}`;
    return current.startsWith(path);
  }

  const navLinks = [
    { label: labels.home,       href: `/${locale}` },
    { label: labels.leagues,    href: `/${locale}/#leagues` },
    { label: labels.matches,    href: `/${locale}/#matches` },
    { label: labels.standings,  href: `/${locale}/#standings` },
    { label: labels.aiPicks,    href: `/${locale}/analysis` },
    { label: labels.community,  href: `/${locale}/community` },
    { label: labels.attendance, href: `/${locale}/attendance` },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(13,17,23,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #21262d",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15" style={{ height: 56 }}>

          {/* Logo */}
          <a href={`/${locale}`} className="flex items-center gap-2 shrink-0" style={{ textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10.5" stroke="#22c55e" strokeWidth="1.5"/>
              <path d="M12 6.5L14.5 10H17.5L15.5 12.5L16.5 16L12 13.5L7.5 16L8.5 12.5L6.5 10H9.5L12 6.5Z" fill="#22c55e"/>
            </svg>
            <span className="text-lg font-black tracking-tight" style={{ color: "#e6edf3", letterSpacing: "-0.02em" }}>
              Kick<span style={{ color: "#22c55e" }}>Vista</span>
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
                  className="px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    color: active ? "#22c55e" : "#8b949e",
                    background: active ? "rgba(34,197,94,0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "#e6edf3";
                      e.currentTarget.style.background = "#161b22";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "#8b949e";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right: locale + login + mobile toggle */}
          <div className="flex items-center gap-2">
            <LocaleSwitcher currentLocale={locale} className="hidden sm:inline-flex" />
            <div className="hidden sm:inline-flex">
              <UserMenu user={user ?? null} locale={locale} />
            </div>

            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "#8b949e" }}
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8b949e")}
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
        <div style={{ background: "#0d1117", borderTop: "1px solid #21262d" }} className="md:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: active ? "#22c55e" : "#8b949e",
                    background: active ? "rgba(34,197,94,0.08)" : "transparent",
                  }}
                  onClick={() => setMobileOpen(false)}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#161b22";
                      e.currentTarget.style.color = "#e6edf3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = active ? "rgba(34,197,94,0.08)" : "transparent";
                      e.currentTarget.style.color = active ? "#22c55e" : "#8b949e";
                    }
                  }}
                >
                  {link.label}
                </a>
              );
            })}

            <div
              className="flex items-center gap-3 pt-3 mt-1"
              style={{ borderTop: "1px solid #21262d" }}
            >
              <LocaleSwitcher currentLocale={locale} />
              <UserMenu user={user ?? null} locale={locale} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
