interface AdSensePlaceholderProps {
  size?: "banner" | "leaderboard" | "rectangle" | "skyscraper";
  label?: string;
}

const AD_SIZES = {
  banner: { width: "100%", height: "90px", desc: "728×90 Leaderboard" },
  leaderboard: { width: "100%", height: "90px", desc: "728×90 Leaderboard" },
  rectangle: { width: "300px", height: "250px", desc: "300×250 Medium Rectangle" },
  skyscraper: { width: "160px", height: "600px", desc: "160×600 Wide Skyscraper" },
};

export default function AdSensePlaceholder({
  size = "leaderboard",
  label = "Advertisement",
}: AdSensePlaceholderProps) {
  const adSize = AD_SIZES[size];

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-widest font-medium">
        {label}
      </p>
      <div
        className="shimmer relative flex items-center justify-center rounded-lg overflow-hidden mx-auto"
        style={{
          width: adSize.width,
          height: adSize.height,
          maxWidth: "100%",
          border: "1px dashed #30363d",
        }}
      >
        <div className="flex flex-col items-center gap-1 z-10">
          <span style={{ color: "#30363d" }} className="text-2xl">
            📢
          </span>
          <span style={{ color: "#30363d" }} className="text-xs font-mono">
            {adSize.desc}
          </span>
          <span style={{ color: "#21262d" }} className="text-xs">
            Google AdSense
          </span>
        </div>
      </div>
    </div>
  );
}
