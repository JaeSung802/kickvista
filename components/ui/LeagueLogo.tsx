"use client";

/**
 * LeagueLogo — displays a league's official logo from API-Football CDN.
 *
 * Features:
 *  - White circular container (standard sports-portal look)
 *  - object-contain so badge isn't distorted
 *  - Skeleton shimmer while loading
 *  - Falls back to a ⚽ icon + initials on error
 *  - Optional green active ring + scale-up hover effect
 */

import Image from "next/image";
import { useState } from "react";

interface LeagueLogoProps {
  logo: string;            // CDN URL or emoji fallback
  name: string;            // Used for alt and initials fallback
  flag?: string;           // Emoji flag used as tertiary fallback
  size?: number;           // Container px size (default 40)
  isActive?: boolean;      // Green ring when selected
  className?: string;
}

export function LeagueLogo({
  logo,
  name,
  flag,
  size = 40,
  isActive = false,
  className = "",
}: LeagueLogoProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const isUrl = logo.startsWith("http");

  // Initials from league name (up to 2 words)
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
  };

  const ringClass = isActive
    ? "ring-2 ring-emerald-500 ring-offset-1"
    : "";

  if (!isUrl || failed) {
    // Emoji or initials fallback
    return (
      <div
        style={containerStyle}
        className={`rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden ${ringClass} ${className}`}
        title={name}
      >
        {flag ? (
          <span style={{ fontSize: size * 0.5 }}>{flag}</span>
        ) : (
          <span style={{ fontSize: size * 0.35, fontWeight: 700, color: "#6b7280" }}>
            {initials}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-110 ${ringClass} ${className}`}
      title={name}
    >
      {/* Skeleton shimmer while loading */}
      {loading && (
        <div
          className="absolute inset-0 rounded-full animate-pulse bg-gray-100"
          style={{ width: size, height: size }}
        />
      )}
      <Image
        src={logo}
        alt={name}
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        className="object-contain"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        loading="lazy"
      />
    </div>
  );
}
