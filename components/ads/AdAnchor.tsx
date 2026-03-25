"use client";

/**
 * AdAnchor — mobile-only sticky anchor ad at the bottom of the viewport.
 *
 * Placement rules (AdSense policy):
 *  - Only on mobile (hidden on md+ breakpoints via Tailwind `md:hidden`)
 *  - Fixed to viewport bottom so it never overlaps scrollable content mid-page
 *  - "Advertisement" label always visible above the unit
 *  - Dismiss (✕) button lets the user close it — required for good UX score
 *  - `useEffect` mounts on client only → zero SSR output, no hydration mismatch
 *  - `env(safe-area-inset-bottom)` respects iPhone notch / home-indicator area
 *
 * Parent layout should add `pb-14 md:pb-0` to the main content wrapper so
 * the anchor never covers body content before the user dismisses it.
 */

import { useState, useEffect } from "react";
import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdAnchorProps {
  /**
   * AdSense slot ID. Defaults to NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR env var.
   * NEXT_PUBLIC_* vars are inlined at build time — safe to use in client components.
   */
  slot?: string;
}

// Evaluated at build time (Next.js inlines NEXT_PUBLIC_* into the client bundle).
const CLIENT_ID    = process.env.NEXT_PUBLIC_ADSENSE_ID           ?? "";
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR  ?? "";

export default function AdAnchor({ slot = DEFAULT_SLOT }: AdAnchorProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Render nothing on the server — avoids hydration mismatch and SSR ad calls
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  const isConfigured = Boolean(CLIENT_ID) && Boolean(slot);
  const missingVar   = !CLIENT_ID
    ? "NEXT_PUBLIC_ADSENSE_ID"
    : !slot
    ? "NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR"
    : null;

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingTop: 4,
      }}
    >
      {/* Label row with dismiss button */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: 2,
        }}
      >
        <AdLabel />
        <button
          onClick={() => setDismissed(true)}
          aria-label="Close advertisement"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            lineHeight: 1,
            color: "#9ca3af",
            background: "none",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            cursor: "pointer",
            padding: "2px 5px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Ad unit — 320×50 mobile banner */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          minHeight: 50,
          overflow: "hidden",
          borderRadius: 4,
        }}
      >
        {isConfigured ? (
          <GoogleAdUnit
            slot={slot}
            format="horizontal"
            style={{ minHeight: 50, width: "100%", display: "block" }}
          />
        ) : (
          <div
            data-ad-slot={slot || "unset"}
            style={{
              width: "100%",
              height: 50,
              backgroundColor: "#f9fafb",
              border: "1.5px dashed #d1d5db",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 500 }}>
              Google AdSense — 320 × 50 Mobile Anchor
            </span>
            {missingVar && (
              <span style={{ color: "#fca5a5", fontSize: 9, fontFamily: "monospace" }}>
                env missing: {missingVar}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
