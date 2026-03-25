/**
 * AdSidebar — sticky desktop sidebar rectangle.
 *
 * Env vars (set in Vercel Dashboard → Environment Variables):
 *   NEXT_PUBLIC_ADSENSE_ID             → publisher ID
 *   NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE → slot ID for this unit
 *
 * slot prop is optional — defaults to NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE.
 *
 * Placement rules:
 *  - Use inside a sidebar <div> that is at least 300px wide
 *  - position: sticky; top: 24px so the ad follows the scroll naturally
 *  - Never at the very top of the sidebar — place after at least one content
 *    widget (e.g., standings card) to avoid accidental clicks on load
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdSidebarProps {
  /** Defaults to NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE. */
  slot?: string;
  /** "tall" → 300×600 half-page unit when vertical space allows. */
  variant?: "medium" | "tall";
  className?: string;
}

const CLIENT_ID       = process.env.NEXT_PUBLIC_ADSENSE_ID               ?? "";
const DEFAULT_SLOT    = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE   ?? "";

export default function AdSidebar({ slot = DEFAULT_SLOT, variant = "medium", className = "" }: AdSidebarProps) {
  const height = variant === "tall" ? 600 : 250;
  const label  = variant === "tall" ? "300 × 600 — Half Page" : "300 × 250 — Rectangle";

  const isConfigured = Boolean(CLIENT_ID) && Boolean(slot);
  const missingVar   = !CLIENT_ID
    ? "NEXT_PUBLIC_ADSENSE_ID"
    : !slot
    ? "NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE"
    : null;

  return (
    <div
      className={className}
      style={{
        position: "sticky",
        top: 24,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "flex-start",
      }}
    >
      <AdLabel />

      {/* Fixed-size container prevents layout shift */}
      <div
        style={{
          width: 300,
          minHeight: height,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
          maxWidth: "100%",
        }}
      >
        {isConfigured ? (
          <GoogleAdUnit
            slot={slot}
            format="vertical"
            style={{ minHeight: height, width: 300 }}
          />
        ) : (
          <div
            data-ad-slot={slot || "unset"}
            style={{
              width: "100%",
              height,
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
              Google AdSense — {label}
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
