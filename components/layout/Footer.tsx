"use client";

interface FooterProps {
  locale: "ko" | "en";
}

const content = {
  en: {
    tagline:
      "Your daily football dashboard. Live scores, AI-powered analysis, and fan discussion for every major league.",
    sections: {
      Leagues: [
        "Premier League",
        "La Liga",
        "Bundesliga",
        "Serie A",
        "Ligue 1",
        "Champions League",
      ],
      Features: [
        "Live Scores",
        "AI Match Analysis",
        "Standings",
        "Community",
        "Attendance",
      ],
      Company: [
        "About KickVista",
        "Contact",
        "Privacy Policy",
        "Terms of Service",
        "Advertise",
      ],
    },
    copyright:
      "© 2026 KickVista. All rights reserved. Football data is provided for entertainment purposes only.",
    policy: ["Privacy", "Terms", "Cookies"],
  },
  ko: {
    tagline:
      "매일 완성되는 축구 허브. 라이브 스코어, AI 분석, 주요 리그 팬 커뮤니티를 한 곳에서.",
    sections: {
      리그: [
        "프리미어리그",
        "라리가",
        "분데스리가",
        "세리에 A",
        "리그 1",
        "UEFA 챔피언스리그",
      ],
      기능: [
        "라이브 스코어",
        "AI 경기 분석",
        "순위표",
        "커뮤니티",
        "출석 체크",
      ],
      회사: [
        "KickVista 소개",
        "문의하기",
        "개인정보처리방침",
        "이용약관",
        "광고 문의",
      ],
    },
    copyright:
      "© 2026 KickVista. All rights reserved. 축구 데이터는 오락 목적으로 제공됩니다.",
    policy: ["개인정보", "이용약관", "쿠키"],
  },
};

const SOCIAL_LINKS = [
  { icon: "𝕏", label: "X / Twitter" },
  { icon: "📘", label: "Facebook" },
  { icon: "📸", label: "Instagram" },
  { icon: "▶️", label: "YouTube" },
];

export default function Footer({ locale }: FooterProps) {
  const c = content[locale];

  return (
    <footer style={{ background: "#0d1117", borderTop: "1px solid #21262d" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <a href={`/${locale}`} className="flex items-center gap-2 mb-4" style={{ textDecoration: "none" }}>
              <span className="text-xl" aria-hidden>⚽</span>
              <span className="text-lg font-black tracking-tight text-white">
                Kick<span style={{ color: "#22c55e" }}>Vista</span>
              </span>
            </a>
            <p style={{ color: "#484f58" }} className="text-xs leading-relaxed mb-5">
              {c.tagline}
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors"
                  style={{ background: "#161b22", border: "1px solid #30363d", color: "#484f58" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.borderColor = "rgba(34,197,94,0.25)";
                    (e.currentTarget).style.color = "#8b949e";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.borderColor = "#30363d";
                    (e.currentTarget).style.color = "#484f58";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(c.sections).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4" style={{ letterSpacing: "0.07em" }}>
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{ color: "#484f58" }}
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
          <p style={{ color: "#30363d" }} className="text-xs">
            {c.copyright}
          </p>
          <div className="flex items-center gap-4">
            {c.policy.map((item) => (
              <a
                key={item}
                href="#"
                style={{ color: "#30363d" }}
                className="text-xs transition-colors hover:text-white"
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
