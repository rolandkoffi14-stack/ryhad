export default function ContractuelLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="h-3 w-28 bg-gray-200 rounded-md" />
            <div className="h-6 w-16 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Contract Enterprise Cards skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 bg-gray-200 rounded-md" />
                  <div className="h-3 w-28 bg-gray-100 rounded-md" />
                </div>
              </div>
              <div className="h-7 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="h-20 bg-gray-50 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
