/**
 * AdBanner — full-width leaderboard banner (728 × 90 on desktop, responsive).
 *
 * Env vars (set in Vercel Dashboard → Environment Variables):
 *   NEXT_PUBLIC_ADSENSE_ID          → publisher ID  (ca-pub-XXXXXXXXXXXXXXXX)
 *   NEXT_PUBLIC_ADSENSE_SLOT_BANNER → slot ID for this unit
 *
 * slot prop is optional — defaults to NEXT_PUBLIC_ADSENSE_SLOT_BANNER.
 * When either env var is absent the component shows a dev placeholder instead
 * of throwing, so local development and staging environments are unaffected.
 *
 * Policy compliance:
 *  - "Advertisement" label always visible above the unit
 *  - 16px vertical margin isolates the ad from surrounding content
 *  - Fixed min-height reserves space before load → zero layout shift
 *  - Never placed adjacent to navigation or clickable logo areas
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdBannerProps {
  /**
   * AdSense slot ID. Defaults to NEXT_PUBLIC_ADSENSE_SLOT_BANNER env var.
   * Pass explicitly only when you need a different slot on the same page.
   */
  slot?: string;
  className?: string;
}

// Read env vars once at module level (evaluated at server render time).
const CLIENT_ID    = process.env.NEXT_PUBLIC_ADSENSE_ID            ?? "";
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER   ?? "";

export default function AdBanner({ slot = DEFAULT_SLOT, className = "" }: AdBannerProps) {
  // Both the publisher ID and the slot must be present to render a real ad.
  const isConfigured = Boolean(CLIENT_ID) && Boolean(slot);

  // Placeholder label helps developers diagnose which env var is missing.
  const missingVar = !CLIENT_ID
    ? "NEXT_PUBLIC_ADSENSE_ID"
    : !slot
    ? "NEXT_PUBLIC_ADSENSE_SLOT_BANNER"
    : null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        margin: "16px 0",
      }}
    >
      <AdLabel />

      {/* Reserved container — fixed min-height prevents layout shift */}
      <div
        style={{
          width: "100%",
          maxWidth: 728,
          minHeight: 90,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isConfigured ? (
          <GoogleAdUnit
            slot={slot}
            format="horizontal"
            style={{ minHeight: 90, width: "100%" }}
          />
        ) : (
          <div
            data-ad-slot={slot || "unset"}
            style={{
              width: "100%",
              height: 90,
              backgroundColor: "#f9fafb",
              border: "1.5px dashed #d1d5db",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500 }}>
              Google AdSense — 728 × 90 Banner
            </span>
            {missingVar && (
              <span style={{ color: "#fca5a5", fontSize: 10, fontFamily: "monospace" }}>
                env missing: {missingVar}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
