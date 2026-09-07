export default function TransfersLoading() {
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Ticker skeleton */}
      <div className="h-10 bg-gray-800" />

      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            {[0, 1].map((section) => (
              <div key={section}>
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`px-5 py-4 flex items-center gap-4 ${i < 4 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-52 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
