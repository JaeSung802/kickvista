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
}: GoogleAdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !containerRef.current) return;

    const el = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || pushed.current) return;
        try {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushed.current = true;
        } catch {
          // adsbygoogle not ready yet; script's onload will handle it
        }
        observer.disconnect();
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
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
        data-full-width-responsive="true"
      />
    </div>
  );
}
