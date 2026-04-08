export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-black/[0.06] rounded" />

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-black/[0.04] rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="h-3 w-20 bg-black/[0.06] rounded" />
            <div className="h-7 w-28 bg-black/[0.06] rounded" />
          </div>
        ))}
      </div>

      <div className="glass-card p-5 space-y-3">
        <div className="h-4 w-40 bg-black/[0.06] rounded" />
        <div className="h-64 bg-black/[0.04] rounded-lg" />
      </div>
    </div>
  );
}
