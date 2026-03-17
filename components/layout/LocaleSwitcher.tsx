"use client";

interface LocaleSwitcherProps {
  currentLocale: "ko" | "en";
  className?: string;
}

export default function LocaleSwitcher({ currentLocale, className = "" }: LocaleSwitcherProps) {
  function switchLocale(next: "ko" | "en") {
    if (next === currentLocale) return;
    const { pathname, search, hash } = window.location;
    // Replace leading /ko or /en segment; fall back to prepending
    const updated = pathname.replace(/^\/(ko|en)(\/|$)/, `/${next}$2`);
    window.location.href = updated + search + hash;
  }

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 999,
    padding: "2px 3px",
    gap: 2,
  };

  function pill(locale: "ko" | "en"): React.CSSProperties {
    const active = locale === currentLocale;
    return {
      padding: "4px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      cursor: active ? "default" : "pointer",
      userSelect: "none",
      transition: "background-color 0.15s, color 0.15s",
      backgroundColor: active ? "#22c55e" : "transparent",
      color: active ? "#0d1117" : "#8b949e",
      border: "none",
      outline: "none",
    };
  }

  return (
    <div style={base} className={className}>
      <button style={pill("ko")} onClick={() => switchLocale("ko")}>
        KO
      </button>
      <button style={pill("en")} onClick={() => switchLocale("en")}>
        EN
      </button>
    </div>
  );
}
