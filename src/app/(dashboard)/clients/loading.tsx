export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-black/[0.06] rounded" />
        <div className="h-9 w-28 bg-black/[0.06] rounded-button" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/[0.06]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-black/[0.06] rounded" />
                <div className="h-3 w-20 bg-black/[0.04] rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-black/[0.03] rounded" />
            <div className="h-3 w-2/3 bg-black/[0.03] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
