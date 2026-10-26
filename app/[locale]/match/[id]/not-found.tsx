/**
 * 404 for /[locale]/match/[id] — the id is not a fixture id, or the API has no
 * such fixture. not-found.tsx gets no route params, so both languages are shown.
 */

import Link from "next/link";

export default function MatchNotFound() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div data-match-state="not-found" className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <span className="text-4xl" aria-hidden="true">⚽</span>
          <h1 className="text-base font-bold text-gray-900">경기를 찾을 수 없습니다</h1>
          <p className="text-sm text-gray-500">Match not found</p>
          <div className="mt-2 flex gap-4 text-sm font-semibold">
            <Link href="/ko" className="text-emerald-600 hover:text-emerald-700">← 홈으로</Link>
            <Link href="/en" className="text-emerald-600 hover:text-emerald-700">← Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
