"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

// Kept for backward compatibility with GoToRecapButton import (cleanup in later phase)
export const SWITCH_TAB_EVENT = "match-switch-tab";

interface Tab {
  id: string;
  label: string;
}

interface MatchTabNavProps {
  tabs: Tab[];
  activeTab: string;
  matchId: string;
  locale: string;
}

export default function MatchTabNav({ tabs, activeTab, matchId, locale }: MatchTabNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the tab bar so the active tab button is visible on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (!el) return;
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const target = container.scrollLeft + (er.left - cr.left) - cr.width / 2 + er.width / 2;
    container.scrollTo({ left: target, behavior: "smooth" });
  }, [activeTab]);

  return (
    <div
      className="sticky z-40 bg-white border-b border-gray-200"
      style={{ top: 56 }}
    >
      <div
        ref={containerRef}
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div
          className="flex items-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ flexWrap: "nowrap", minWidth: "max-content" }}
        >
          {tabs.map(({ label, id }) => {
            const isActive = id === activeTab;
            const href =
              id === "facts"
                ? `/${locale}/match/${matchId}`
                : `/${locale}/match/${matchId}?tab=${id}`;
            return (
              <Link
                key={id}
                href={href}
                data-tab={id}
                prefetch={false}
                scroll={false}
                replace
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "inline-block",
                  padding: "13px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#059669" : "#6b7280",
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #059669" : "2px solid transparent",
                  whiteSpace: "nowrap" as const,
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  flexShrink: 0,
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`[data-tab]::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
