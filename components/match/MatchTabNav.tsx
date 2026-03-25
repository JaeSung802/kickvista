"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Tab {
  label: string;
  idx: number;
}

interface MatchTabNavProps {
  tabs: Tab[];
  defaultTabIdx: number;
}

export const SWITCH_TAB_EVENT = "match-switch-tab";

/** px from viewport top that counts as "section is active" */
const SPY_OFFSET = 130;

export default function MatchTabNav({ tabs, defaultTabIdx }: MatchTabNavProps) {
  const [activeIdx, setActiveIdx] = useState(defaultTabIdx);

  // Ref-based lock: prevents scroll spy from fighting programmatic scrolls
  const locked = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Scroll to a section and lock spy for 900 ms */
  const switchTo = useCallback((idx: number) => {
    setActiveIdx(idx);

    locked.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      locked.current = false;
    }, 900);

    const section = document.getElementById(`tab-${idx}`);
    if (!section) {
      console.warn("[MatchTabNav] section not found for tab-" + idx + ", scrolling to bottom");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }

    const offset = window.innerWidth < 768 ? 110 : 130;
    const y = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // ── Scroll spy ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const indices = tabs.map((t) => t.idx);

    function detect() {
      if (locked.current) return;

      // Find the section whose top is closest to (and at or above) SPY_OFFSET
      let bestIdx: number | null = null;
      let bestDist = Infinity;

      for (const idx of indices) {
        const el = document.getElementById(`tab-${idx}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= SPY_OFFSET) {
          const dist = SPY_OFFSET - top;
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        }
      }

      if (bestIdx !== null) setActiveIdx(bestIdx);
    }

    window.addEventListener("scroll", detect, { passive: true });
    return () => window.removeEventListener("scroll", detect);
  }, [tabs]);

  // ── CustomEvent listener (from GoToRecapButton etc.) ───────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      switchTo((e as CustomEvent<number>).detail);
    };
    window.addEventListener(SWITCH_TAB_EVENT, handler);
    return () => window.removeEventListener(SWITCH_TAB_EVENT, handler);
  }, [switchTo]);

  // Cleanup lock timer on unmount
  useEffect(() => () => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
  }, []);

  return (
    /*
     * top-14 = 56px = exact Navbar height → eliminates the 8px sticky gap.
     * Scrollable wrapper is on the outer div so the bar scrolls as one unit on mobile.
     */
    <div
      className="sticky z-40 bg-white border-b border-gray-200"
      style={{ top: 56 }}
    >
      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div
          className="flex items-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ flexWrap: "nowrap", minWidth: "max-content" }}
        >
          {tabs.map(({ label, idx }) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={idx}
                onClick={() => switchTo(idx)}
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
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Hide webkit scrollbar via inline style tag */}
      <style>{`.match-tab-nav-scroll::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
