/**
 * AdBanner — full-width leaderboard banner (728 × 90 on desktop, responsive).
 *
 * Usage: replace <AdSlot size="leaderboard" /> with <AdBanner slot="..." />
 *
 * Policy compliance:
 *  - "Advertisement" label is always visible above the unit
 *  - 16px vertical margin isolates the ad from surrounding content
 *  - Fixed min-height reserves space before load → zero layout shift
 *  - Never placed adjacent to navigation or clickable logo areas
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdBannerProps {
  /** AdSense slot ID (from dashboard). Falls back to styled placeholder in dev. */
  slot: string;
  className?: string;
}

const isProd = Boolean(process.env.NEXT_PUBLIC_ADSENSE_ID);

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        /* 16px vertical breathing room from surrounding content */
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
        {isProd ? (
          <GoogleAdUnit
            slot={slot}
            format="horizontal"
            style={{ minHeight: 90, width: "100%" }}
          />
        ) : (
          /* Dev placeholder — identical visual to existing AdSlot leaderboard */
          <div
            data-ad-slot={slot}
            style={{
              width: "100%",
              height: 90,
              backgroundColor: "#161b22",
              border: "1.5px dashed #30363d",
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
            <div className="ad-shimmer-sweep" />
            <span style={{ color: "#8b949e", fontSize: 12, fontWeight: 500, zIndex: 1 }}>
              Google AdSense
            </span>
            <span style={{ color: "#30363d", fontSize: 11, zIndex: 1 }}>728 × 90 — Banner</span>
          </div>
        )}
      </div>
    </div>
  );
}
