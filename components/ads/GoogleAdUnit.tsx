"use client";

/**
 * GoogleAdUnit — renders a real AdSense <ins> element in production.
 * Lazy-loads via IntersectionObserver (rootMargin: 300px) so ads never
 * block the initial render and only initialise when near the viewport.
 *
 * In dev (NEXT_PUBLIC_ADSENSE_ID not set) this component renders nothing;
 * the parent placeholder is shown instead.
 */

import { useEffect, useRef } from "react";

interface GoogleAdUnitProps {
  /** AdSense data-ad-slot value (from your AdSense dashboard) */
  slot: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal" | "fluid";
  style?: React.CSSProperties;
  className?: string;
  /**
   * data-full-width-responsive. true (default) lets AdSense widen the unit to
   * the screen and choose its height on mobile; banners pass false so the unit
   * keeps a banner shape instead of growing into a tall block.
   */
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function GoogleAdUnit({
  slot,
  format = "auto",
  style,
  className,
  fullWidthResponsive = true,
}: GoogleAdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  // One push per unit, once, on mount. push({}) does not name the unit it is
  // for, so a push cannot be tied to the unit that made it; pushing exactly once
  // per mounted unit keeps the number of pushes equal to the number of units.
  // (Pushing lazily on intersection lost pushes in local mock tests when an
  // unfilled unit collapsed before its own push ran.) The ref keeps it to one
  // push per mount, also under React Strict Mode's double effect in development.
  useEffect(() => {
    if (pushed.current || !containerRef.current) return;
    pushed.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (err) {
      // Only the error type: AdSense messages can carry the client ID or URLs.
      console.warn("[ads] adsbygoogle.push failed:", err instanceof Error ? err.name : typeof err);
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  if (!clientId) return null;

  return (
    <div ref={containerRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
