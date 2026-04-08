export default function InvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-black/[0.06] rounded" />
        <div className="h-9 w-28 bg-black/[0.06] rounded-button" />
      </div>

      {/* Filters skeleton */}
      <div className="glass-card p-4 flex gap-3">
        <div className="h-9 w-40 bg-black/[0.04] rounded-button" />
        <div className="h-9 w-32 bg-black/[0.04] rounded-button" />
        <div className="h-9 flex-1 bg-black/[0.04] rounded-button" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card p-0">
        <div className="h-10 bg-black/[0.04] border-b border-black/[0.04]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-black/[0.03]" />
        ))}
      </div>
    </div>
  );
}
