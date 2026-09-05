export default function CrmLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2.5">
        <div className="h-8 w-64 sm:w-80 bg-gray-200 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-gray-200 rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-200/80 subtle-shadow space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-gray-200 rounded-full" />
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
            </div>
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="h-3 w-36 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="bg-white rounded-3xl border border-gray-200/80 subtle-shadow overflow-hidden">
        {/* Table Header / Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-brand-slate/40 flex flex-col sm:flex-row justify-between gap-4">
          <div className="h-9 w-72 max-w-full bg-gray-200 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded-xl" />
            <div className="h-9 w-24 bg-gray-200 rounded-xl" />
            <div className="h-9 w-20 bg-gray-200 rounded-xl" />
          </div>
        </div>

        {/* Rows Skeleton */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded-md" />
                  <div className="h-3 w-24 bg-gray-100 rounded-md" />
                </div>
              </div>
              <div className="hidden md:block h-4 w-28 bg-gray-200 rounded-md" />
              <div className="hidden sm:block h-6 w-24 bg-gray-100 rounded-full" />
              <div className="h-8 w-20 bg-gray-200 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
