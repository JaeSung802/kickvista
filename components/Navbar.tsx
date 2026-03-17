"use client";

export default function Navbar() {
  const navLinks = [
    { label: "Home", href: "#" },
    { label: "Leagues", href: "#leagues" },
    { label: "Matches", href: "#matches" },
    { label: "Standings", href: "#standings" },
    { label: "AI Picks", href: "#ai-analysis" },
  ];

  return (
    <header
      style={{ background: "#0d1117", borderBottom: "1px solid #30363d" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-white">
              Kick<span style={{ color: "#22c55e" }}>Vista</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{ color: "#8b949e" }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:text-white"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "#161b22";
                  (e.target as HTMLElement).style.color = "#22c55e";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = "transparent";
                  (e.target as HTMLElement).style.color = "#8b949e";
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              style={{ background: "#22c55e", color: "#0d1117" }}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            >
              ⚡ Live Scores
            </a>
            {/* Mobile hamburger */}
            <button
              style={{ color: "#8b949e" }}
              className="md:hidden p-2 rounded-lg hover:text-white"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
