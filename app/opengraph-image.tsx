import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt    = "KickVista — Football Intelligence Hub";
export const size   = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #011710 0%, #022C22 45%, #064E3B 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.2)",
            display: "flex",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(2,44,34,0.5)",
            display: "flex",
            filter: "blur(40px)",
          }}
        />
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #F59E0B, #F59E0B, #F59E0B)",
            display: "flex",
          }}
        />

        {/* Symbol — pentagon network */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #022C22, #10B981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            border: "3px solid rgba(245,158,11,0.4)",
            boxShadow: "0 0 40px rgba(16,185,129,0.5)",
          }}
        >
          <span style={{ fontSize: 52, lineHeight: 1, display: "flex" }}>⚽</span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Kick
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#6ee7b7",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Vista
          </span>
        </div>

        {/* Gold tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(245,158,11,0.9)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Football Intelligence Hub
        </div>

        {/* League badges */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 44,
          }}
        >
          {["Premier League", "La Liga", "Bundesliga", "Serie A"].map((name) => (
            <div
              key={name}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 24,
                padding: "6px 18px",
                display: "flex",
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
