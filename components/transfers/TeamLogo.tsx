"use client";

import Image from "next/image";
import { useState } from "react";

/** Up to two initials of the shown name ("Manchester City" → "MC", "아스널" → "아"). */
function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase().slice(0, /[ㄱ-힝]/.test(words[0]) ? 1 : 2);
}

/**
 * Team logo from the API-Football CDN. When there is no logo or it fails to load (also before
 * hydration — checked on mount), the team's initials are shown instead of a broken image.
 * The name is always written next to it, so the image itself is decorative (alt="").
 */
export default function TeamLogo({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden="true" data-team-fallback=""
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold leading-none text-gray-500">
        {initials(name)}
      </span>
    );
  }
  return (
    <Image src={src} alt="" width={20} height={20} unoptimized data-team-logo=""
      className="h-5 w-5 shrink-0 object-contain"
      ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setFailed(true); }}
      onError={() => setFailed(true)} />
  );
}
