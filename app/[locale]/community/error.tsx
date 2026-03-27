"use client";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center max-w-sm w-full mx-4">
        <span className="text-4xl">⚽</span>
        <h2 className="text-lg font-bold text-gray-800 mt-4">
          일시적인 오류가 발생했습니다
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Community temporarily unavailable. Please try again.
        </p>
        {error.digest && (
          <p className="text-[10px] text-gray-300 mt-1 font-mono">
            {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-5 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          다시 시도 / Retry
        </button>
      </div>
    </main>
  );
}
