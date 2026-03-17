/**
 * AdInContent — medium rectangle (336 × 280) inserted between content blocks.
 *
 * Placement rules (AdSense policy):
 *  - Insert after paragraph 1 and paragraph 3 in long-form articles
 *  - Never between a question and its answer or inside a code block
 *  - 24px top margin separates ad from preceding text
 *  - 24px bottom margin separates ad from following text
 *  - Centred so it's visually distinct from the surrounding prose column
 */

import AdLabel from "./AdLabel";
import GoogleAdUnit from "./GoogleAdUnit";

interface AdInContentProps {
  slot: string;
  className?: string;
}

const isProd = Boolean(process.env.NEXT_PUBLIC_ADSENSE_ID);

export default function AdInContent({ slot, className = "" }: AdInContentProps) {
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
        {isProd ? (
          <GoogleAdUnit
            slot={slot}
            format="rectangle"
            style={{ minHeight: 280, width: "100%" }}
          />
        ) : (
          <div
            data-ad-slot={slot}
            style={{
              width: "100%",
              height: 280,
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
            <span style={{ color: "#30363d", fontSize: 11, zIndex: 1 }}>336 × 280 — In-Content</span>
          </div>
        )}
      </div>
    </div>
  );
}
