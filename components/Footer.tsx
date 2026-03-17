"use client";

const FOOTER_LINKS = {
  Leagues: ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Champions League"],
  Features: ["Live Scores", "Match Predictions", "Standings", "Team Stats", "Player Stats"],
  Company: ["About KickVista", "Contact", "Privacy Policy", "Terms of Service", "Advertise"],
};

export default function Footer() {
  return (
    <footer style={{ background: "#0d1117", borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚽</span>
              <span className="text-xl font-bold text-white">
                Kick<span style={{ color: "#22c55e" }}>Vista</span>
              </span>
            </div>
            <p style={{ color: "#8b949e" }} className="text-sm leading-relaxed mb-4">
              Your ultimate football intelligence platform. Live scores, AI predictions,
              and in-depth analysis for every major league.
            </p>
            <div className="flex items-center gap-3">
              {["𝕏", "📘", "📸", "▶️"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all"
                  style={{ background: "#161b22", border: "1px solid #30363d" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.borderColor = "#22c55e44";
                    (e.currentTarget).style.background = "#1c2128";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.borderColor = "#30363d";
                    (e.currentTarget).style.background = "#161b22";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-3">{category}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{ color: "#8b949e" }}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid #21262d" }}
        >
          <p style={{ color: "#484f58" }} className="text-xs">
            © 2026 KickVista. All rights reserved. Football data for entertainment purposes.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ color: "#484f58" }}
                className="text-xs hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
