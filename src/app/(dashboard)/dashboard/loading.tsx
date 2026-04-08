export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="h-3 w-20 bg-black/[0.06] rounded" />
            <div className="h-7 w-28 bg-black/[0.06] rounded" />
            <div className="h-2.5 w-16 bg-black/[0.04] rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-3">
          <div className="h-4 w-32 bg-black/[0.06] rounded" />
          <div className="h-48 bg-black/[0.04] rounded-lg" />
        </div>
        <div className="glass-card p-5 space-y-3">
          <div className="h-4 w-32 bg-black/[0.06] rounded" />
          <div className="h-48 bg-black/[0.04] rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-5 space-y-3">
        <div className="h-4 w-40 bg-black/[0.06] rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-black/[0.03] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
