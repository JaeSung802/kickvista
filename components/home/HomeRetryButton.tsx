"use client";

/**
 * HomeRetryButton — reloads the page after a failed load so every home query
 * runs again (the loading skeleton shows meanwhile). Only rendered next to a
 * failure message, so it never triggers extra API calls on a healthy page.
 *
 * - retryAfterSec: the failed API requests are in a server-side backoff for
 *   this long (a reload before then would be answered without calling the
 *   API), so the button counts down and stays disabled until then.
 * - One click only: the ref guard blocks double clicks before React re-renders.
 *
 * A full reload instead of router.refresh(): in local QA a refresh after a
 * failed community query sometimes stayed pending without committing the new
 * tree, while a reload always recovered.
 */

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function HomeRetryButton({
  locale,
  retryAfterSec = 0,
}: {
  locale: Locale;
  retryAfterSec?: number;
}) {
  const [pending, setPending] = useState(false);
  const [wait, setWait] = useState(Math.max(0, Math.ceil(retryAfterSec)));
  const clicked = useRef(false);
  const isKo = locale === "ko";

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const label = pending
    ? (isKo ? "다시 불러오는 중…" : "Reloading…")
    : wait > 0
    ? (isKo ? `${wait}초 후 다시 시도` : `Try again in ${wait}s`)
    : (isKo ? "다시 시도" : "Try again");

  return (
    <button
      type="button"
      data-retry-wait={wait}
      disabled={pending || wait > 0}
      onClick={() => {
        if (clicked.current || wait > 0) return;
        clicked.current = true;
        setPending(true);
        window.location.reload();
      }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}
