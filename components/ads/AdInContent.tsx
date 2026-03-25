/**
 * AdInContent — medium rectangle (336 × 280) inserted between content blocks.
 *
 * Env vars (set in Vercel Dashboard → Environment Variables):
 *   NEXT_PUBLIC_ADSENSE_ID               → publisher ID
 *   NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT  → slot ID for this unit
 *
 * slot prop is optional — defaults to NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT.
 *
 * Placement rules (AdSense policy):
 *  - Insert after paragraph 1 and paragraph 3 in long-form articles
 *  - Never between a question and its answer or inside a code block
 *  - 24px top/bottom margin clearly separates the ad from surrounding text
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdInContentProps {
  /** Defaults to NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT. */
  slot?: string;
  className?: string;
}

const CLIENT_ID    = process.env.NEXT_PUBLIC_ADSENSE_ID                ?? "";
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT  ?? "";

export default function AdInContent({ slot = DEFAULT_SLOT, className = "" }: AdInContentProps) {
  const isConfigured = Boolean(CLIENT_ID) && Boolean(slot);
  const missingVar   = !CLIENT_ID
    ? "NEXT_PUBLIC_ADSENSE_ID"
    : !slot
    ? "NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT"
    : null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        margin: "24px auto",
        width: "100%",
        maxWidth: 336,
      }}
    >
      <AdLabel />

      {/* Reserved space — 280px height prevents layout shift */}
      <div
        style={{
          width: "100%",
          minHeight: 280,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isConfigured ? (
          <GoogleAdUnit
            slot={slot}
            format="rectangle"
            style={{ minHeight: 280, width: "100%" }}
          />
        ) : (
          <div
            data-ad-slot={slot || "unset"}
            style={{
              width: "100%",
              height: 280,
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
              Google AdSense — 336 × 280 In-Content
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
