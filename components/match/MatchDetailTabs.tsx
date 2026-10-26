"use client";
/**
 * MatchDetailTabs — tab bar + panels for the match page (?tab=<id>).
 *
 * All panels are rendered on the server from the one fixture response; a tab
 * click only shows another panel and replaces the URL (history.replaceState),
 * so switching tabs makes no request and Back leaves the match page. Each tab
 * is still a real link (new tab / no-JS open the server-rendered tab).
 * Adapted from the redesign branch's link-based MatchTabNav.
 */

import { useState, type MouseEvent, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { matchTabHref } from "@/lib/match/tabs";

export interface MatchTabPanel {
  id: string;
  label: string;
  content: ReactNode;
}

export default function MatchDetailTabs({
  locale, matchId, initialTab, panels, sidebar,
}: {
  locale: Locale;
  matchId: string;
  initialTab: string;
  panels: MatchTabPanel[];
  /** Right column (prediction card, ad) — stays the same for every tab. */
  sidebar: ReactNode;
}) {
  const [active, setActive] = useState(initialTab);

  function select(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setActive(id);
    window.history.replaceState(null, "", matchTabHref(locale, matchId, id));
  }

  return (
    <>
      <nav
        aria-label={locale === "ko" ? "경기 상세 탭" : "Match tabs"}
        className="sticky z-30 border-b border-gray-200 bg-white"
        style={{ top: 56 }}
      >
        <div className="mx-auto flex max-w-4xl items-center overflow-x-auto px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: "none" }}>
          {panels.map((tab) => {
            const isActive = tab.id === active;
            return (
              <a
                key={tab.id}
                href={matchTabHref(locale, matchId, tab.id)}
                data-tab={tab.id}
                onClick={(e) => select(e, tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] transition-colors ${
                  isActive ? "border-emerald-600 font-bold text-emerald-600" : "border-transparent font-medium text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </nav>
      <div className="mx-auto max-w-4xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2" data-active-tab={active}>
            {panels.map((tab) => (
              <div key={tab.id} data-tab-panel={tab.id} hidden={tab.id !== active}>
                {tab.content}
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-6">{sidebar}</div>
        </div>
      </div>
    </>
  );
}
