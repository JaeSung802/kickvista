"use client";

interface LocaleSwitcherProps {
  currentLocale: "ko" | "en";
  className?: string;
}

export default function LocaleSwitcher({ currentLocale, className = "" }: LocaleSwitcherProps) {
  function switchLocale(next: "ko" | "en") {
    if (next === currentLocale) return;
    const { pathname, search, hash } = window.location;
    const updated = pathname.replace(/^\/(ko|en)(\/|$)/, `/${next}$2`);
    window.location.href = updated + search + hash;
  }

  return (
    <div
      className={`inline-flex items-center bg-gray-100 border border-gray-200 rounded-full p-0.5 gap-0.5 ${className}`}
    >
      {(["ko", "en"] as const).map((locale) => {
        const active = locale === currentLocale;
        return (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
            style={{ cursor: active ? "default" : "pointer" }}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
