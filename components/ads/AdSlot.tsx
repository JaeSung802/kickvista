/**
 * AdSlot — general-purpose ad placement.
 *
 * In development (NEXT_PUBLIC_ADSENSE_ID not set): renders a styled placeholder.
 * In production: renders a real GoogleAdUnit <ins> element.
 *
 * For new placements prefer the semantic variants:
 *   AdBanner    — leaderboard, top of page
 *   AdInContent — between content paragraphs
 *   AdSidebar   — sticky sidebar rectangle / half-page
 *
 * AdSlot remains for backward-compat with existing page layouts.
 *
 * Slot IDs come from env vars so one env change swaps all placements:
 *   NEXT_PUBLIC_ADSENSE_SLOT_BANNER      → leaderboard / banner
 *   NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE   → rectangle sidebar
 *   NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT  → in-content
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

type AdSize = "leaderboard" | "rectangle" | "skyscraper" | "banner";

interface AdSlotProps {
  slotId: string;
  size: AdSize;
  className?: string;
}

const sizeDimensions: Record<AdSize, { width: number; height: number; label: string; format: "horizontal" | "vertical" | "rectangle" | "auto" }> = {
  leaderboard: { width: 728, height: 90,  label: "728 × 90",  format: "horizontal" },
  rectangle:   { width: 300, height: 250, label: "300 × 250", format: "rectangle"  },
  skyscraper:  { width: 160, height: 600, label: "160 × 600", format: "vertical"   },
  banner:      { width: 468, height: 60,  label: "468 × 60",  format: "horizontal" },
};

/** Map size → env var slot ID so all leaderboards share one slot, etc. */
function resolveSlot(size: AdSize): string {
  switch (size) {
    case "leaderboard":
    case "banner":
      return process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER     ?? "0000000000";
    case "rectangle":
    case "skyscraper":
      return process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE  ?? "1111111111";
  }
}

const isProd = Boolean(process.env.NEXT_PUBLIC_ADSENSE_ID);

export default function AdSlot({ slotId, size, className = "" }: AdSlotProps) {
  const { width, height, label, format } = sizeDimensions[size];
  const slot = resolveSlot(size);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`} style={{ margin: "8px 0" }}>
      <AdLabel />

      <div
        style={{
          width: "100%",
          maxWidth: width,
          minHeight: height,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isProd ? (
          <GoogleAdUnit
            slot={slot}
            format={format}
            style={{ minHeight: height, width: "100%" }}
          />
        ) : (
          <div
            data-slot-id={slotId}
            style={{
              width: "100%",
              height,
              backgroundColor: "#161b22",
              border: "1.5px dashed #30363d",
              borderRadius: 6,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <div className="ad-shimmer-sweep" />
            <span style={{ color: "#8b949e", fontSize: 12, fontWeight: 500, zIndex: 1 }}>
              Google AdSense
            </span>
            <span style={{ color: "#30363d", fontSize: 11, zIndex: 1 }}>{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
