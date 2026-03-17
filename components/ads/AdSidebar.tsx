/**
 * AdSidebar — sticky 300 × 250 sidebar rectangle.
 *
 * Placement rules:
 *  - Use inside a sidebar <div> that is at least 300px wide
 *  - `position: sticky; top: 24px` so the ad scrolls into view naturally
 *  - Never at the very top of the sidebar — always place after at least one
 *    content widget (e.g., standings card) to avoid accidental clicks on load
 *  - 0px margin from sibling widgets handled by parent gap
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdSidebarProps {
  slot: string;
  /** Use "tall" for 300×600 half-page unit when vertical space allows */
  variant?: "medium" | "tall";
  className?: string;
}

const isProd = Boolean(process.env.NEXT_PUBLIC_ADSENSE_ID);

export default function AdSidebar({ slot, variant = "medium", className = "" }: AdSidebarProps) {
  const height = variant === "tall" ? 600 : 250;
  const label  = variant === "tall" ? "300 × 600 — Half Page" : "300 × 250 — Rectangle";

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
        {isProd ? (
          <GoogleAdUnit
            slot={slot}
            format="vertical"
            style={{ minHeight: height, width: 300 }}
          />
        ) : (
          <div
            data-ad-slot={slot}
            style={{
              width: "100%",
              height,
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
            <span style={{ color: "#30363d", fontSize: 11, zIndex: 1 }}>{label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
