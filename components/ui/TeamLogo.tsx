"use client";

/**
 * TeamLogo — displays a team's logo from API-Football CDN.
 * Falls back to a circular div with the team's initials when:
 *   - No logo URL is provided, or
 *   - The image fails to load (onError).
 */

import Image from "next/image";
import { useState } from "react";

interface TeamLogoProps {
  logo?: string;
  name: string;
  size?: number; // px, default 24
}

export function TeamLogo({ logo, name, size = 24 }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (!logo || failed) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        className="inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-bold shrink-0 select-none"
        title={name}
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={logo}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-contain shrink-0"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
