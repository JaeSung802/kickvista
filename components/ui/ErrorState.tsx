"use client";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-white border border-gray-200 rounded-xl">
      <div className="w-13 h-13 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-2xl mb-4">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 text-sm font-semibold text-emerald-600 border border-emerald-500 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
